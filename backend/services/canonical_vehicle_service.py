import asyncio
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
import re
from difflib import SequenceMatcher
from bson import ObjectId

from models.vehicle import (
    CanonicalVehicle,
    CanonicalVehicleCreate,
    CanonicalVehicleUpdate,
    CanonicalVehicleStatus,
    Vehicle,
    VehicleCreate
)

logger = logging.getLogger(__name__)

class CanonicalVehicleService:
    """Service for canonical vehicle operations and grouping logic"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.canonical_vehicles_collection = db.canonical_vehicles
        self.vehicles_collection = db.vehicles
        self.price_history_collection = db.price_history

    async def create_canonical_vehicle(self, canonical_data: CanonicalVehicleCreate) -> CanonicalVehicle:
        """Create a new canonical vehicle"""
        try:
            canonical_dict = canonical_data.dict()
            canonical_dict["created_at"] = datetime.utcnow()
            canonical_dict["updated_at"] = datetime.utcnow()
            canonical_dict["status"] = CanonicalVehicleStatus.ACTIVE
            canonical_dict["total_listings"] = 0
            canonical_dict["active_listings"] = 0
            canonical_dict["total_views"] = 0
            
            # Generate canonical title if not provided
            if not canonical_dict.get("canonical_title"):
                canonical_dict["canonical_title"] = self._generate_canonical_title(canonical_data)
            
            result = await self.canonical_vehicles_collection.insert_one(canonical_dict)
            
            created_canonical = await self.canonical_vehicles_collection.find_one({"_id": result.inserted_id})
            created_canonical["_id"] = str(created_canonical["_id"])
            return CanonicalVehicle(**created_canonical)
            
        except Exception as e:
            logger.error(f"Error creating canonical vehicle: {e}")
            raise

    async def find_or_create_canonical_vehicle(self, vehicle_data: VehicleCreate) -> Optional[str]:
        """Find existing canonical vehicle or create new one based on vehicle data"""
        try:
            # First, try to find an existing canonical vehicle
            canonical_id = await self._find_matching_canonical(vehicle_data)
            
            if canonical_id:
                return canonical_id
            
            # If no match found, create a new canonical vehicle
            canonical_create = CanonicalVehicleCreate(
                brand=vehicle_data.brand or "Unknown",
                model=vehicle_data.model or "Unknown",
                year=vehicle_data.year,
                edition=vehicle_data.edition,
                engine=vehicle_data.engine,
                transmission=vehicle_data.transmission,
                fuel_type=vehicle_data.fuel_type,
                doors=vehicle_data.doors,
                body_type=self._extract_body_type(vehicle_data.title),
                specifications=self._extract_specifications(vehicle_data)
            )
            
            canonical_vehicle = await self.create_canonical_vehicle(canonical_create)
            return canonical_vehicle.id
            
        except Exception as e:
            logger.error(f"Error finding/creating canonical vehicle: {e}")
            return None

    async def _find_matching_canonical(self, vehicle_data: VehicleCreate) -> Optional[str]:
        """Find matching canonical vehicle using similarity algorithms"""
        try:
            # Build query for potential matches
            query = {}
            if vehicle_data.brand:
                query["brand"] = {"$regex": f"^{re.escape(vehicle_data.brand)}$", "$options": "i"}
            if vehicle_data.model:
                query["model"] = {"$regex": f"^{re.escape(vehicle_data.model)}$", "$options": "i"}
            if vehicle_data.year:
                query["year"] = vehicle_data.year
            
            # If we have specific criteria, search for exact matches first
            if query:
                candidates = await self.canonical_vehicles_collection.find(query).to_list(length=None)
                
                # Check for exact matches with additional criteria
                for candidate in candidates:
                    if self._is_exact_match(vehicle_data, candidate):
                        return str(candidate["_id"])
                
                # Check for fuzzy matches
                for candidate in candidates:
                    similarity_score = self._calculate_similarity(vehicle_data, candidate)
                    if similarity_score >= 0.90:  # 90% similarity threshold (more strict)
                        return str(candidate["_id"])
            
            # If no good matches found with specific criteria, do a broader fuzzy search
            if vehicle_data.brand and vehicle_data.model:
                broad_query = {
                    "brand": {"$regex": vehicle_data.brand, "$options": "i"},
                    "model": {"$regex": vehicle_data.model, "$options": "i"}
                }
                
                broad_candidates = await self.canonical_vehicles_collection.find(broad_query).to_list(length=50)
                
                for candidate in broad_candidates:
                    similarity_score = self._calculate_similarity(vehicle_data, candidate)
                    if similarity_score >= 0.95:  # Higher threshold for broad search
                        return str(candidate["_id"])
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding matching canonical vehicle: {e}")
            return None

    def _is_exact_match(self, vehicle_data: VehicleCreate, canonical: Dict[str, Any]) -> bool:
        """Check if vehicle data exactly matches canonical vehicle"""
        # Brand and model must match (case insensitive)
        if not self._normalize_string(vehicle_data.brand) == self._normalize_string(canonical.get("brand")):
            return False
        if not self._normalize_string(vehicle_data.model) == self._normalize_string(canonical.get("model")):
            return False
        
        # Year must match if both are present
        if vehicle_data.year and canonical.get("year"):
            if vehicle_data.year != canonical["year"]:
                return False
        
        # Edition must match if both are present
        if vehicle_data.edition and canonical.get("edition"):
            if not self._normalize_string(vehicle_data.edition) == self._normalize_string(canonical["edition"]):
                return False
        
        # Engine must match if both are present and specific
        if vehicle_data.engine and canonical.get("engine"):
            if not self._similar_engines(vehicle_data.engine, canonical["engine"]):
                return False
        
        return True

    def _calculate_similarity(self, vehicle_data: VehicleCreate, canonical: Dict[str, Any]) -> float:
        """Calculate similarity score between vehicle data and canonical vehicle"""
        score = 0.0
        total_weight = 0.0
        
        # Brand similarity (weight: 0.25)
        if vehicle_data.brand and canonical.get("brand"):
            brand_sim = SequenceMatcher(None, 
                self._normalize_string(vehicle_data.brand),
                self._normalize_string(canonical["brand"])
            ).ratio()
            score += brand_sim * 0.25
            total_weight += 0.25
        
        # Model similarity (weight: 0.25)
        if vehicle_data.model and canonical.get("model"):
            model_sim = SequenceMatcher(None,
                self._normalize_string(vehicle_data.model),
                self._normalize_string(canonical["model"])
            ).ratio()
            score += model_sim * 0.25
            total_weight += 0.25
        
        # Year similarity (weight: 0.2)
        if vehicle_data.year and canonical.get("year"):
            if vehicle_data.year == canonical["year"]:
                score += 0.2
            else:
                # Different years get no score - they should be separate canonical vehicles
                pass
            total_weight += 0.2
        
        # Edition similarity (weight: 0.2) - Increased from 0.1 to make editions more distinct
        if vehicle_data.edition and canonical.get("edition"):
            edition_sim = SequenceMatcher(None,
                self._normalize_string(vehicle_data.edition),
                self._normalize_string(canonical["edition"])
            ).ratio()
            score += edition_sim * 0.2
            total_weight += 0.2
        
        # Engine similarity (weight: 0.1)
        if vehicle_data.engine and canonical.get("engine"):
            engine_sim = 1.0 if self._similar_engines(vehicle_data.engine, canonical["engine"]) else 0.0
            score += engine_sim * 0.1
            total_weight += 0.1
        
        return score / total_weight if total_weight > 0 else 0.0

    def _normalize_string(self, text: str) -> str:
        """Normalize string for comparison"""
        if not text:
            return ""
        # Replace hyphens and underscores with spaces, then remove other punctuation
        text = re.sub(r'[-_]+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.lower().strip()

    def _similar_engines(self, engine1: str, engine2: str) -> bool:
        """Check if two engine specifications are similar"""
        if not engine1 or not engine2:
            return False
        
        # Extract numeric values (displacement, power, etc.)
        engine1_numbers = re.findall(r'\d+\.?\d*', engine1.lower())
        engine2_numbers = re.findall(r'\d+\.?\d*', engine2.lower())
        
        # Check if they share significant numeric values
        for num1 in engine1_numbers:
            for num2 in engine2_numbers:
                if abs(float(num1) - float(num2)) < 0.1:
                    return True
        
        # Check for similar keywords
        engine1_words = set(self._normalize_string(engine1).split())
        engine2_words = set(self._normalize_string(engine2).split())
        
        overlap = len(engine1_words & engine2_words)
        return overlap >= 2 or overlap / len(engine1_words | engine2_words) > 0.5

    def _generate_canonical_title(self, canonical_data: CanonicalVehicleCreate) -> str:
        """Generate a standardized title for canonical vehicle"""
        parts = []
        
        if canonical_data.brand:
            parts.append(canonical_data.brand.title())
        if canonical_data.model:
            parts.append(canonical_data.model.title())
        if canonical_data.year:
            parts.append(canonical_data.year)
        if canonical_data.edition:
            parts.append(canonical_data.edition.title())
        
        return " ".join(parts)

    def _extract_body_type(self, title: str) -> Optional[str]:
        """Extract body type from vehicle title"""
        if not title:
            return None
        
        title_lower = title.lower()
        body_types = {
            'sedan': ['sedan', 'sedán'],
            'hatchback': ['hatchback', 'hatch'],
            'suv': ['suv', 'camioneta'],
            'pickup': ['pickup', 'pick up', 'pick-up'],
            'coupe': ['coupe', 'coupé'],
            'convertible': ['convertible', 'cabrio'],
            'wagon': ['wagon', 'familiar'],
            'van': ['van', 'furgon', 'furgón']
        }
        
        for body_type, keywords in body_types.items():
            for keyword in keywords:
                if keyword in title_lower:
                    return body_type
        
        return None

    def _extract_specifications(self, vehicle_data: VehicleCreate) -> Dict[str, Any]:
        """Extract standardized specifications from vehicle data"""
        specs = {}
        
        if vehicle_data.engine:
            specs["engine"] = vehicle_data.engine
        if vehicle_data.transmission:
            specs["transmission"] = vehicle_data.transmission
        if vehicle_data.fuel_type:
            specs["fuel_type"] = vehicle_data.fuel_type
        if vehicle_data.doors:
            specs["doors"] = vehicle_data.doors
        
        # Extract additional specs from additional_info
        if vehicle_data.additional_info:
            for key, value in vehicle_data.additional_info.items():
                if key not in specs and value:
                    specs[key] = value
        
        return specs

    async def update_canonical_vehicle_stats(self, canonical_id: str):
        """Update statistics for a canonical vehicle based on its listings"""
        try:
            # Get all active listings for this canonical vehicle
            listings = await self.vehicles_collection.find({
                "canonical_vehicle_id": canonical_id,
                "status": "active"
            }).to_list(length=None)
            
            if not listings:
                return
            
            # Calculate statistics
            prices = [listing["price_numeric"] for listing in listings if listing.get("price_numeric")]
            total_views = sum(listing.get("views_count", 0) for listing in listings)
            
            # Calculate kilometers average
            kilometers_values = []
            for listing in listings:
                km_str = listing.get("kilometers", "")
                if km_str:
                    # Extract numeric value from kilometers string
                    km_match = re.search(r'(\d+)', km_str.replace(",", "").replace(".", ""))
                    if km_match:
                        kilometers_values.append(int(km_match.group(1)))
            
            update_data = {
                "total_listings": len(listings),
                "active_listings": len(listings),
                "total_views": total_views,
                "updated_at": datetime.utcnow(),
                "last_market_update": datetime.utcnow()
            }
            
            if prices:
                update_data.update({
                    "min_price": min(prices),
                    "max_price": max(prices),
                    "avg_price": sum(prices) / len(prices),
                    "median_price": sorted(prices)[len(prices) // 2]
                })
            
            if kilometers_values:
                update_data["average_kilometers"] = sum(kilometers_values) / len(kilometers_values)
            
            await self.canonical_vehicles_collection.update_one(
                {"_id": ObjectId(canonical_id)},
                {"$set": update_data}
            )
            
        except Exception as e:
            logger.error(f"Error updating canonical vehicle stats for {canonical_id}: {e}")

    async def get_canonical_vehicle_by_id(self, canonical_id: str) -> Optional[CanonicalVehicle]:
        """Get canonical vehicle by ID"""
        try:
            canonical = await self.canonical_vehicles_collection.find_one({"_id": ObjectId(canonical_id)})
            if canonical:
                canonical["_id"] = str(canonical["_id"])
                return CanonicalVehicle(**canonical)
            return None
        except Exception as e:
            logger.error(f"Error getting canonical vehicle {canonical_id}: {e}")
            return None

    async def get_canonical_vehicles_with_listings(
        self, 
        page: int = 1, 
        page_size: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get canonical vehicles with their listings count and market data"""
        try:
            skip = (page - 1) * page_size
            
            # Build query
            query = {"status": CanonicalVehicleStatus.ACTIVE}
            if filters:
                if filters.get("brand"):
                    query["brand"] = {"$regex": filters["brand"], "$options": "i"}
                if filters.get("model"):
                    query["model"] = {"$regex": filters["model"], "$options": "i"}
                if filters.get("year"):
                    query["year"] = filters["year"]
            
            # Get total count
            total_count = await self.canonical_vehicles_collection.count_documents(query)
            
            # Get paginated results
            cursor = self.canonical_vehicles_collection.find(query).sort("total_listings", -1).skip(skip).limit(page_size)
            canonical_vehicles = await cursor.to_list(length=page_size)
            
            # Convert ObjectId to string and prepare response
            result_canonicals = []
            for canonical in canonical_vehicles:
                canonical["_id"] = str(canonical["_id"])
                result_canonicals.append(CanonicalVehicle(**canonical))
            
            # Calculate pagination info
            total_pages = (total_count + page_size - 1) // page_size
            
            return {
                "canonical_vehicles": result_canonicals,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
            
        except Exception as e:
            logger.error(f"Error getting canonical vehicles with listings: {e}")
            return {}

    async def get_listings_for_canonical(self, canonical_id: str) -> List[Vehicle]:
        """Get all listings for a canonical vehicle"""
        try:
            from models.vehicle import Vehicle
            
            listings = await self.vehicles_collection.find({
                "canonical_vehicle_id": canonical_id
            }).sort("price_numeric", 1).to_list(length=None)
            
            result_listings = []
            for listing in listings:
                listing["_id"] = str(listing["_id"])
                result_listings.append(Vehicle(**listing))
            
            return result_listings
            
        except Exception as e:
            logger.error(f"Error getting listings for canonical {canonical_id}: {e}")
            return []

    async def merge_canonical_vehicles(self, source_id: str, target_id: str) -> bool:
        """Merge two canonical vehicles (move all listings from source to target)"""
        try:
            # Update all listings to point to target canonical vehicle
            result = await self.vehicles_collection.update_many(
                {"canonical_vehicle_id": source_id},
                {"$set": {"canonical_vehicle_id": target_id}}
            )
            
            # Mark source canonical as merged
            await self.canonical_vehicles_collection.update_one(
                {"_id": ObjectId(source_id)},
                {"$set": {"status": CanonicalVehicleStatus.MERGED, "updated_at": datetime.utcnow()}}
            )
            
            # Update target canonical stats
            await self.update_canonical_vehicle_stats(target_id)
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error merging canonical vehicles {source_id} -> {target_id}: {e}")
            return False 