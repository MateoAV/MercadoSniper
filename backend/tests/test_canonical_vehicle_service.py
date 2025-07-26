"""
Unit tests for CanonicalVehicleService.
"""

import pytest
from models.vehicle import VehicleCreate, CanonicalVehicleCreate


@pytest.mark.asyncio
class TestCanonicalVehicleService:
    """Test cases for CanonicalVehicleService"""
    
    async def test_create_canonical_vehicle(self, canonical_service, sample_canonical_data):
        """Test creating a new canonical vehicle"""
        canonical = await canonical_service.create_canonical_vehicle(sample_canonical_data)
        
        assert canonical is not None
        assert canonical.brand == "Honda"
        assert canonical.model == "Civic"
        assert canonical.year == "2020"
        assert canonical.edition == "LX"
        assert canonical.canonical_title == "Honda Civic 2020 Lx"
    
    async def test_find_or_create_canonical_vehicle_new(self, canonical_service, sample_vehicle_data):
        """Test finding or creating canonical vehicle for new vehicle"""
        vehicle_data = sample_vehicle_data[0]
        
        canonical_id = await canonical_service.find_or_create_canonical_vehicle(vehicle_data)
        
        assert canonical_id is not None
        assert canonical_id.startswith("test_")
    
    async def test_find_or_create_canonical_vehicle_existing(self, canonical_service, sample_vehicle_data):
        """Test finding existing canonical vehicle for similar vehicle"""
        vehicle_data_1 = sample_vehicle_data[0]
        vehicle_data_2 = sample_vehicle_data[1]  # Similar Honda Civic LX 2020
        
        # Create first canonical vehicle
        canonical_id_1 = await canonical_service.find_or_create_canonical_vehicle(vehicle_data_1)
        
        # Should find the same canonical for similar vehicle
        canonical_id_2 = await canonical_service.find_or_create_canonical_vehicle(vehicle_data_2)
        
        assert canonical_id_1 == canonical_id_2
    
    async def test_similarity_calculation_exact_match(self, canonical_service):
        """Test similarity calculation for exact match"""
        vehicle_data = VehicleCreate(
            title="Honda Civic 2020 LX",
            mercadolibre_id="test1",
            url="test",
            brand="Honda",
            model="Civic",
            year="2020",
            edition="LX",
            engine="1.5L Turbo"
        )
        
        canonical_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": "2020",
            "edition": "LX",
            "engine": "1.5L Turbo"
        }
        
        similarity = canonical_service._calculate_similarity(vehicle_data, canonical_data)
        assert similarity == 1.0
    
    async def test_similarity_calculation_different_brand(self, canonical_service):
        """Test similarity calculation for different brand"""
        vehicle_data = VehicleCreate(
            title="Toyota Corolla 2020 XEI",
            mercadolibre_id="test2",
            url="test",
            brand="Toyota",
            model="Corolla",
            year="2020",
            edition="XEI",
            engine="2.0L"
        )
        
        canonical_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": "2020",
            "edition": "LX",
            "engine": "1.5L Turbo"
        }
        
        similarity = canonical_service._calculate_similarity(vehicle_data, canonical_data)
        assert similarity < 0.5  # Should be low similarity for different brand
    
    async def test_similarity_calculation_different_year(self, canonical_service):
        """Test similarity calculation for different year"""
        vehicle_data = VehicleCreate(
            title="Honda Civic 2019 LX",
            mercadolibre_id="test3",
            url="test",
            brand="Honda",
            model="Civic",
            year="2019",
            edition="LX",
            engine="1.5L Turbo"
        )
        
        canonical_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": "2020",
            "edition": "LX",
            "engine": "1.5L Turbo"
        }
        
        similarity = canonical_service._calculate_similarity(vehicle_data, canonical_data)
        assert 0.8 <= similarity <= 0.95  # Should be high but not perfect for different year
    
    def test_normalize_string(self, canonical_service):
        """Test string normalization function"""
        # Test case variations
        assert canonical_service._normalize_string("HONDA") == "honda"
        assert canonical_service._normalize_string("Honda") == "honda"
        assert canonical_service._normalize_string("honda") == "honda"
        
        # Test hyphen handling
        assert canonical_service._normalize_string("Honda-Civic") == "honda civic"
        assert canonical_service._normalize_string("K-Series") == "k series"
        
        # Test whitespace normalization
        assert canonical_service._normalize_string("  Honda  Civic  ") == "honda civic"
        assert canonical_service._normalize_string("Honda\t\nCivic") == "honda civic"
        
        # Test empty string
        assert canonical_service._normalize_string("") == ""
        assert canonical_service._normalize_string(None) == ""
    
    def test_similar_engines(self, canonical_service):
        """Test engine similarity comparison"""
        # Test similar engines
        assert canonical_service._similar_engines("1.5L Turbo", "1.5 Turbo") == True
        assert canonical_service._similar_engines("1.5L TURBO", "1.5l turbo") == True
        assert canonical_service._similar_engines("2.0L", "2.0") == True
        
        # Test different engines
        assert canonical_service._similar_engines("1.5L Turbo", "2.0L") == False
        assert canonical_service._similar_engines("V6", "I4") == False
        
        # Test empty/None engines
        assert canonical_service._similar_engines("", "1.5L") == False
        assert canonical_service._similar_engines(None, "1.5L") == False
    
    def test_generate_canonical_title(self, canonical_service):
        """Test canonical title generation"""
        canonical_data = CanonicalVehicleCreate(
            brand="Honda",
            model="Civic",
            year="2020",
            edition="LX"
        )
        
        title = canonical_service._generate_canonical_title(canonical_data)
        assert title == "Honda Civic 2020 Lx"
    
    def test_extract_body_type(self, canonical_service):
        """Test body type extraction from title"""
        assert canonical_service._extract_body_type("Honda Civic Sedan 2020") == "sedan"
        assert canonical_service._extract_body_type("Honda Civic Hatchback 2020") == "hatchback"
        assert canonical_service._extract_body_type("Toyota RAV4 SUV 2020") == "suv"
        assert canonical_service._extract_body_type("Ford F-150 Pickup 2020") == "pickup"
        assert canonical_service._extract_body_type("BMW Convertible 2020") == "convertible"
        
        # Test case insensitive
        assert canonical_service._extract_body_type("HONDA CIVIC SEDAN 2020") == "sedan"
        
        # Test no match
        assert canonical_service._extract_body_type("Honda Civic 2020") is None
        assert canonical_service._extract_body_type("") is None
    
    async def test_update_canonical_vehicle_stats(self, canonical_service, mock_database):
        """Test updating canonical vehicle statistics"""
        # Create a canonical vehicle
        canonical_data = CanonicalVehicleCreate(
            brand="Honda",
            model="Civic",
            year="2020"
        )
        canonical = await canonical_service.create_canonical_vehicle(canonical_data)
        
        # Add some mock vehicles to the database
        mock_vehicles = [
            {
                "_id": "vehicle_1",
                "canonical_vehicle_id": canonical.id,
                "status": "active",
                "price_numeric": 85000000,
                "views_count": 100,
                "kilometers": "50,000 km"
            },
            {
                "_id": "vehicle_2", 
                "canonical_vehicle_id": canonical.id,
                "status": "active",
                "price_numeric": 87000000,
                "views_count": 150,
                "kilometers": "45,000 km"
            }
        ]
        
        mock_database.vehicles.data = mock_vehicles
        
        # Update statistics
        await canonical_service.update_canonical_vehicle_stats(canonical.id)
        
        # Verify statistics were updated
        updated_canonical = await canonical_service.get_canonical_vehicle_by_id(canonical.id)
        assert updated_canonical.total_listings == 2
        assert updated_canonical.active_listings == 2
        assert updated_canonical.total_views == 250
        assert updated_canonical.min_price == 85000000
        assert updated_canonical.max_price == 87000000
        assert updated_canonical.avg_price == 86000000 