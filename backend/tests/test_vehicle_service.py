"""
Unit tests for VehicleService.
"""

import pytest
from models.vehicle import VehicleCreate, VehicleUpdate, VehicleStatus
from datetime import datetime


@pytest.mark.asyncio
class TestVehicleService:
    """Test cases for VehicleService"""
    
    async def test_create_or_update_vehicle_new(self, vehicle_service, sample_vehicle_data):
        """Test creating a new vehicle"""
        vehicle_data = sample_vehicle_data[0]
        
        result = await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        assert result is not None
        assert result["mercadolibre_id"] == vehicle_data.mercadolibre_id
        assert result["brand"] == vehicle_data.brand
        assert result["model"] == vehicle_data.model
        assert result["canonical_vehicle_id"] is not None
        assert result["status"] == VehicleStatus.ACTIVE
    
    async def test_create_or_update_vehicle_existing(self, vehicle_service, sample_vehicle_data):
        """Test updating an existing vehicle"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle first
        created = await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        # Update with new price
        updated_data = VehicleCreate(
            title=vehicle_data.title,
            mercadolibre_id=vehicle_data.mercadolibre_id,
            url=vehicle_data.url,
            brand=vehicle_data.brand,
            model=vehicle_data.model,
            year=vehicle_data.year,
            price="90000000",
            price_numeric=90000000.0
        )
        
        result = await vehicle_service.create_or_update_vehicle(updated_data)
        
        assert result is not None
        assert result["_id"] == created["_id"]  # Same vehicle
        assert result["price_numeric"] == 90000000.0  # Updated price
    
    async def test_get_vehicle_by_id(self, vehicle_service, sample_vehicle_data):
        """Test getting vehicle by ID"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle
        created = await vehicle_service.create_or_update_vehicle(vehicle_data)
        vehicle_id = str(created["_id"])
        
        # Get vehicle by ID
        vehicle = await vehicle_service.get_vehicle_by_id(vehicle_id)
        
        assert vehicle is not None
        assert vehicle.id == vehicle_id
        assert vehicle.mercadolibre_id == vehicle_data.mercadolibre_id
    
    async def test_get_vehicle_by_mercadolibre_id(self, vehicle_service, sample_vehicle_data):
        """Test getting vehicle by MercadoLibre ID"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle
        await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        # Get vehicle by ML ID
        vehicle = await vehicle_service.get_vehicle_by_mercadolibre_id(vehicle_data.mercadolibre_id)
        
        assert vehicle is not None
        assert vehicle.mercadolibre_id == vehicle_data.mercadolibre_id
    
    async def test_update_vehicle(self, vehicle_service, sample_vehicle_data):
        """Test updating vehicle with partial data"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle
        created = await vehicle_service.create_or_update_vehicle(vehicle_data)
        vehicle_id = str(created["_id"])
        
        # Update only price
        update_data = VehicleUpdate(
            price="95000000",
            price_numeric=95000000.0
        )
        
        updated = await vehicle_service.update_vehicle(vehicle_id, update_data)
        
        assert updated is not None
        assert updated.price_numeric == 95000000.0
        assert updated.brand == vehicle_data.brand  # Other fields unchanged
    
    async def test_delete_vehicle(self, vehicle_service, sample_vehicle_data):
        """Test deleting a vehicle"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle
        created = await vehicle_service.create_or_update_vehicle(vehicle_data)
        vehicle_id = str(created["_id"])
        
        # Delete vehicle
        success = await vehicle_service.delete_vehicle(vehicle_id)
        
        assert success is True
        
        # Verify vehicle is deleted
        deleted_vehicle = await vehicle_service.get_vehicle_by_id(vehicle_id)
        assert deleted_vehicle is None
    
    async def test_search_vehicles_basic(self, vehicle_service, sample_vehicle_data):
        """Test basic vehicle search"""
        # Create multiple vehicles
        for vehicle_data in sample_vehicle_data:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        from models.vehicle import VehicleSearchFilters
        
        # Search all vehicles
        filters = VehicleSearchFilters()
        result = await vehicle_service.search_vehicles(filters)
        
        assert result.total_count == len(sample_vehicle_data)
        assert len(result.vehicles) == len(sample_vehicle_data)
        assert result.page == 1
        assert result.has_next is False
        assert result.has_previous is False
    
    async def test_search_vehicles_with_filters(self, vehicle_service, sample_vehicle_data):
        """Test vehicle search with filters"""
        # Create multiple vehicles
        for vehicle_data in sample_vehicle_data:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        from models.vehicle import VehicleSearchFilters
        
        # Search for Honda vehicles only
        filters = VehicleSearchFilters(brand="Honda")
        result = await vehicle_service.search_vehicles(filters)
        
        assert result.total_count == 2  # Two Honda vehicles in sample data
        for vehicle in result.vehicles:
            assert vehicle.brand == "Honda"
    
    async def test_search_vehicles_pagination(self, vehicle_service, sample_vehicle_data):
        """Test vehicle search pagination"""
        # Create multiple vehicles
        for vehicle_data in sample_vehicle_data:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        from models.vehicle import VehicleSearchFilters
        
        # Search with pagination
        filters = VehicleSearchFilters()
        result = await vehicle_service.search_vehicles(filters, page=1, page_size=2)
        
        assert result.page_size == 2
        assert len(result.vehicles) == 2
        assert result.total_pages == 1  # 2 vehicles / 2 per page = 1 page
        assert result.has_next is False  # No more pages since all vehicles fit in one page
        assert result.has_previous is False
    
    async def test_get_recent_vehicles(self, vehicle_service, sample_vehicle_data):
        """Test getting recent vehicles"""
        # Create vehicles
        for vehicle_data in sample_vehicle_data:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        recent = await vehicle_service.get_recent_vehicles(limit=2)
        
        assert len(recent) == 2
        for vehicle in recent:
            assert vehicle.status == VehicleStatus.ACTIVE
    
    async def test_get_vehicle_stats(self, vehicle_service, sample_vehicle_data):
        """Test getting vehicle statistics"""
        # Create vehicles
        for vehicle_data in sample_vehicle_data:
            await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        stats = await vehicle_service.get_vehicle_stats()
        
        assert stats["total_vehicles"] == len(sample_vehicle_data)
        assert stats["active_vehicles"] == len(sample_vehicle_data)
        assert stats["sold_vehicles"] == 0
        assert "average_price" in stats
        assert "last_updated" in stats
    
    async def test_price_history_recording(self, vehicle_service, sample_vehicle_data, mock_database):
        """Test that price changes are recorded in price history"""
        vehicle_data = sample_vehicle_data[0]
        
        # Create vehicle
        created = await vehicle_service.create_or_update_vehicle(vehicle_data)
        
        # Update with new price
        updated_data = VehicleCreate(
            title=vehicle_data.title,
            mercadolibre_id=vehicle_data.mercadolibre_id,
            url=vehicle_data.url,
            brand=vehicle_data.brand,
            model=vehicle_data.model,
            year=vehicle_data.year,
            price="90000000",
            price_numeric=90000000.0
        )
        
        await vehicle_service.create_or_update_vehicle(updated_data)
        
        # Check that price history was recorded
        assert len(mock_database.price_history.data) >= 1
        
        # Verify price history content
        price_record = mock_database.price_history.data[-1]
        assert price_record["price_numeric"] == 90000000.0
        assert price_record["metadata"]["mercadolibre_id"] == vehicle_data.mercadolibre_id 