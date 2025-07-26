#!/usr/bin/env python3
"""
Migration script to group existing vehicles into canonical vehicles.
This script will:
1. Analyze existing vehicles in the database
2. Group similar vehicles using the canonical vehicle service
3. Create canonical vehicles and link existing vehicles to them
4. Update statistics for all canonical vehicles
"""

import asyncio
import logging
import sys
import os
from typing import List, Dict, Any
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from motor.motor_asyncio import AsyncIOMotorClient
from core.config import settings
from services.canonical_vehicle_service import CanonicalVehicleService
from services.vehicle_service import VehicleService
from models.vehicle import Vehicle, VehicleCreate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CanonicalVehicleMigration:
    """Migration class for creating canonical vehicles from existing vehicle data"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self.canonical_service = None
        self.vehicle_service = None
        self.stats = {
            "total_vehicles": 0,
            "processed_vehicles": 0,
            "canonical_vehicles_created": 0,
            "vehicles_linked": 0,
            "errors": 0,
            "start_time": None,
            "end_time": None
        }

    async def connect_database(self):
        """Connect to MongoDB database"""
        try:
            self.client = AsyncIOMotorClient(settings.DATABASE_URL)
            self.db = self.client[settings.DATABASE_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB successfully")
            
            # Initialize services
            self.canonical_service = CanonicalVehicleService(self.db)
            self.vehicle_service = VehicleService(self.db)
            
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    async def disconnect_database(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def get_vehicles_without_canonical(self) -> List[Dict[str, Any]]:
        """Get all vehicles that don't have a canonical_vehicle_id"""
        try:
            query = {
                "$or": [
                    {"canonical_vehicle_id": {"$exists": False}},
                    {"canonical_vehicle_id": None},
                    {"canonical_vehicle_id": ""}
                ]
            }
            
            vehicles = await self.db.vehicles.find(query).to_list(length=None)
            logger.info(f"Found {len(vehicles)} vehicles without canonical vehicle assignment")
            return vehicles
            
        except Exception as e:
            logger.error(f"Error fetching vehicles: {e}")
            return []

    async def create_vehicle_create_object(self, vehicle_doc: Dict[str, Any]) -> VehicleCreate:
        """Convert vehicle document to VehicleCreate object"""
        try:
            # Convert MongoDB document to VehicleCreate object
            vehicle_data = {
                "title": vehicle_doc.get("title", ""),
                "price": vehicle_doc.get("price"),
                "price_numeric": vehicle_doc.get("price_numeric"),
                "mercadolibre_id": vehicle_doc.get("mercadolibre_id", ""),
                "url": vehicle_doc.get("url", ""),
                "year": vehicle_doc.get("year"),
                "kilometers": vehicle_doc.get("kilometers"),
                "location": vehicle_doc.get("location"),
                "image_url": vehicle_doc.get("image_url"),
                "brand": vehicle_doc.get("brand"),
                "model": vehicle_doc.get("model"),
                "edition": vehicle_doc.get("edition"),
                "engine": vehicle_doc.get("engine"),
                "transmission": vehicle_doc.get("transmission"),
                "fuel_type": vehicle_doc.get("fuel_type"),
                "color": vehicle_doc.get("color"),
                "doors": vehicle_doc.get("doors"),
                "additional_info": vehicle_doc.get("additional_info", {})
            }
            
            return VehicleCreate(**vehicle_data)
            
        except Exception as e:
            logger.error(f"Error creating VehicleCreate object for vehicle {vehicle_doc.get('_id')}: {e}")
            raise

    async def migrate_vehicle(self, vehicle_doc: Dict[str, Any]) -> bool:
        """Migrate a single vehicle to canonical vehicle system"""
        try:
            vehicle_id = str(vehicle_doc["_id"])
            
            # Create VehicleCreate object
            vehicle_create = await self.create_vehicle_create_object(vehicle_doc)
            
            # Find or create canonical vehicle
            canonical_id = await self.canonical_service.find_or_create_canonical_vehicle(vehicle_create)
            
            if not canonical_id:
                logger.warning(f"Could not find or create canonical vehicle for {vehicle_id}")
                return False
            
            # Update the vehicle with canonical_vehicle_id
            result = await self.db.vehicles.update_one(
                {"_id": vehicle_doc["_id"]},
                {"$set": {"canonical_vehicle_id": canonical_id, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                self.stats["vehicles_linked"] += 1
                logger.debug(f"Linked vehicle {vehicle_id} to canonical vehicle {canonical_id}")
                return True
            else:
                logger.warning(f"Failed to update vehicle {vehicle_id} with canonical_vehicle_id")
                return False
                
        except Exception as e:
            logger.error(f"Error migrating vehicle {vehicle_doc.get('_id')}: {e}")
            self.stats["errors"] += 1
            return False

    async def update_all_canonical_stats(self):
        """Update statistics for all canonical vehicles"""
        try:
            logger.info("Updating statistics for all canonical vehicles...")
            
            # Get all canonical vehicles
            canonical_vehicles = await self.db.canonical_vehicles.find({}).to_list(length=None)
            
            for canonical in canonical_vehicles:
                canonical_id = str(canonical["_id"])
                await self.canonical_service.update_canonical_vehicle_stats(canonical_id)
                logger.debug(f"Updated stats for canonical vehicle {canonical_id}")
            
            logger.info(f"Updated statistics for {len(canonical_vehicles)} canonical vehicles")
            
        except Exception as e:
            logger.error(f"Error updating canonical vehicle statistics: {e}")

    async def run_migration(self, batch_size: int = 100):
        """Run the complete migration process"""
        try:
            self.stats["start_time"] = datetime.utcnow()
            logger.info("Starting canonical vehicle migration...")
            
            # Get vehicles without canonical assignment
            vehicles = await self.get_vehicles_without_canonical()
            self.stats["total_vehicles"] = len(vehicles)
            
            if not vehicles:
                logger.info("No vehicles need migration")
                return
            
            logger.info(f"Migrating {len(vehicles)} vehicles...")
            
            # Process vehicles in batches
            for i in range(0, len(vehicles), batch_size):
                batch = vehicles[i:i + batch_size]
                batch_start = i + 1
                batch_end = min(i + batch_size, len(vehicles))
                
                logger.info(f"Processing batch {batch_start}-{batch_end} of {len(vehicles)}")
                
                # Process batch
                for vehicle_doc in batch:
                    success = await self.migrate_vehicle(vehicle_doc)
                    self.stats["processed_vehicles"] += 1
                    
                    if success:
                        # Track if this created a new canonical vehicle
                        # (This is approximate since multiple vehicles might create the same canonical)
                        pass
                
                # Log progress
                progress = (self.stats["processed_vehicles"] / self.stats["total_vehicles"]) * 100
                logger.info(f"Progress: {self.stats['processed_vehicles']}/{self.stats['total_vehicles']} ({progress:.1f}%)")
                
                # Small delay to avoid overwhelming the database
                await asyncio.sleep(0.1)
            
            # Update canonical vehicle statistics
            await self.update_all_canonical_stats()
            
            self.stats["end_time"] = datetime.utcnow()
            
            # Get final count of canonical vehicles
            canonical_count = await self.db.canonical_vehicles.count_documents({})
            self.stats["canonical_vehicles_created"] = canonical_count
            
            self.print_migration_summary()
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

    def print_migration_summary(self):
        """Print migration summary statistics"""
        duration = self.stats["end_time"] - self.stats["start_time"]
        
        print("\n" + "="*60)
        print("CANONICAL VEHICLE MIGRATION SUMMARY")
        print("="*60)
        print(f"Start time: {self.stats['start_time']}")
        print(f"End time: {self.stats['end_time']}")
        print(f"Duration: {duration}")
        print(f"Total vehicles to migrate: {self.stats['total_vehicles']}")
        print(f"Vehicles processed: {self.stats['processed_vehicles']}")
        print(f"Vehicles successfully linked: {self.stats['vehicles_linked']}")
        print(f"Total canonical vehicles: {self.stats['canonical_vehicles_created']}")
        print(f"Errors encountered: {self.stats['errors']}")
        
        if self.stats["total_vehicles"] > 0:
            success_rate = (self.stats["vehicles_linked"] / self.stats["total_vehicles"]) * 100
            print(f"Success rate: {success_rate:.1f}%")
        
        print("="*60)

    async def dry_run(self, limit: int = 10):
        """Run a dry run to test the migration logic without making changes"""
        logger.info(f"Running dry run migration (limit: {limit})...")
        
        vehicles = await self.get_vehicles_without_canonical()
        
        if not vehicles:
            logger.info("No vehicles found for dry run")
            return
        
        test_vehicles = vehicles[:limit]
        logger.info(f"Testing migration logic on {len(test_vehicles)} vehicles")
        
        for i, vehicle_doc in enumerate(test_vehicles, 1):
            try:
                vehicle_id = str(vehicle_doc["_id"])
                vehicle_create = await self.create_vehicle_create_object(vehicle_doc)
                
                logger.info(f"\n--- Vehicle {i}/{len(test_vehicles)} ---")
                logger.info(f"ID: {vehicle_id}")
                logger.info(f"Title: {vehicle_create.title}")
                logger.info(f"Brand: {vehicle_create.brand}")
                logger.info(f"Model: {vehicle_create.model}")
                logger.info(f"Year: {vehicle_create.year}")
                logger.info(f"Engine: {vehicle_create.engine}")
                
                # Test canonical vehicle finding (without creating)
                canonical_id = await self.canonical_service._find_matching_canonical(vehicle_create)
                
                if canonical_id:
                    canonical = await self.canonical_service.get_canonical_vehicle_by_id(canonical_id)
                    logger.info(f"Would link to existing canonical: {canonical.canonical_title} (ID: {canonical_id})")
                else:
                    logger.info("Would create new canonical vehicle")
                    # Show what the canonical title would be
                    from models.vehicle import CanonicalVehicleCreate
                    canonical_create = CanonicalVehicleCreate(
                        brand=vehicle_create.brand or "Unknown",
                        model=vehicle_create.model or "Unknown",
                        year=vehicle_create.year,
                        edition=vehicle_create.edition,
                        engine=vehicle_create.engine,
                        transmission=vehicle_create.transmission,
                        fuel_type=vehicle_create.fuel_type,
                        doors=vehicle_create.doors
                    )
                    title = self.canonical_service._generate_canonical_title(canonical_create)
                    logger.info(f"New canonical title would be: {title}")
                
            except Exception as e:
                logger.error(f"Error in dry run for vehicle {vehicle_doc.get('_id')}: {e}")

async def main():
    """Main migration function"""
    migration = CanonicalVehicleMigration()
    
    try:
        # Parse command line arguments
        import argparse
        parser = argparse.ArgumentParser(description="Migrate vehicles to canonical vehicle system")
        parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (no changes)")
        parser.add_argument("--limit", type=int, default=10, help="Limit for dry-run mode")
        parser.add_argument("--batch-size", type=int, default=100, help="Batch size for processing")
        
        args = parser.parse_args()
        
        # Connect to database
        await migration.connect_database()
        
        if args.dry_run:
            await migration.dry_run(limit=args.limit)
        else:
            # Confirm before running migration
            print("WARNING: This will modify your database by creating canonical vehicles and linking existing vehicles.")
            response = input("Are you sure you want to continue? (yes/no): ")
            
            if response.lower() in ['yes', 'y']:
                await migration.run_migration(batch_size=args.batch_size)
            else:
                print("Migration cancelled.")
        
    except KeyboardInterrupt:
        logger.info("Migration interrupted by user")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        await migration.disconnect_database()

if __name__ == "__main__":
    asyncio.run(main()) 