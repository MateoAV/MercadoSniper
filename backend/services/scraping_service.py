import asyncio
import aiohttp
import random
import re
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
import logging
from urllib.parse import urljoin, urlparse, parse_qs
import json
import os

from core.config import settings, USER_AGENTS, BROWSER_HEADERS
from models.vehicle import VehicleCreate, ScrapingJob, ScrapingJobStatus, ScrapingJobType
from services.websocket_manager import WebSocketManager
from services.ml_extraction_service import ml_extractor

logger = logging.getLogger(__name__)

class MercadoLibreScraper:
    """MercadoLibre scraping service"""
    
    def __init__(self, websocket_manager: WebSocketManager):
        self.base_url = settings.MERCADOLIBRE_BASE_URL
        self.items_per_page = settings.MERCADOLIBRE_ITEMS_PER_PAGE
        self.websocket_manager = websocket_manager
        self.session: Optional[aiohttp.ClientSession] = None

    def _is_test_vehicle(self, vehicle_data: Dict[str, Any]) -> bool:
        """
        Detect test/honeypot vehicles to avoid storing them in the database.
        These are typically used to catch bots and should be filtered out.
        """
        test_patterns = [
            r'test',           # "test" in any case
            r'MCO-TEST',       # MercadoLibre test IDs
            r'test\.com',      # test.com domain
            r'honeypot',       # explicit honeypot mentions
            r'dummy',          # dummy data
            r'fake',           # fake data
        ]
        
        # Compile patterns for case-insensitive matching
        compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in test_patterns]
        
        # Check various fields for test indicators
        fields_to_check = [
            vehicle_data.get('mercadolibre_id', ''),
            vehicle_data.get('url', ''),
            vehicle_data.get('image_url', ''),
            vehicle_data.get('title', ''),
        ]
        
        for field_value in fields_to_check:
            if field_value and isinstance(field_value, str):
                for pattern in compiled_patterns:
                    if pattern.search(field_value):
                        logger.info(f"🚫 Test vehicle detected: {vehicle_data.get('title', 'Unknown')} - Pattern: {pattern.pattern}")
                        return True
        
        return False

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=settings.SCRAPING_TIMEOUT),
            connector=aiohttp.TCPConnector(limit=settings.SCRAPING_CONCURRENT_REQUESTS)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get randomized headers for scraping"""
        headers = BROWSER_HEADERS.copy()
        headers["User-Agent"] = random.choice(USER_AGENTS)
        return headers

    async def _stealth_get(self, url: str, retries: int = 3) -> Optional[aiohttp.ClientResponse]:
        """Make a stealth HTTP request with retries"""
        if settings.DEBUG_SCRAPING:
            logger.info(f"🔍 DEBUG: Starting request to {url}")
            
        for attempt in range(retries):
            try:
                # Random delay to mimic human browsing
                delay = random.uniform(settings.SCRAPING_DELAY_MIN, settings.SCRAPING_DELAY_MAX)
                if settings.DEBUG_SCRAPING:
                    logger.info(f"🔍 DEBUG: Waiting {delay:.2f}s before request (attempt {attempt + 1})")
                await asyncio.sleep(delay)
                
                headers = self._get_headers()
                if settings.DEBUG_SCRAPING:
                    logger.info(f"🔍 DEBUG: Using headers: {json.dumps(headers, indent=2)}")
                
                async with self.session.get(url, headers=headers) as response:
                    if settings.DEBUG_SCRAPING:
                        logger.info(f"🔍 DEBUG: Response status: {response.status}")
                        logger.info(f"🔍 DEBUG: Response headers: {dict(response.headers)}")
                        
                    if response.status == 200:
                        html_content = await response.text()
                        
                        if settings.DEBUG_SCRAPING:
                            logger.info(f"🔍 DEBUG: Response content length: {len(html_content)} characters")
                            logger.info(f"🔍 DEBUG: First 500 chars: {html_content[:500]}")
                            
                        if settings.DEBUG_SAVE_HTML:
                            # Save HTML to debug file
                            debug_filename = f"debug_response_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                            try:
                                with open(debug_filename, 'w', encoding='utf-8') as f:
                                    f.write(html_content)
                                logger.info(f"🔍 DEBUG: Saved HTML response to {debug_filename}")
                            except Exception as e:
                                logger.error(f"🔍 DEBUG: Failed to save HTML: {e}")
                        
                        if settings.DEBUG_PRINT_RESPONSE:
                            logger.info(f"🔍 DEBUG: Full response content:\n{html_content}")
                            
                        # Create a new response object with the content
                        class DebugResponse:
                            def __init__(self, status, headers, content):
                                self.status = status
                                self.headers = headers
                                self._content = content
                            
                            async def text(self):
                                return self._content
                                
                        return DebugResponse(response.status, response.headers, html_content)
                        
                    elif response.status == 429:  # Rate limited
                        wait_time = random.uniform(5, 15)
                        logger.warning(f"⚠️  Rate limited, waiting {wait_time}s before retry")
                        if settings.DEBUG_SCRAPING:
                            logger.info(f"🔍 DEBUG: Rate limit response body: {await response.text()}")
                        await asyncio.sleep(wait_time)
                    else:
                        logger.warning(f"⚠️  HTTP {response.status} for URL: {url}")
                        if settings.DEBUG_SCRAPING:
                            error_content = await response.text()
                            logger.info(f"🔍 DEBUG: Error response body: {error_content[:1000]}")
                        
            except aiohttp.ClientError as e:
                logger.error(f"❌ Network error (attempt {attempt + 1}): {e}")
                if settings.DEBUG_SCRAPING:
                    logger.info(f"🔍 DEBUG: ClientError details: {type(e).__name__}: {str(e)}")
            except Exception as e:
                logger.error(f"❌ Request failed (attempt {attempt + 1}): {e}")
                if settings.DEBUG_SCRAPING:
                    logger.info(f"🔍 DEBUG: Exception details: {type(e).__name__}: {str(e)}")
                    import traceback
                    logger.info(f"🔍 DEBUG: Traceback: {traceback.format_exc()}")
                    
            if attempt < retries - 1:
                retry_wait = random.uniform(2, 5)
                if settings.DEBUG_SCRAPING:
                    logger.info(f"🔍 DEBUG: Waiting {retry_wait:.2f}s before retry")
                await asyncio.sleep(retry_wait)
                
        logger.error(f"❌ All {retries} attempts failed for URL: {url}")
        return None

    def _extract_mercadolibre_id(self, url: str) -> str:
        """Extract MercadoLibre ID from URL"""
        # Pattern: MCO-XXXXXXX-description
        match = re.search(r'MCO-(\d+)', url)
        if match:
            return f"MCO-{match.group(1)}"
        
        # Fallback: try to extract from URL path
        parsed = urlparse(url)
        path_parts = parsed.path.split('/')
        for part in path_parts:
            if part.startswith('MCO-'):
                return part.split('-')[0] + '-' + part.split('-')[1]
                
        return url  # Fallback to full URL

    def _parse_price(self, price_text: str) -> Tuple[str, Optional[float]]:
        """Parse price text and extract numeric value"""
        if not price_text:
            return "No price", None
            
        # Remove currency symbols, dots, and spaces
        numeric_price = re.sub(r'[^\d,]', '', price_text)
        numeric_price = numeric_price.replace(',', '.')
        
        try:
            return price_text.strip(), float(numeric_price)
        except (ValueError, AttributeError):
            return price_text.strip(), None

    def _extract_vehicle_details(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract detailed vehicle information from single listing page"""
        details = {}
        
        try:
            # Extract specifications table
            specs_section = soup.find("section", {"data-testid": "specifications"})
            if specs_section:
                spec_items = specs_section.find_all("div", class_="ui-pdp-specs__item")
                for item in spec_items:
                    label_elem = item.find("span", class_="ui-pdp-specs__item__label")
                    value_elem = item.find("span", class_="ui-pdp-specs__item__value")
                    
                    if label_elem and value_elem:
                        label = label_elem.text.strip()
                        value = value_elem.text.strip()
                        
                        # Map common specifications
                        if "marca" in label.lower():
                            details["brand"] = value
                        elif "modelo" in label.lower():
                            details["model"] = value
                        elif "año" in label.lower():
                            details["year"] = value
                        elif "kilómetros" in label.lower() or "kilometraje" in label.lower():
                            details["kilometers"] = value
                        elif "motor" in label.lower() or "cilindrada" in label.lower():
                            details["engine"] = value
                        elif "transmisión" in label.lower() or "caja" in label.lower():
                            details["transmission"] = value
                        elif "combustible" in label.lower():
                            details["fuel_type"] = value
                        elif "color" in label.lower():
                            details["color"] = value
                        elif "puertas" in label.lower():
                            try:
                                details["doors"] = int(value)
                            except ValueError:
                                details["doors"] = value

            # Extract description
            description_elem = soup.find("div", class_="ui-pdp-description__content")
            if description_elem:
                details["description"] = description_elem.get_text(strip=True)

            # Extract seller information
            seller_elem = soup.find("div", class_="ui-box-component__seller")
            if seller_elem:
                seller_name = seller_elem.find("span", class_="ui-pdp-seller__header__title")
                if seller_name:
                    details["seller_name"] = seller_name.text.strip()

        except Exception as e:
            logger.error(f"Error extracting vehicle details: {e}")

        return details

    def _extract_json_data(self, html_content: str) -> Optional[dict]:
        """Extract JSON data from __PRELOADED_STATE__ script tag"""
        try:
            # Find the preloaded state JSON
            start_marker = '"pageState":{"initialState":'
            start_pos = html_content.find(start_marker)
            if start_pos == -1:
                logger.warning("⚠️  Could not find pageState in HTML")
                return None
            
            # Start after the marker
            start_pos += len(start_marker) - 1  # Include the opening brace
            
            # Find the closing brace by counting brackets
            brace_count = 0
            pos = start_pos
            
            while pos < len(html_content):
                char = html_content[pos]
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        break
                pos += 1
            
            if brace_count != 0:
                logger.warning("⚠️  Could not find complete JSON object")
                return None
            
            # Extract JSON string and parse
            json_str = html_content[start_pos:pos + 1]
            data = json.loads(json_str)
            
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Successfully extracted JSON data with keys: {list(data.keys())}")
            
            return data
            
        except Exception as e:
            logger.error(f"❌ Error extracting JSON data: {e}")
            if settings.DEBUG_SCRAPING:
                import traceback
                logger.info(f"🔍 DEBUG: JSON extraction traceback: {traceback.format_exc()}")
            return None

    def _extract_vehicle_from_json(self, data: dict, url: str) -> Optional[VehicleCreate]:
        """Extract vehicle information from JSON data"""
        try:
            # Find title
            title = "No title"
            if "short_description" in data:
                for component in data["short_description"]:
                    if component.get("type") == "header":
                        title = component.get("title", "No title")
                        break
            
            # Find price
            price_text = "No price"
            price_numeric = None
            if "short_description" in data:
                for component in data["short_description"]:
                    if component.get("type") == "price":
                        price_data = component.get("price", {})
                        price_numeric = price_data.get("value")
                        currency_symbol = price_data.get("currency_symbol", "$")
                        if price_numeric:
                            price_text = f"{currency_symbol}{price_numeric:,}"
                        break
            
            # Find images
            image_url = "Not found"
            if "fixed" in data and "gallery" in data["fixed"]:
                pictures = data["fixed"]["gallery"].get("pictures", [])
                if pictures:
                    first_pic = pictures[0]
                    pic_id = first_pic.get("id", "")
                    if pic_id:
                        # Construct image URL using the template
                        image_url = f"https://http2.mlstatic.com/D_NQ_NP_{pic_id}-O.webp"
            
            # Extract location and other details from content components
            location = "Not found"
            year = "Not found"
            kilometers = "Not found"
            brand = "Not found"
            model = "Not found"
            color = "Not found"
            fuel_type = "Not found"
            doors = None
            
            # Look for specifications in highlighted_specs_attrs
            if "content_left" in data:
                for component in data["content_left"]:
                    if component.get("id") == "highlighted_specs_attrs":
                        components = component.get("components", [])
                        for spec_component in components:
                            if spec_component.get("type") == "key_value":
                                title_data = spec_component.get("title", {})
                                if "values" in title_data:
                                    key = title_data["values"].get("key", {}).get("text", "")
                                    value = title_data["values"].get("value", {}).get("text", "")
                                    
                                    if "Color:" in key:
                                        color = value
                                    elif "Puertas:" in key:
                                        try:
                                            doors = int(value)
                                        except:
                                            doors = value
                                    elif "Tipo de combustible:" in key:
                                        fuel_type = value
            
            # Extract brand and model from title
            if title and title != "No title":
                title_parts = title.split()
                if len(title_parts) >= 2:
                    brand = title_parts[0]
                    model = title_parts[1]
            
            # Get MercadoLibre ID
            mercadolibre_id = self._extract_mercadolibre_id(url)
            
            # Check if this is a test vehicle before creating
            vehicle_dict = {
                'title': title,
                'mercadolibre_id': mercadolibre_id,
                'url': url,
                'image_url': image_url
            }
            
            if self._is_test_vehicle(vehicle_dict):
                logger.info(f"🚫 Skipping test vehicle: {title}")
                return None
            
            # Create vehicle object
            vehicle_data = VehicleCreate(
                title=title,
                price=price_text,
                price_numeric=price_numeric,
                mercadolibre_id=mercadolibre_id,
                url=url,
                location=location,
                image_url=image_url,
                year=year,
                kilometers=kilometers,
                brand=brand,
                model=model,
                color=color,
                fuel_type=fuel_type,
                doors=doors
            )
            
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Extracted from JSON - Title: {title}, Price: {price_text}, Brand: {brand}")
            
            return vehicle_data
            
        except Exception as e:
            logger.error(f"❌ Error extracting vehicle from JSON: {e}")
            if settings.DEBUG_SCRAPING:
                import traceback
                logger.info(f"🔍 DEBUG: JSON vehicle extraction traceback: {traceback.format_exc()}")
            return None

    async def scrape_single_vehicle(self, url: str) -> Optional[VehicleCreate]:
        """Scrape a single vehicle listing using the proven ml_bs4_scrape_test.py approach"""
        try:
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Starting single vehicle scraping for {url}")
                
            response = await self._stealth_get(url)
            if not response:
                logger.error(f"❌ No response received for {url}")
                return None

            html_content = await response.text()
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Received HTML content, length: {len(html_content)}")
                
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Check for CAPTCHA or blocking (same as working script)
            if soup.find("title") and "robot" in soup.find("title").text.lower():
                logger.warning("🤖 Blocked by MercadoLibre: CAPTCHA detected")
                return None

            # Extract title using the exact same approach as working script
            title_elem = soup.find("h1", class_="ui-pdp-title")
            title = title_elem.text.strip() if title_elem else "Not found"
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Title found: {title}")

            # Extract price using the exact same approach as working script
            price_elem = soup.find("span", class_="andes-money-amount__fraction")
            price_text = price_elem.text.strip() if price_elem else "Not found"
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Price found: {price_text}")
            
            # Parse price numeric value (Colombian peso format)
            price_numeric = None
            if price_text and price_text != "Not found":
                try:
                    # Colombian peso format: "23.700.000" (dots as thousand separators)
                    # Remove any non-numeric characters except dots
                    numeric_price = re.sub(r'[^\d.]', '', price_text)
                    # Replace dots with empty string (Colombian format uses dots as thousand separators)
                    numeric_price = numeric_price.replace('.', '')
                    price_numeric = float(numeric_price)
                    if settings.DEBUG_SCRAPING:
                        logger.info(f"🔍 DEBUG: Parsed price '{price_text}' -> {price_numeric}")
                except (ValueError, AttributeError) as e:
                    if settings.DEBUG_SCRAPING:
                        logger.info(f"🔍 DEBUG: Failed to parse price '{price_text}': {e}")
                    price_numeric = None

            # Extract location (try multiple approaches)
            location = "Not found"
            # Try the common location selectors
            location_selectors = [
                "p.ui-pdp-color--GRAY.ui-pdp-size--XSMALL.ui-pdp-family--REGULAR",
                ".ui-pdp-color--GRAY",
                ".item-location",
                "[data-testid*='location']"
            ]
            
            for selector in location_selectors:
                location_elem = soup.select_one(selector)
                if location_elem and location_elem.text.strip():
                    location = location_elem.text.strip()
                    break
            
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Location found: {location}")

            # Extract main image
            image_url = "Not found"
            # Try multiple image selectors
            image_selectors = [
                "img.ui-pdp-image.ui-pdp-gallery__figure__image",
                ".ui-pdp-gallery img",
                ".gallery img",
                "img[src*='mlstatic']",
                ".carousel img"
            ]
            
            for selector in image_selectors:
                img_elem = soup.select_one(selector)
                if img_elem and img_elem.get("src"):
                    image_url = img_elem["src"]
                    break
            
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Image URL found: {image_url}")

            # Get MercadoLibre ID
            mercadolibre_id = self._extract_mercadolibre_id(url)
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Extracted MercadoLibre ID: {mercadolibre_id}")

            # Extract basic vehicle specifications from the page
            year = "Not found"
            kilometers = "Not found"
            brand = "Not found"
            model = "Not found"
            color = "Not found"
            fuel_type = "Not found"
            doors = None
            
            # Try to extract specifications from various sections
            specs_sections = [
                soup.find("section", {"data-testid": "specifications"}),
                soup.find("div", class_="ui-pdp-specs"),
                soup.find("div", class_="specifications")
            ]
            
            for specs_section in specs_sections:
                if not specs_section:
                    continue
                    
                # Look for spec items
                spec_items = specs_section.find_all("div", class_="ui-pdp-specs__item")
                for item in spec_items:
                    label_elem = item.find("span", class_="ui-pdp-specs__item__label")
                    value_elem = item.find("span", class_="ui-pdp-specs__item__value")
                    
                    if label_elem and value_elem:
                        label = label_elem.text.strip().lower()
                        value = value_elem.text.strip()
                        
                        if "marca" in label:
                            brand = value
                        elif "modelo" in label:
                            model = value
                        elif "año" in label:
                            year = value
                        elif "kilómetros" in label or "kilometraje" in label:
                            kilometers = value
                        elif "motor" in label or "cilindrada" in label:
                            pass  # Could add engine field
                        elif "transmisión" in label or "caja" in label:
                            pass  # Could add transmission field
                        elif "combustible" in label:
                            fuel_type = value
                        elif "color" in label:
                            color = value
                        elif "puertas" in label:
                            try:
                                doors = int(value)
                            except ValueError:
                                doors = value
                break  # Use first valid specs section
            
            # Try to extract brand/model/edition from title using ML if not found in specs
            if brand == "Not found" or model == "Not found":
                ml_info = ml_extractor.extract_vehicle_info(title)
                if brand == "Not found":
                    brand = ml_info.get('brand', 'Not found')
                if model == "Not found":
                    model = ml_info.get('model', 'Not found')
            
            # Always extract edition using ML (not available from specs usually)
            ml_info = ml_extractor.extract_vehicle_info(title)
            edition = ml_info.get('edition', 'Not found')

            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Extracted specs - Year: {year}, Kilometers: {kilometers}, Brand: {brand}, Model: {model}, Edition: {edition}")

            # Check if this is a test vehicle before creating
            vehicle_dict = {
                'title': title,
                'mercadolibre_id': mercadolibre_id,
                'url': url,
                'image_url': image_url
            }
            
            if self._is_test_vehicle(vehicle_dict):
                logger.info(f"🚫 Skipping test vehicle: {title}")
                return None

            # Create vehicle object
            vehicle_data = VehicleCreate(
                title=title,
                price=price_text,
                price_numeric=price_numeric,
                mercadolibre_id=mercadolibre_id,
                url=url,
                location=location,
                image_url=image_url,
                year=year,
                kilometers=kilometers,
                brand=brand,
                model=model,
                edition=edition,
                color=color,
                fuel_type=fuel_type,
                doors=doors
            )

            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Successfully created vehicle data")
                logger.info(f"  Title: {title}")
                logger.info(f"  Price: {price_text} (numeric: {price_numeric})")
                logger.info(f"  Brand: {brand}")
                logger.info(f"  Model: {model}")
                logger.info(f"  Year: {year}")

            return vehicle_data

        except Exception as e:
            logger.error(f"❌ Error scraping single vehicle {url}: {e}")
            if settings.DEBUG_SCRAPING:
                import traceback
                logger.info(f"🔍 DEBUG: Full traceback: {traceback.format_exc()}")
            return None

    def _extract_listings_from_json(self, html_content: str) -> List[dict]:
        """Extract listings from search results JSON data"""
        try:
            # Look for search results in various JSON structures
            listings = []
            
            # Try to find results in window.__NEXT_DATA__ or similar structures
            json_patterns = [
                r'"results":\s*(\[.*?\])',
                r'"items":\s*(\[.*?\])',
                r'"listingItems":\s*(\[.*?\])'
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, html_content, re.DOTALL)
                for match in matches:
                    try:
                        items = json.loads(match)
                        if isinstance(items, list) and items:
                            listings.extend(items)
                            if settings.DEBUG_SCRAPING:
                                logger.info(f"🔍 DEBUG: Found {len(items)} listings using pattern: {pattern}")
                    except json.JSONDecodeError:
                        continue
            
            return listings
            
        except Exception as e:
            logger.error(f"❌ Error extracting listings from JSON: {e}")
            return []

    async def scrape_listings_page(self, page_url: str) -> List[VehicleCreate]:
        """Scrape vehicle listings from a single page using reliable HTML parsing"""
        vehicles = []
        
        try:
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Starting bulk scraping for page {page_url}")
                
            response = await self._stealth_get(page_url)
            if not response:
                logger.error(f"❌ No response received for {page_url}")
                return vehicles

            html_content = await response.text()
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Received HTML content, length: {len(html_content)}")
                
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Check for CAPTCHA or blocking (same as working script)
            if soup.find("title") and "robot" in soup.find("title").text.lower():
                logger.warning("🤖 Blocked by MercadoLibre: CAPTCHA detected")
                return vehicles

            if settings.DEBUG_SCRAPING:
                page_title = soup.find("title")
                logger.info(f"🔍 DEBUG: Page title: {page_title.text if page_title else 'No title'}")

            # Find listing items using multiple selector strategies
            items = []
            
            # Try different selectors for listing items
            selectors_to_try = [
                "li.ui-search-layout__item",
                "div.ui-search-result",
                ".search-results .ui-search-result", 
                "li[class*='search-result']",
                "li[class*='ui-search']",
                ".results-item",
                ".poly-card"
            ]
            
            for selector in selectors_to_try:
                items = soup.select(selector)
                if items:
                    if settings.DEBUG_SCRAPING:
                        logger.info(f"🔍 DEBUG: Found {len(items)} items using selector: {selector}")
                    break
            
            if not items:
                logger.warning("⚠️  No listings found - page structure may have changed")
                if settings.DEBUG_SCRAPING:
                    logger.info("🔍 DEBUG: Available li classes (first 10):")
                    all_lis = soup.find_all("li")[:10]
                    for i, li in enumerate(all_lis):
                        classes = li.get('class', [])
                        logger.info(f"  li[{i}]: {classes}")
                return vehicles

            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Processing {len(items)} listing items")

            for i, item in enumerate(items):
                try:
                    if settings.DEBUG_SCRAPING and i < 3:  # Debug first 3 items
                        logger.info(f"🔍 DEBUG: Processing item {i+1}")
                    
                    # Extract title and URL - try multiple approaches
                    title = "No title"
                    vehicle_url = ""
                    
                    # Try different title selectors
                    title_selectors = [
                        "a.poly-component__title",
                        "h2.poly-box a",
                        ".ui-search-item__title a", 
                        "a[title]",
                        ".ui-search-item__group__element h2 a",
                        ".ui-search-link"
                    ]
                    
                    for selector in title_selectors:
                        title_elem = item.select_one(selector)
                        if title_elem:
                            title = title_elem.text.strip()
                            vehicle_url = title_elem.get("href", "")
                            if vehicle_url and not vehicle_url.startswith("http"):
                                vehicle_url = "https://carro.mercadolibre.com.co" + vehicle_url
                            break
                    
                    if not vehicle_url:
                        continue
                    
                    if settings.DEBUG_SCRAPING and i < 3:
                        logger.info(f"🔍 DEBUG: Item {i+1} - Title: {title[:50]}...")
                        logger.info(f"🔍 DEBUG: Item {i+1} - URL: {vehicle_url}")

                    # Extract price - try multiple approaches
                    price_text = "Not found"
                    price_numeric = None
                    
                    price_selectors = [
                        "span.andes-money-amount__fraction",
                        ".price-tag .price", 
                        ".ui-search-price__part span.andes-money-amount__fraction",
                        ".price .andes-money-amount__fraction"
                    ]
                    
                    for selector in price_selectors:
                        price_elem = item.select_one(selector)
                        if price_elem:
                            price_text = price_elem.text.strip()
                            # Parse numeric value
                            try:
                                numeric_price = re.sub(r'[^\d,.]', '', price_text)
                                numeric_price = numeric_price.replace(',', '')
                                price_numeric = float(numeric_price)
                            except (ValueError, AttributeError):
                                price_numeric = None
                            break

                    # Extract year and kilometers from attributes
                    year = "Not found"
                    kilometers = "Not found"
                    
                    attrs_selectors = [
                        "ul.poly-attributes_list li",
                        ".ui-search-item__group--attributes li",
                        ".item-attributes li"
                    ]
                    
                    for selector in attrs_selectors:
                        attrs = item.select(selector)
                        if len(attrs) >= 2:
                            year = attrs[0].text.strip()
                            kilometers = attrs[1].text.strip()
                            break

                    # Extract location
                    location = "Not found"
                    location_selectors = [
                        "span.poly-component__location",
                        ".ui-search-item__group--location span",
                        ".item-location"
                    ]
                    
                    for selector in location_selectors:
                        location_elem = item.select_one(selector)
                        if location_elem:
                            location = location_elem.text.strip()
                            break

                    # Extract image URL
                    image_url = "Not found"
                    img_elem = item.select_one("img")
                    if img_elem:
                        # Try various image URL attributes
                        for attr in ["src", "data-src", "data-lazy", "data-original"]:
                            img_url = img_elem.get(attr, "")
                            if img_url and img_url.startswith("http"):
                                image_url = img_url
                                break

                    # Get MercadoLibre ID
                    mercadolibre_id = self._extract_mercadolibre_id(vehicle_url)

                    # Extract brand, model, and edition using ML extractor
                    ml_info = ml_extractor.extract_vehicle_info(title)
                    brand = ml_info.get('brand', 'Not found')
                    model = ml_info.get('model', 'Not found')
                    edition = ml_info.get('edition', 'Not found')
                    
                    if settings.DEBUG_SCRAPING and i < 3:
                        logger.info(f"🔍 DEBUG: Item {i+1} - ML extraction: Brand={brand}, Model={model}, Edition={edition}")
                    
                    # Apply price parsing (same fix as single vehicle)
                    price_numeric_fixed = None
                    if price_text and price_text != "Not found":
                        try:
                            # Colombian peso format: "23.700.000" (dots as thousand separators)
                            numeric_price = re.sub(r'[^\d.]', '', price_text)
                            numeric_price = numeric_price.replace('.', '')
                            price_numeric_fixed = float(numeric_price)
                            if settings.DEBUG_SCRAPING and i < 3:
                                logger.info(f"🔍 DEBUG: Item {i+1} - Parsed price '{price_text}' -> {price_numeric_fixed}")
                        except (ValueError, AttributeError):
                            price_numeric_fixed = None

                    # Check if this is a test vehicle before creating
                    vehicle_dict = {
                        'title': title,
                        'mercadolibre_id': mercadolibre_id,
                        'url': vehicle_url,
                        'image_url': image_url
                    }
                    
                    if self._is_test_vehicle(vehicle_dict):
                        logger.info(f"🚫 Skipping test vehicle in listings: {title}")
                        continue

                    # Create vehicle object
                    vehicle = VehicleCreate(
                        title=title,
                        price=price_text,
                        price_numeric=price_numeric_fixed,
                        mercadolibre_id=mercadolibre_id,
                        url=vehicle_url,
                        year=year,
                        kilometers=kilometers,
                        location=location,
                        image_url=image_url,
                        brand=brand,
                        model=model,
                        edition=edition
                    )

                    vehicles.append(vehicle)
                    
                    if settings.DEBUG_SCRAPING and i < 3:
                        logger.info(f"🔍 DEBUG: Item {i+1} successfully parsed")

                except Exception as e:
                    logger.error(f"❌ Error parsing listing item {i+1}: {e}")
                    if settings.DEBUG_SCRAPING:
                        import traceback
                        logger.info(f"🔍 DEBUG: Item parsing traceback: {traceback.format_exc()}")
                    continue

            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Successfully extracted {len(vehicles)} vehicles from listings page")

        except Exception as e:
            logger.error(f"❌ Error scraping listings page {page_url}: {e}")
            if settings.DEBUG_SCRAPING:
                import traceback
                logger.info(f"🔍 DEBUG: Full traceback: {traceback.format_exc()}")

        return vehicles

    async def scrape_all_listings(self, job_id: str, max_pages: Optional[int] = None) -> List[VehicleCreate]:
        """Scrape all vehicle listings from MercadoLibre"""
        all_vehicles = []
        page = 1
        start = 1

        # Emit initial progress
        await self.websocket_manager.send_scraping_update(
            job_id,
            "running",
            progress_percentage=0,
            message="Starting to scrape listings..."
        )

        while True:
            if max_pages and page > max_pages:
                break

            # Construct URL
            if start == 1:
                url = self.base_url
            else:
                url = f"{self.base_url}/_Desde_{start}_NoIndex_True"

            logger.info(f"Scraping page {page}: {url}")

            # Emit progress update
            await self.websocket_manager.send_scraping_update(
                job_id,
                "running",
                current_page=page,
                current_url=url,
                vehicles_found=len(all_vehicles),
                message=f"Scraping page {page}..."
            )

            # Scrape the page
            page_vehicles = await self.scrape_listings_page(url)
            
            if not page_vehicles:
                logger.info(f"No vehicles found on page {page}. Ending scraping.")
                break

            all_vehicles.extend(page_vehicles)
            logger.info(f"Found {len(page_vehicles)} vehicles on page {page}")

            # Check if this was the last page
            if len(page_vehicles) < self.items_per_page:
                logger.info("Last page reached")
                break

            # Move to next page
            start += self.items_per_page
            page += 1

        # Emit completion
        await self.websocket_manager.send_scraping_update(
            job_id,
            "completed",
            progress_percentage=100,
            total_vehicles=len(all_vehicles),
            total_pages=page,
            message=f"Scraping completed! Found {len(all_vehicles)} vehicles."
        )

        logger.info(f"Scraping completed. Total vehicles found: {len(all_vehicles)}")
        return all_vehicles

    async def scrape_all_listings_with_incremental_save(self, job_id: str, max_pages: Optional[int], vehicle_service, db) -> List[VehicleCreate]:
        """Scrape all vehicle listings with incremental saving after each page"""
        all_vehicles = []
        page = 1
        start = 1
        total_saved = 0
        total_failed = 0

        # Emit initial progress
        await self.websocket_manager.send_scraping_update(
            job_id,
            "running",
            progress_percentage=0,
            current_page=0,
            vehicles_found=0,
            vehicles_saved=0,
            message="Starting to scrape listings..."
        )

        while True:
            if max_pages and page > max_pages:
                break

            # Construct URL
            if start == 1:
                url = self.base_url
            else:
                url = f"{self.base_url}/_Desde_{start}_NoIndex_True"

            logger.info(f"Scraping page {page}: {url}")

            # Emit progress update for page start
            await self.websocket_manager.send_scraping_update(
                job_id,
                "running",
                current_page=page,
                current_url=url,
                vehicles_found=len(all_vehicles),
                vehicles_saved=total_saved,
                message=f"Scraping page {page}..."
            )

            # Scrape the page
            page_vehicles = await self.scrape_listings_page(url)
            
            if not page_vehicles:
                logger.info(f"No vehicles found on page {page}. Ending scraping.")
                break

            all_vehicles.extend(page_vehicles)
            logger.info(f"Found {len(page_vehicles)} vehicles on page {page}")

            # Save vehicles from this page to database immediately
            page_saved = 0
            page_failed = 0
            
            for vehicle_data in page_vehicles:
                try:
                    saved_vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data, job_id)
                    page_saved += 1
                    total_saved += 1
                except Exception as e:
                    logger.error(f"Error saving vehicle {vehicle_data.mercadolibre_id}: {e}")
                    page_failed += 1
                    total_failed += 1

            logger.info(f"Page {page}: Saved {page_saved} vehicles, failed {page_failed}")

            # Calculate progress percentage
            if max_pages:
                progress_percentage = (page / max_pages) * 100
                logger.info(f"🔍 DEBUG: Progress calculation - page: {page}, max_pages: {max_pages}, progress: {progress_percentage}%")
            else:
                # For unlimited pages, we can't calculate exact progress
                # Use a formula based on vehicles found
                progress_percentage = min(95, (len(all_vehicles) / 100) * 10)  # Cap at 95% until completion
                logger.info(f"🔍 DEBUG: Progress calculation (unlimited) - vehicles: {len(all_vehicles)}, progress: {progress_percentage}%")

            # Update job status in database after each page
            await db.scraping_jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "total_items": len(all_vehicles),
                        "processed_items": len(all_vehicles),
                        "successful_items": total_saved,
                        "failed_items": total_failed,
                        "progress_percentage": progress_percentage,
                        "results": {
                            "total_scraped": len(all_vehicles),
                            "saved_to_db": total_saved,
                            "failed_to_save": total_failed,
                            "current_page": page,
                            "last_page_vehicles": len(page_vehicles)
                        }
                    }
                }
            )

            # Emit progress update for page completion
            await self.websocket_manager.send_scraping_update(
                job_id,
                "running",
                progress_percentage=progress_percentage,
                current_page=page,
                vehicles_found=len(all_vehicles),
                vehicles_saved=total_saved,
                vehicles_failed=total_failed,
                page_vehicles=len(page_vehicles),
                page_saved=page_saved,
                page_failed=page_failed,
                message=f"Page {page} completed: {page_saved} vehicles saved"
            )

            # Check if this was the last page
            if len(page_vehicles) < self.items_per_page:
                logger.info("Last page reached")
                break

            # Move to next page
            start += self.items_per_page
            page += 1

        # Final completion update
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "progress_percentage": 100.0,
                    "total_items": len(all_vehicles),
                    "processed_items": len(all_vehicles),
                    "successful_items": total_saved,
                    "failed_items": total_failed,
                    "results": {
                        "total_scraped": len(all_vehicles),
                        "saved_to_db": total_saved,
                        "failed_to_save": total_failed,
                        "total_pages": page,
                        "final_message": f"Scraping completed! Processed {page} pages, saved {total_saved} vehicles."
                    }
                }
            }
        )

        # Emit final completion
        await self.websocket_manager.send_scraping_update(
            job_id,
            "completed",
            progress_percentage=100,
            total_vehicles=len(all_vehicles),
            vehicles_saved=total_saved,
            vehicles_failed=total_failed,
            total_pages=page,
            message=f"Scraping completed! Found {len(all_vehicles)} vehicles, saved {total_saved}."
        )

        logger.info(f"Scraping completed. Total vehicles found: {len(all_vehicles)}, saved: {total_saved}, failed: {total_failed}")
        return all_vehicles 