"""
Pytest configuration and shared fixtures for MercadoSniper tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Dict, Any
import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.canonical_vehicle_service import CanonicalVehicleService
from services.vehicle_service import VehicleService
from models.vehicle import VehicleCreate, CanonicalVehicleCreate


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


class MockCursor:
    """Mock MongoDB cursor for testing"""
    
    def __init__(self, data, query=None):
        self.data = list(data)  # Make a copy
        self.query = query or {}
        self._filtered_data = self._apply_query_filter()
        self._skip_count = 0
        self._limit_count = None
        self._sort_field = None
        self._sort_direction = 1
    
    def _apply_query_filter(self):
        """Apply query filters to data"""
        if not self.query:
            return self.data
        
        filtered = []
        for doc in self.data:
            match = True
            for key, value in self.query.items():
                if key == "_id" and doc.get("_id") != value:
                    match = False
                    break
                elif key == "mercadolibre_id" and doc.get("mercadolibre_id") != value:
                    match = False
                    break
                elif key == "status" and doc.get("status") != value:
                    match = False
                    break
                elif key == "$or":
                    # Handle $or queries
                    or_match = False
                    for or_condition in value:
                        condition_match = True
                        for or_key, or_value in or_condition.items():
                            if doc.get(or_key) != or_value:
                                condition_match = False
                                break
                        if condition_match:
                            or_match = True
                            break
                    if not or_match:
                        match = False
                        break
                elif isinstance(value, dict):
                    # Handle complex queries (regex, range, etc.)
                    if "$regex" in value:
                        import re
                        pattern = value["$regex"]
                        flags = 0
                        if value.get("$options", "").find("i") >= 0:
                            flags |= re.IGNORECASE
                        doc_value = str(doc.get(key, ""))
                        if not re.search(pattern, doc_value, flags):
                            match = False
                            break
                    elif "$gte" in value or "$lte" in value or "$gt" in value or "$lt" in value:
                        # Handle range queries
                        doc_value = doc.get(key)
                        if doc_value is None:
                            match = False
                            break
                        
                        if "$gte" in value and doc_value < value["$gte"]:
                            match = False
                            break
                        if "$lte" in value and doc_value > value["$lte"]:
                            match = False
                            break
                        if "$gt" in value and doc_value <= value["$gt"]:
                            match = False
                            break
                        if "$lt" in value and doc_value < value["$lt"]:
                            match = False
                            break
                elif doc.get(key) != value:
                    match = False
                    break
            if match:
                filtered.append(doc)
        return filtered
    
    def sort(self, field, direction=1):
        """Sort the cursor results"""
        self._sort_field = field
        self._sort_direction = direction
        return self
    
    def skip(self, count):
        """Skip documents"""
        self._skip_count = count
        return self
    
    def limit(self, count):
        """Limit documents"""
        self._limit_count = count
        return self
    
    async def to_list(self, length=None):
        """Convert cursor to list"""
        result = self._filtered_data.copy()
        
        # Apply sorting
        if self._sort_field:
            reverse = self._sort_direction == -1
            try:
                result.sort(key=lambda x: x.get(self._sort_field, ""), reverse=reverse)
            except TypeError:
                # Handle mixed types by converting to string
                result.sort(key=lambda x: str(x.get(self._sort_field, "")), reverse=reverse)
        
        # Apply skip and limit
        if self._skip_count:
            result = result[self._skip_count:]
        if self._limit_count:
            result = result[:self._limit_count]
        
        return result


class MockCollection:
    """Mock MongoDB collection for testing"""
    
    def __init__(self):
        self.data = []
    
    def find(self, query=None):
        """Mock find method"""
        return MockCursor(self.data, query or {})
    
    async def find_one(self, query):
        """Mock find_one method"""
        for doc in self.data:
            if "_id" in query and doc.get("_id") == query["_id"]:
                return doc
            elif "mercadolibre_id" in query and doc.get("mercadolibre_id") == query["mercadolibre_id"]:
                return doc
        return None
    
    async def insert_one(self, document):
        """Mock insert_one method"""
        class MockResult:
            def __init__(self, doc_id):
                self.inserted_id = doc_id
        
        doc_id = f"test_{len(self.data)}"
        document["_id"] = doc_id
        self.data.append(document.copy())
        return MockResult(doc_id)
    
    async def update_one(self, query, update):
        """Mock update_one method"""
        class MockResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        
        for doc in self.data:
            if "_id" in query and doc.get("_id") == query["_id"]:
                if "$set" in update:
                    doc.update(update["$set"])
                return MockResult(1)
        return MockResult(0)
    
    async def count_documents(self, query=None):
        """Mock count_documents method"""
        if not query:
            return len(self.data)
        
        # Apply filter
        cursor = MockCursor(self.data, query)
        filtered_data = await cursor.to_list()
        return len(filtered_data)
    
    async def delete_one(self, query):
        """Mock delete_one method"""
        class MockResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        
        for i, doc in enumerate(self.data):
            if "_id" in query and doc.get("_id") == query["_id"]:
                del self.data[i]
                return MockResult(1)
        return MockResult(0)
    
    def aggregate(self, pipeline):
        """Mock aggregate method"""
        class MockAggregationCursor:
            def __init__(self, data):
                self.data = data
            
            async def to_list(self, length=None):
                # Simple aggregation - just return basic stats
                if not self.data:
                    return [{"total_vehicles": 0, "avg_price": 0, "min_price": 0, "max_price": 0}]
                
                total = len(self.data)
                prices = [doc.get("price_numeric", 0) for doc in self.data if doc.get("price_numeric")]
                
                if prices:
                    avg_price = sum(prices) / len(prices)
                    min_price = min(prices)
                    max_price = max(prices)
                else:
                    avg_price = min_price = max_price = 0
                
                return [{
                    "total_vehicles": total,
                    "avg_price": avg_price,
                    "min_price": min_price,
                    "max_price": max_price
                }]
        
        return MockAggregationCursor(self.data)


class MockDatabase:
    """Mock MongoDB database for testing"""
    
    def __init__(self):
        self.canonical_vehicles = MockCollection()
        self.vehicles = MockCollection()
        self.price_history = MockCollection()
        self.alerts = MockCollection()
        self.scraping_jobs = MockCollection()


@pytest.fixture
def mock_database():
    """Provide a mock database for testing"""
    return MockDatabase()


@pytest.fixture
def canonical_service(mock_database):
    """Provide a canonical vehicle service with mock database"""
    return CanonicalVehicleService(mock_database)


@pytest.fixture
def vehicle_service(mock_database):
    """Provide a vehicle service with mock database"""
    return VehicleService(mock_database)


@pytest.fixture
def sample_vehicle_data():
    """Provide sample vehicle data for testing"""
    return [
        VehicleCreate(
            title="Honda Civic 2020 LX Automático",
            mercadolibre_id="MCO123456789",
            url="https://auto.mercadolibre.com.co/MCO-123456789",
            brand="Honda",
            model="Civic",
            year="2020",
            edition="LX",
            engine="1.5L Turbo",
            transmission="Automático",
            fuel_type="Gasolina",
            doors=4,
            price="85000000",
            price_numeric=85000000.0
        ),
        VehicleCreate(
            title="Honda Civic LX 2020 Turbo Automático",
            mercadolibre_id="MCO123456790",
            url="https://auto.mercadolibre.com.co/MCO-123456790",
            brand="Honda",
            model="Civic",
            year="2020",
            edition="LX",
            engine="1.5 Turbo",
            transmission="Automático",
            fuel_type="Gasolina",
            doors=4,
            price="87000000",
            price_numeric=87000000.0
        )
    ]


@pytest.fixture
def sample_canonical_data():
    """Provide sample canonical vehicle data for testing"""
    return CanonicalVehicleCreate(
        brand="Honda",
        model="Civic",
        year="2020",
        edition="LX",
        engine="1.5L Turbo",
        transmission="Automático",
        fuel_type="Gasolina",
        doors=4
    )


# Test configuration
pytest_plugins = [] 