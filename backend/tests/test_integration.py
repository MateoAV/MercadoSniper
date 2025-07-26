"""
Integration tests for the canonical vehicle system.
Tests the full flow from vehicle creation to canonical grouping.
"""

import pytest
from models.vehicle import VehicleCreate


@pytest.mark.asyncio
class TestCanonicalVehicleIntegration:
    """Integration tests for canonical vehicle system"""
    
    async def test_full_grouping_workflow(self, vehicle_service, canonical_service):
        """Test complete workflow from vehicle creation to canonical grouping"""
        
        # Create test vehicles that should be grouped together
        similar_vehicles = [
            VehicleCreate(
                title="Honda Civic 2020 LX Automático",
                mercadolibre_id="MCO001",
                url="https://auto.mercadolibre.com.co/MCO-001",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="LX",
                engine="1.5L Turbo",
                price="85000000",
                price_numeric=85000000.0
            ),
            VehicleCreate(
                title="Honda Civic LX 2020 Turbo Automático",
                mercadolibre_id="MCO002",
                url="https://auto.mercadolibre.com.co/MCO-002",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="LX",
                engine="1.5 Turbo",
                price="87000000",
                price_numeric=87000000.0
            ),
            VehicleCreate(
                title="HONDA CIVIC LX 2020 1.5 TURBO",
                mercadolibre_id="MCO003",
                url="https://auto.mercadolibre.com.co/MCO-003",
                brand="HONDA",
                model="CIVIC",
                year="2020",
                edition="LX",
                engine="1.5L TURBO",
                price="84500000",
                price_numeric=84500000.0
            )
        ]
        
        # Create vehicles (this should automatically create canonical vehicles)
        created_vehicles = []
        for vehicle_data in similar_vehicles:
            vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data)
            created_vehicles.append(vehicle)
        
        # Verify all vehicles have canonical_vehicle_id
        canonical_ids = set()
        for vehicle in created_vehicles:
            assert vehicle["canonical_vehicle_id"] is not None
            canonical_ids.add(vehicle["canonical_vehicle_id"])
        
        # All similar vehicles should have the same canonical_vehicle_id
        assert len(canonical_ids) == 1, f"Expected 1 canonical vehicle, got {len(canonical_ids)}"
        
        canonical_id = list(canonical_ids)[0]
        
        # Get the canonical vehicle
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        assert canonical is not None
        assert canonical.brand.lower() == "honda"
        assert canonical.model.lower() == "civic"
        assert canonical.year == "2020"
        assert canonical.edition.lower() == "lx"
        
        # Update canonical vehicle statistics
        await canonical_service.update_canonical_vehicle_stats(canonical_id)
        
        # Verify statistics
        updated_canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        assert updated_canonical.total_listings == 3
        assert updated_canonical.active_listings == 3
        assert updated_canonical.min_price == 84500000.0
        assert updated_canonical.max_price == 87000000.0
        assert updated_canonical.avg_price == (85000000 + 87000000 + 84500000) / 3
        
        # Get all listings for this canonical vehicle
        listings = await canonical_service.get_listings_for_canonical(canonical_id)
        assert len(listings) == 3
        
        # Verify all listings have the correct canonical_vehicle_id
        for listing in listings:
            assert listing.canonical_vehicle_id == canonical_id
    
    async def test_different_vehicles_separate_canonicals(self, vehicle_service, canonical_service):
        """Test that different vehicles create separate canonical vehicles"""
        
        different_vehicles = [
            VehicleCreate(
                title="Honda Civic 2020 LX",
                mercadolibre_id="MCO101",
                url="https://auto.mercadolibre.com.co/MCO-101",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="LX",
                price="85000000",
                price_numeric=85000000.0
            ),
            VehicleCreate(
                title="Honda Civic 2019 LX",  # Different year
                mercadolibre_id="MCO102",
                url="https://auto.mercadolibre.com.co/MCO-102",
                brand="Honda",
                model="Civic",
                year="2019",
                edition="LX",
                price="78000000",
                price_numeric=78000000.0
            ),
            VehicleCreate(
                title="Toyota Corolla 2020 XEI",  # Different brand/model
                mercadolibre_id="MCO103",
                url="https://auto.mercadolibre.com.co/MCO-103",
                brand="Toyota",
                model="Corolla",
                year="2020",
                edition="XEI",
                price="92000000",
                price_numeric=92000000.0
            )
        ]
        
        # Create vehicles
        created_vehicles = []
        for vehicle_data in different_vehicles:
            vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data)
            created_vehicles.append(vehicle)
        
        # Get all unique canonical IDs
        canonical_ids = set()
        for vehicle in created_vehicles:
            assert vehicle["canonical_vehicle_id"] is not None
            canonical_ids.add(vehicle["canonical_vehicle_id"])
        
        # Should have 3 different canonical vehicles
        assert len(canonical_ids) == 3, f"Expected 3 canonical vehicles, got {len(canonical_ids)}"
        
        # Verify each canonical vehicle has the correct properties
        for canonical_id in canonical_ids:
            canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
            assert canonical is not None
            
            listings = await canonical_service.get_listings_for_canonical(canonical_id)
            assert len(listings) == 1  # Each should have exactly one listing
    
    async def test_price_update_workflow(self, vehicle_service, canonical_service, mock_database):
        """Test price update workflow with canonical vehicles"""
        
        # Create a vehicle
        vehicle_data = VehicleCreate(
            title="Honda Civic 2020 LX",
            mercadolibre_id="MCO201",
            url="https://auto.mercadolibre.com.co/MCO-201",
            brand="Honda",
            model="Civic",
            year="2020",
            edition="LX",
            price="85000000",
            price_numeric=85000000.0
        )
        
        created_vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data)
        canonical_id = created_vehicle["canonical_vehicle_id"]
        
        # Update vehicle with new price
        updated_vehicle_data = VehicleCreate(
            title=vehicle_data.title,
            mercadolibre_id=vehicle_data.mercadolibre_id,
            url=vehicle_data.url,
            brand=vehicle_data.brand,
            model=vehicle_data.model,
            year=vehicle_data.year,
            edition=vehicle_data.edition,
            price="90000000",
            price_numeric=90000000.0
        )
        
        updated_vehicle = await vehicle_service.create_or_update_vehicle(updated_vehicle_data)
        
        # Verify price was updated
        assert updated_vehicle["price_numeric"] == 90000000.0
        assert updated_vehicle["canonical_vehicle_id"] == canonical_id  # Same canonical
        
        # Verify price history was recorded
        assert len(mock_database.price_history.data) >= 1
        
        # Update canonical statistics
        await canonical_service.update_canonical_vehicle_stats(canonical_id)
        
        # Verify canonical vehicle stats reflect new price
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        assert canonical.min_price == 90000000.0
        assert canonical.max_price == 90000000.0
        assert canonical.avg_price == 90000000.0
    
    async def test_search_canonical_vehicles(self, vehicle_service, canonical_service):
        """Test searching canonical vehicles"""
        
        # Create vehicles from different brands
        test_vehicles = [
            VehicleCreate(
                title="Honda Civic 2020 LX",
                mercadolibre_id="MCO301",
                url="test", brand="Honda", model="Civic", year="2020",
                price_numeric=85000000.0
            ),
            VehicleCreate(
                title="Honda Accord 2020 EX",
                mercadolibre_id="MCO302", 
                url="test", brand="Honda", model="Accord", year="2020",
                price_numeric=135000000.0
            ),
            VehicleCreate(
                title="Toyota Corolla 2020 XEI",
                mercadolibre_id="MCO303",
                url="test", brand="Toyota", model="Corolla", year="2020",
                price_numeric=92000000.0
            )
        ]
        
        # Create vehicles
        for vehicle_data in test_vehicles:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        # Search all canonical vehicles
        result = await canonical_service.get_canonical_vehicles_with_listings()
        
        assert result["total_count"] == 3
        assert len(result["canonical_vehicles"]) == 3
        
        # Search with brand filter
        honda_result = await canonical_service.get_canonical_vehicles_with_listings(
            filters={"brand": "Honda"}
        )
        
        assert honda_result["total_count"] == 2
        for canonical in honda_result["canonical_vehicles"]:
            assert canonical.brand == "Honda"
    
    async def test_market_analysis(self, vehicle_service, canonical_service):
        """Test market analysis for canonical vehicles"""
        
        # Create multiple listings for the same canonical vehicle
        similar_vehicles = [
            VehicleCreate(
                title="Honda Civic 2020 LX - Bogotá",
                mercadolibre_id="MCO401",
                url="test", brand="Honda", model="Civic", year="2020", edition="LX",
                price_numeric=85000000.0, location="Bogotá"
            ),
            VehicleCreate(
                title="Honda Civic 2020 LX - Medellín",
                mercadolibre_id="MCO402",
                url="test", brand="Honda", model="Civic", year="2020", edition="LX",
                price_numeric=87000000.0, location="Medellín"
            ),
            VehicleCreate(
                title="Honda Civic 2020 LX - Cali",
                mercadolibre_id="MCO403",
                url="test", brand="Honda", model="Civic", year="2020", edition="LX",
                price_numeric=84000000.0, location="Cali"
            )
        ]
        
        # Create vehicles
        created_vehicles = []
        for vehicle_data in similar_vehicles:
            vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data)
            created_vehicles.append(vehicle)
        
        # All should have the same canonical ID
        canonical_id = created_vehicles[0]["canonical_vehicle_id"]
        for vehicle in created_vehicles[1:]:
            assert vehicle["canonical_vehicle_id"] == canonical_id
        
        # Update statistics
        await canonical_service.update_canonical_vehicle_stats(canonical_id)
        
        # Verify market analysis
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        assert canonical.total_listings == 3
        assert canonical.min_price == 84000000.0
        assert canonical.max_price == 87000000.0
        assert canonical.avg_price == (85000000 + 87000000 + 84000000) / 3 