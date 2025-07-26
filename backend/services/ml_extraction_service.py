import re
import pandas as pd
import logging
from typing import Dict, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import nltk
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

class VehicleTitleMLExtractor:
    """ML-based service to extract Brand, Model, and Edition from vehicle titles using the exact user-provided approach"""
    
    def __init__(self):
        # Comprehensive brand list based on user's provided brands (excluding single letter markers)
        self.car_brands = [
            'acura', 'alfa romeo', 'audi', 'auteco',
            'baic', 'bestune', 'bmw', 'brilliance', 'byd',
            'cadillac', 'can-am', 'canam', 'chana', 'changan', 'changfeng', 'changhe', 'chery', 'chevrolet', 'chrysler', 'citroën', 'cupra',
            'd.s.', 'daewoo', 'daihatsu', 'datsun', 'dfm', 'dfsk', 'dodge', 'dongfeng',
            'faw', 'ferrari', 'fiat', 'ford', 'foton', 'freightliner',
            'geely', 'gmc', 'golden dragon', 'gonow', 'great', 'great wall', 'gwm',
            'hafei', 'hino', 'honda', 'hummer', 'hyundai',
            'infiniti', 'isuzu',
            'jac', 'jaguar', 'jeep', 'jetour', 'jmc',
            'karry', 'kenworth', 'kia', 'kyc',
            'lada', 'lamborghini', 'land', 'land rover', 'landwind', 'lexus', 'lifan', 'lincoln',
            'mahindra', 'maserati', 'mazda', 'mclaren', 'mercedes-benz', 'mg', 'mini', 'mitsubishi', 'mod', 'montero',
            'nissan',
            'opel',
            'peugeot', 'piaggio', 'polaris', 'porsche',
            'ram', 'range rover', 'renault', 'rolls-royce', 'rover',
            'seat', 'shineray', 'sinotruk', 'skoda', 'sprint', 'ssangyong', 'subaru', 'suzuki', 'suzuky',
            't&g', 'tata', 'tesla', 'toyota',
            'uaz',
            'volkswagen', 'volvo',
            'willys', 'wuling',
            'xiaomi',
            'y & z',
            'zhidou', 'zhongxing', 'zotye'
        ]
        # Sort by length (longest first) for better matching priority
        self.car_brands.sort(key=len, reverse=True)
        self.spanish_stop_words = None
        self._initialize_nltk()
    
    def _initialize_nltk(self):
        """Initialize NLTK and download required data - exactly as user's working code"""
        try:
            # Download Spanish stop words exactly as in user's code
            nltk.download('stopwords')
            self.spanish_stop_words = set(stopwords.words('spanish'))
        except Exception as e:
            logger.warning(f"Failed to download NLTK stopwords: {e}")
            # Use a basic Spanish stopwords list as fallback
            self.spanish_stop_words = {
                'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da',
                'su', 'por', 'son', 'con', 'para', 'al', 'las', 'del', 'los', 'una', 'tiene', 'todo',
                'pero', 'más', 'hace', 'como', 'fue', 'está', 'muy', 'hay', 'ya', 'sido', 'tiene'
            }
    
    def clean_title(self, title: str) -> str:
        """Clean and preprocess the title while preserving brand-relevant special characters"""
        if not title:
            return ""
        
        # Step 1: Convert to lowercase and strip
        cleaned = title.lower().strip()
        
        # Step 2: Preserve brand-relevant special characters (periods, hyphens, ampersands)
        # but normalize whitespace around them
        import re
        cleaned = re.sub(r'\s*([.-])\s*', r'\1', cleaned)  # Remove spaces around . and -
        cleaned = re.sub(r'\s*(&)\s*', r' \1 ', cleaned)   # Normalize spaces around &
        
        # Step 3: Remove Spanish stop words while preserving brand components
        if self.spanish_stop_words:
            words = cleaned.split()
            # Don't remove words that are part of known brands
            cleaned_words = []
            for word in words:
                # Keep the word if it's part of a known brand or not a stop word
                if word not in self.spanish_stop_words or self._is_brand_component(word):
                    cleaned_words.append(word)
            cleaned = ' '.join(cleaned_words)
        
        return cleaned
    
    def _is_brand_component(self, word: str) -> bool:
        """Check if a word is a component of any known brand"""
        for brand in self.car_brands:
            if word in brand.lower().split():
                return True
        return False
    
    def extract_brand(self, title: str) -> Optional[str]:
        """Extract brand with improved matching for multi-word brands and special characters"""
        if not title:
            return None
            
        cleaned_title = self.clean_title(title)
        
        # Try to find exact brand matches (sorted by length, longest first)
        for brand in self.car_brands:
            brand_lower = brand.lower()
            
            # For multi-word brands, check if all words are present
            if ' ' in brand_lower:
                brand_words = brand_lower.split()
                # Check if all brand words are in the title
                if all(word in cleaned_title for word in brand_words):
                    # Check if they appear in sequence (with some flexibility)
                    if self._check_brand_sequence(cleaned_title, brand_words):
                        return brand_lower
            else:
                # For single word brands, use word boundary matching
                if self._is_word_in_title(cleaned_title, brand_lower):
                    return brand_lower
        
        return None
    
    def _check_brand_sequence(self, title: str, brand_words: list) -> bool:
        """Check if brand words appear in sequence with some flexibility"""
        words = title.split()
        for i in range(len(words) - len(brand_words) + 1):
            # Check if brand words match starting from position i
            match = True
            for j, brand_word in enumerate(brand_words):
                if i + j >= len(words) or brand_word not in words[i + j]:
                    match = False
                    break
            if match:
                return True
        return False
    
    def _is_word_in_title(self, title: str, brand: str) -> bool:
        """Check if brand appears as a whole word in title"""
        import re
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(brand) + r'\b'
        return bool(re.search(pattern, title, re.IGNORECASE))
    
    def extract_model(self, title: str, brand: Optional[str]) -> Optional[str]:
        """Extract model - exactly as user's working code"""
        if not brand:
            return None
        
        cleaned_title = self.clean_title(title)
        
        # Find the index of the brand in the title
        brand_index = cleaned_title.find(brand)
        if brand_index != -1:
            # Get the text after the brand
            after_brand = cleaned_title[brand_index + len(brand):].strip()
            # Split the text by spaces and take the first few words as potential model
            words = after_brand.split()
            # This is a simplified approach, a more robust solution would involve
            # analyzing patterns within clusters or using a trained model
            return ' '.join(words[:2])  # Take the first two words as a potential model
        return None
    
    def extract_edition(self, title: str, brand: Optional[str], model: Optional[str]) -> Optional[str]:
        """Extract edition - exactly as user's working code"""
        if not brand or not model:
            return None
        
        cleaned_title = self.clean_title(title)
        
        # Find the index of the model in the title after the brand
        brand_index = cleaned_title.find(brand)
        if brand_index != -1:
            after_brand = cleaned_title[brand_index + len(brand):].strip()
            model_index = after_brand.find(model)
            if model_index != -1:
                # Get the text after the model
                after_model = after_brand[model_index + len(model):].strip()
                # Take the remaining words as potential edition
                return after_model if after_model else None
        return None
    
    def extract_vehicle_info(self, title: str) -> Dict[str, Optional[str]]:
        """Extract Brand, Model, and Edition from a single vehicle title"""
        try:
            brand = self.extract_brand(title)
            model = self.extract_model(title, brand)
            edition = self.extract_edition(title, brand, model)
            
            return {
                'brand': brand,
                'model': model,
                'edition': edition
            }
        except Exception as e:
            logger.error(f"Error extracting vehicle info from title '{title}': {e}")
            return {
                'brand': None,
                'model': None,
                'edition': None
            }
    
    def batch_extract_vehicle_info(self, titles: list) -> pd.DataFrame:
        """Extract Brand, Model, and Edition from a batch of vehicle titles - exactly as user's working code"""
        try:
            # Create a DataFrame - exactly as user's code
            cars_data = pd.DataFrame({'Title': titles})
            
            # Step 1: Clean titles - exactly as user's code
            cars_data['Title'] = cars_data['Title'].str.lower().str.strip()
            
            # Step 2: Remove Spanish stop words - exactly as user's code
            if self.spanish_stop_words:
                cars_data['Title'] = cars_data['Title'].apply(lambda x: ' '.join([word for word in x.split() if word not in self.spanish_stop_words]))
            
            # Step 3: Apply clustering - exactly as user's code
            try:
                vectorizer = TfidfVectorizer(stop_words=list(self.spanish_stop_words) if self.spanish_stop_words else None)
                X = vectorizer.fit_transform(cars_data['Title'])
                
                # Apply KMeans clustering
                n_clusters = 10  # You can adjust the number of clusters
                kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                cars_data['Cluster'] = kmeans.fit_predict(X)
            except Exception as e:
                logger.warning(f"Clustering failed: {e}")
                cars_data['Cluster'] = 0
            
            # Step 4: Extract brand, model, and edition - exactly as user's code
            cars_data['Predicted_Brand'] = cars_data['Title'].apply(self.extract_brand)
            cars_data['Predicted_Model'] = cars_data.apply(lambda row: self.extract_model(row['Title'], row['Predicted_Brand']), axis=1)
            cars_data['Predicted_Edition'] = cars_data.apply(lambda row: self.extract_edition(row['Title'], row['Predicted_Brand'], row['Predicted_Model']), axis=1)
            
            return cars_data
        except Exception as e:
            logger.error(f"Error in batch extraction: {e}")
            # Return basic DataFrame with None values
            cars_data = pd.DataFrame({'Title': titles})
            cars_data['Predicted_Brand'] = None
            cars_data['Predicted_Model'] = None
            cars_data['Predicted_Edition'] = None
            return cars_data

# Global instance
ml_extractor = VehicleTitleMLExtractor() 