#!/usr/bin/env python3
"""
Test script for canonical vehicle grouping and similarity algorithms.
This script creates test vehicle data and verifies that the grouping logic works correctly.
"""

import asyncio
import sys
import os
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.canonical_vehicle_service import CanonicalVehicleService
from models.vehicle import VehicleCreate, CanonicalVehicleCreate
from motor.motor_asyncio import AsyncIOMotorClient

class CanonicalGroupingTest:
    """Test class for canonical vehicle grouping logic"""
    
    def __init__(self):
        self.canonical_service = None
    
    def setup_test_data_small(self) -> List[VehicleCreate]:
        """Create original small test vehicle data (7 vehicles)"""
        test_vehicles = [
            # Group 1: Honda Civic 2020 - should group together
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
            ),
            VehicleCreate(
                title="HONDA CIVIC LX 2020 1.5 TURBO",
                mercadolibre_id="MCO123456791",
                url="https://auto.mercadolibre.com.co/MCO-123456791",
                brand="HONDA",
                model="CIVIC",
                year="2020",
                edition="LX",
                engine="1.5L TURBO",
                transmission="Automatic",
                fuel_type="Gasoline",
                doors=4,
                price="84500000",
                price_numeric=84500000.0
            ),
            
            # Group 2: Honda Civic 2020 Sport - should be separate from LX
            VehicleCreate(
                title="Honda Civic 2020 Sport Hatchback",
                mercadolibre_id="MCO123456792",
                url="https://auto.mercadolibre.com.co/MCO-123456792",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="Sport",
                engine="1.5L Turbo",
                transmission="Manual",
                fuel_type="Gasolina",
                doors=5,
                price="89000000",
                price_numeric=89000000.0
            ),
            
            # Group 3: Honda Civic 2019 - should be separate from 2020
            VehicleCreate(
                title="Honda Civic 2019 LX Automático",
                mercadolibre_id="MCO123456793",
                url="https://auto.mercadolibre.com.co/MCO-123456793",
                brand="Honda",
                model="Civic",
                year="2019",
                edition="LX",
                engine="1.5L Turbo",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price="78000000",
                price_numeric=78000000.0
            ),
            
            # Group 4: Toyota Corolla 2020 - completely different
            VehicleCreate(
                title="Toyota Corolla 2020 XEI Automático",
                mercadolibre_id="MCO123456794",
                url="https://auto.mercadolibre.com.co/MCO-123456794",
                brand="Toyota",
                model="Corolla",
                year="2020",
                edition="XEI",
                engine="2.0L",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price="92000000",
                price_numeric=92000000.0
            ),
            
            # Group 5: Honda Accord 2020 - different model
            VehicleCreate(
                title="Honda Accord 2020 EX-L V6",
                mercadolibre_id="MCO123456795",
                url="https://auto.mercadolibre.com.co/MCO-123456795",
                brand="Honda",
                model="Accord",
                year="2020",
                edition="EX-L",
                engine="3.5L V6",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price="135000000",
                price_numeric=135000000.0
            ),
        ]
        
        return test_vehicles

    def setup_test_data(self) -> List[VehicleCreate]:
        """Create 100 test vehicles for comprehensive grouping validation"""
        test_vehicles = []
        vehicle_id = 1000000
        
        # Honda Civic 2020 LX - Group 1 (15 vehicles)
        for i in range(15):
            variations = [
                "Honda Civic 2020 LX Automático",
                "Honda Civic LX 2020 Turbo",
                "HONDA CIVIC LX 2020 1.5L",
                "Honda Civic 2020 LX 1.5 Turbo Auto",
                "Honda CIVIC LX Automático 2020"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="LX",
                engine="1.5L Turbo",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{85000000 + i * 100000}",
                price_numeric=85000000.0 + i * 100000
            ))
        vehicle_id += 15
        
        # Honda Civic 2020 Sport - Group 2 (8 vehicles)
        for i in range(8):
            variations = [
                "Honda Civic 2020 Sport Hatchback",
                "Honda Civic Sport 2020 Manual",
                "HONDA CIVIC SPORT 2020 1.5T",
                "Honda Civic 2020 Sport Turbo"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Honda",
                model="Civic",
                year="2020",
                edition="Sport",
                engine="1.5L Turbo",
                transmission="Manual",
                fuel_type="Gasolina",
                doors=5,
                price=f"{89000000 + i * 200000}",
                price_numeric=89000000.0 + i * 200000
            ))
        vehicle_id += 8
        
        # Honda Civic 2019 LX - Group 3 (6 vehicles)
        for i in range(6):
            variations = [
                "Honda Civic 2019 LX Automático",
                "Honda Civic LX 2019 Turbo",
                "HONDA CIVIC LX 2019"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Honda",
                model="Civic",
                year="2019",
                edition="LX",
                engine="1.5L Turbo",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{78000000 + i * 150000}",
                price_numeric=78000000.0 + i * 150000
            ))
        vehicle_id += 6
        
        # Toyota Corolla 2020 XEI - Group 4 (12 vehicles)
        for i in range(12):
            variations = [
                "Toyota Corolla 2020 XEI Automático",
                "Toyota COROLLA XEI 2020 Auto",
                "TOYOTA Corolla 2020 XEI 2.0",
                "Toyota Corolla XEI Automático 2020"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Toyota",
                model="Corolla",
                year="2020",
                edition="XEI",
                engine="2.0L",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{92000000 + i * 300000}",
                price_numeric=92000000.0 + i * 300000
            ))
        vehicle_id += 12
        
        # Honda Accord 2020 EX-L - Group 5 (7 vehicles)
        for i in range(7):
            variations = [
                "Honda Accord 2020 EX-L V6",
                "Honda ACCORD EX-L 2020 V6",
                "HONDA Accord 2020 EX-L 3.5",
                "Honda Accord EX-L V6 2020"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Honda",
                model="Accord",
                year="2020",
                edition="EX-L",
                engine="3.5L V6",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{135000000 + i * 500000}",
                price_numeric=135000000.0 + i * 500000
            ))
        vehicle_id += 7
        
        # Nissan Sentra 2021 SV - Group 6 (9 vehicles)
        for i in range(9):
            variations = [
                "Nissan Sentra 2021 SV Automático",
                "Nissan SENTRA SV 2021 CVT",
                "NISSAN Sentra 2021 SV 1.6",
                "Nissan Sentra SV Automático 2021"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Nissan",
                model="Sentra",
                year="2021",
                edition="SV",
                engine="1.6L",
                transmission="CVT",
                fuel_type="Gasolina",
                doors=4,
                price=f"{75000000 + i * 250000}",
                price_numeric=75000000.0 + i * 250000
            ))
        vehicle_id += 9
        
        # Chevrolet Spark 2022 LT - Group 7 (10 vehicles)
        for i in range(10):
            variations = [
                "Chevrolet Spark 2022 LT Manual",
                "Chevrolet SPARK LT 2022",
                "CHEVROLET Spark 2022 LT 1.4",
                "Chevrolet Spark LT Manual 2022"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Chevrolet",
                model="Spark",
                year="2022",
                edition="LT",
                engine="1.4L",
                transmission="Manual",
                fuel_type="Gasolina",
                doors=5,
                price=f"{45000000 + i * 100000}",
                price_numeric=45000000.0 + i * 100000
            ))
        vehicle_id += 10
        
        # Hyundai Accent 2021 GL - Group 8 (8 vehicles)
        for i in range(8):
            variations = [
                "Hyundai Accent 2021 GL Automático",
                "Hyundai ACCENT GL 2021 Auto",
                "HYUNDAI Accent 2021 GL 1.6",
                "Hyundai Accent GL Automático 2021"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Hyundai",
                model="Accent",
                year="2021",
                edition="GL",
                engine="1.6L",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{68000000 + i * 200000}",
                price_numeric=68000000.0 + i * 200000
            ))
        vehicle_id += 8
        
        # Mazda 3 2020 Touring - Group 9 (11 vehicles)
        for i in range(11):
            variations = [
                "Mazda 3 2020 Touring Automático",
                "Mazda 3 TOURING 2020 Auto",
                "MAZDA 3 2020 Touring 2.0",
                "Mazda 3 Touring Automático 2020"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Mazda",
                model="3",
                year="2020",
                edition="Touring",
                engine="2.0L",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{85000000 + i * 300000}",
                price_numeric=85000000.0 + i * 300000
            ))
        vehicle_id += 11
        
        # Kia Rio 2021 EX - Group 10 (14 vehicles)
        for i in range(14):
            variations = [
                "Kia Rio 2021 EX Automático",
                "Kia RIO EX 2021 Auto",
                "KIA Rio 2021 EX 1.6",
                "Kia Rio EX Automático 2021"
            ]
            test_vehicles.append(VehicleCreate(
                title=variations[i % len(variations)],
                mercadolibre_id=f"MCO{vehicle_id + i}",
                url=f"https://auto.mercadolibre.com.co/MCO-{vehicle_id + i}",
                brand="Kia",
                model="Rio",
                year="2021",
                edition="EX",
                engine="1.6L",
                transmission="Automático",
                fuel_type="Gasolina",
                doors=4,
                price=f"{72000000 + i * 180000}",
                price_numeric=72000000.0 + i * 180000
            ))
        
        return test_vehicles
    
    def setup_mock_database(self):
        """Setup a mock database for testing (in-memory)"""
        # For testing, we'll create a simple in-memory database mock
        class MockCollection:
            def __init__(self):
                self.data = []
            
            def find(self, query):
                # Simple mock find implementation
                class MockCursor:
                    def __init__(self, data):
                        self.data = data
                    
                    async def to_list(self, length=None):
                        return self.data
                
                return MockCursor(self.data)
            
            async def find_one(self, query):
                # Find first matching document
                for doc in self.data:
                    if "_id" in query and doc.get("_id") == query["_id"]:
                        return doc
                return None
            
            async def insert_one(self, document):
                class MockResult:
                    def __init__(self, doc_id):
                        self.inserted_id = doc_id
                
                doc_id = f"canonical_{len(self.data)}"
                document["_id"] = doc_id
                self.data.append(document)
                return MockResult(doc_id)
            
            async def update_one(self, query, update):
                class MockResult:
                    def __init__(self, modified_count):
                        self.modified_count = modified_count
                
                for doc in self.data:
                    if "_id" in query and doc.get("_id") == query["_id"]:
                        if "$set" in update:
                            doc.update(update["$set"])
                        return MockResult(1)
                return MockResult(0)
            
            async def count_documents(self, query):
                return len(self.data)
        
        class MockDatabase:
            def __init__(self):
                self.canonical_vehicles = MockCollection()
                self.vehicles = MockCollection()
                self.price_history = MockCollection()
        
        mock_db = MockDatabase()
        
        # Create canonical vehicle service with mock database
        self.canonical_service = CanonicalVehicleService(mock_db)
    
    async def test_similarity_calculation(self):
        """Test the similarity calculation algorithm"""
        print("Testing similarity calculation...")
        
        self.setup_mock_database()
        
        # Create test canonical vehicle
        canonical_data = {
            "brand": "Honda",
            "model": "Civic",
            "year": "2020",
            "edition": "LX",
            "engine": "1.5L Turbo"
        }
        
        # Test vehicles with different similarity levels
        test_cases = [
            {
                "vehicle": VehicleCreate(
                    title="Honda Civic 2020 LX",
                    mercadolibre_id="test1",
                    url="test",
                    brand="Honda",
                    model="Civic",
                    year="2020",
                    edition="LX",
                    engine="1.5L Turbo"
                ),
                "expected_similarity": 1.0,
                "description": "Exact match"
            },
            {
                "vehicle": VehicleCreate(
                    title="Honda Civic 2020 Sport",
                    mercadolibre_id="test2",
                    url="test",
                    brand="Honda",
                    model="Civic",
                    year="2020",
                    edition="Sport",
                    engine="1.5L Turbo"
                ),
                "expected_similarity": 0.9,
                "description": "Different edition"
            },
            {
                "vehicle": VehicleCreate(
                    title="Honda Civic 2019 LX",
                    mercadolibre_id="test3",
                    url="test",
                    brand="Honda",
                    model="Civic",
                    year="2019",
                    edition="LX",
                    engine="1.5L Turbo"
                ),
                "expected_similarity": 0.8,
                "description": "Different year"
            },
            {
                "vehicle": VehicleCreate(
                    title="Honda Accord 2020 LX",
                    mercadolibre_id="test4",
                    url="test",
                    brand="Honda",
                    model="Accord",
                    year="2020",
                    edition="LX",
                    engine="3.5L V6"
                ),
                "expected_similarity": 0.3,
                "description": "Different model"
            },
            {
                "vehicle": VehicleCreate(
                    title="Toyota Corolla 2020 XEI",
                    mercadolibre_id="test5",
                    url="test",
                    brand="Toyota",
                    model="Corolla",
                    year="2020",
                    edition="XEI",
                    engine="2.0L"
                ),
                "expected_similarity": 0.0,
                "description": "Different brand"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            similarity = self.canonical_service._calculate_similarity(
                test_case["vehicle"], 
                canonical_data
            )
            
            print(f"\nTest {i}: {test_case['description']}")
            print(f"  Vehicle: {test_case['vehicle'].brand} {test_case['vehicle'].model} {test_case['vehicle'].year} {test_case['vehicle'].edition}")
            print(f"  Calculated similarity: {similarity:.3f}")
            print(f"  Expected similarity: ~{test_case['expected_similarity']:.1f}")
            
            # Check if similarity is in reasonable range
            tolerance = 0.2
            if abs(similarity - test_case["expected_similarity"]) <= tolerance:
                print(f"  ✅ PASS (within tolerance)")
            else:
                print(f"  ❌ FAIL (outside tolerance)")
    
    async def test_grouping_logic(self):
        """Test the complete grouping logic"""
        print("\n" + "="*60)
        print("Testing canonical vehicle grouping logic...")
        print("="*60)
        
        self.setup_mock_database()
        
        test_vehicles = self.setup_test_data()
        canonical_assignments = {}
        
        print(f"\nProcessing {len(test_vehicles)} test vehicles...")
        
        for i, vehicle in enumerate(test_vehicles, 1):
            print(f"\n--- Vehicle {i}/{len(test_vehicles)} ---")
            print(f"Title: {vehicle.title}")
            print(f"Brand: {vehicle.brand}, Model: {vehicle.model}, Year: {vehicle.year}")
            print(f"Edition: {vehicle.edition}, Engine: {vehicle.engine}")
            
            # Find or create canonical vehicle
            canonical_id = await self.canonical_service.find_or_create_canonical_vehicle(vehicle)
            canonical_assignments[vehicle.mercadolibre_id] = canonical_id
            
            if canonical_id:
                canonical = await self.canonical_service.get_canonical_vehicle_by_id(canonical_id)
                if canonical:
                    print(f"Assigned to canonical: {canonical.canonical_title} (ID: {canonical_id})")
                else:
                    print(f"Assigned to canonical ID: {canonical_id}")
            else:
                print("❌ Failed to assign canonical vehicle")
        
        # Analyze grouping results
        print("\n" + "="*60)
        print("GROUPING ANALYSIS")
        print("="*60)
        
        # Group vehicles by canonical ID
        canonical_groups = {}
        for vehicle_id, canonical_id in canonical_assignments.items():
            if canonical_id not in canonical_groups:
                canonical_groups[canonical_id] = []
            canonical_groups[canonical_id].append(vehicle_id)
        
        print(f"Total vehicles: {len(test_vehicles)}")
        print(f"Canonical vehicles created: {len(canonical_groups)}")
        
        for canonical_id, vehicle_ids in canonical_groups.items():
            canonical = await self.canonical_service.get_canonical_vehicle_by_id(canonical_id)
            title = canonical.canonical_title if canonical else f"Unknown (ID: {canonical_id})"
            print(f"\nCanonical Vehicle: {title}")
            print(f"  Grouped vehicles: {len(vehicle_ids)}")
            for vehicle_id in vehicle_ids:
                vehicle = next(v for v in test_vehicles if v.mercadolibre_id == vehicle_id)
                print(f"    - {vehicle.title}")
        
        # Expected groupings analysis
        print("\n" + "="*40)
        print("EXPECTED vs ACTUAL GROUPINGS")
        print("="*40)
        
        expected_groups = {
            "Honda Civic 2020 LX": 15,     # Group 1: 15 vehicles
            "Honda Civic 2020 Sport": 8,   # Group 2: 8 vehicles  
            "Honda Civic 2019 LX": 6,      # Group 3: 6 vehicles
            "Toyota Corolla 2020 XEI": 12, # Group 4: 12 vehicles
            "Honda Accord 2020 EX-L": 7,   # Group 5: 7 vehicles
            "Nissan Sentra 2021 SV": 9,    # Group 6: 9 vehicles
            "Chevrolet Spark 2022 LT": 10, # Group 7: 10 vehicles
            "Hyundai Accent 2021 GL": 8,   # Group 8: 8 vehicles
            "Mazda 3 2020 Touring": 11,    # Group 9: 11 vehicles
            "Kia Rio 2021 EX": 14          # Group 10: 14 vehicles
        }
        
        total_expected_vehicles = sum(expected_groups.values())
        print(f"Expected groups: {len(expected_groups)}")
        print(f"Expected total vehicles: {total_expected_vehicles}")
        print(f"Actual groups: {len(canonical_groups)}")
        print(f"Actual total vehicles: {len(test_vehicles)}")
        
        if len(canonical_groups) == len(expected_groups):
            print("✅ Group count matches expectation")
        else:
            print("❌ Group count differs from expectation")
        
        if total_expected_vehicles == len(test_vehicles):
            print("✅ Total vehicle count matches expectation")
        else:
            print("❌ Total vehicle count differs from expectation")
        
        # Check if similar vehicles are properly grouped
        print("\n📊 DETAILED GROUP ANALYSIS:")
        for canonical_id, vehicle_ids in canonical_groups.items():
            canonical = await self.canonical_service.get_canonical_vehicle_by_id(canonical_id)
            title = canonical.canonical_title if canonical else f"Unknown (ID: {canonical_id})"
            expected_count = None
            
            # Find expected count for this group
            for group_name, count in expected_groups.items():
                if (canonical and 
                    group_name.lower().replace(" ", "").replace("-", "") in 
                    title.lower().replace(" ", "").replace("-", "")):
                    expected_count = count
                    break
            
            status = "✅" if expected_count == len(vehicle_ids) else "❌"
            print(f"{status} {title}: {len(vehicle_ids)} vehicles (expected: {expected_count or 'unknown'})")
        
        # Sample verification for first group
        if len(test_vehicles) >= 15:
            first_group_ids = [f"MCO{1000000 + i}" for i in range(3)]  # Check first 3 of Honda Civic 2020 LX
            if first_group_ids[0] in canonical_assignments:
                first_canonical_id = canonical_assignments[first_group_ids[0]]
                first_group_vehicles = canonical_groups[first_canonical_id]
                
                if all(vid in first_group_vehicles for vid in first_group_ids):
                    print("✅ Sample Honda Civic 2020 LX vehicles correctly grouped together")
                else:
                    print("❌ Sample Honda Civic 2020 LX vehicles not properly grouped")
    
    async def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n" + "="*60)
        print("Testing edge cases...")
        print("="*60)
        
        self.setup_mock_database()
        
        # Test with minimal data
        minimal_vehicle = VehicleCreate(
            title="Unknown Vehicle",
            mercadolibre_id="minimal",
            url="test",
            brand=None,
            model=None
        )
        
        print("\nTest 1: Vehicle with minimal data")
        canonical_id = await self.canonical_service.find_or_create_canonical_vehicle(minimal_vehicle)
        if canonical_id:
            print("✅ Handled minimal data successfully")
        else:
            print("❌ Failed to handle minimal data")
        
        # Test with missing brand/model
        no_brand_vehicle = VehicleCreate(
            title="Some Car 2020",
            mercadolibre_id="no_brand",
            url="test",
            brand="",
            model="Unknown Model",
            year="2020"
        )
        
        print("\nTest 2: Vehicle with empty brand")
        canonical_id = await self.canonical_service.find_or_create_canonical_vehicle(no_brand_vehicle)
        if canonical_id:
            print("✅ Handled empty brand successfully")
        else:
            print("❌ Failed to handle empty brand")
        
        # Test string normalization
        print("\nTest 3: String normalization")
        test_strings = [
            ("Honda", "honda"),
            ("CIVIC", "civic"),
            ("Honda-Civic", "Honda Civic"),
            ("  Honda  ", "Honda"),
            ("", "")
        ]
        
        for original, expected in test_strings:
            normalized = self.canonical_service._normalize_string(original)
            expected_norm = self.canonical_service._normalize_string(expected)
            if normalized == expected_norm:
                print(f"  ✅ '{original}' -> '{normalized}'")
            else:
                print(f"  ❌ '{original}' -> '{normalized}' (expected similar to '{expected_norm}')")

async def main():
    """Run all tests"""
    test = CanonicalGroupingTest()
    
    print("CANONICAL VEHICLE GROUPING TESTS")
    print("="*60)
    
    try:
        await test.test_similarity_calculation()
        await test.test_grouping_logic()
        await test.test_edge_cases()
        
        print("\n" + "="*60)
        print("ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main()) 