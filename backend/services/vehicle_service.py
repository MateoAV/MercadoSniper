import asyncio
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
import re

from models.vehicle import (
    Vehicle, 
    VehicleCreate, 
    VehicleUpdate, 
    VehicleSearchFilters, 
    VehicleSearchResponse,
    PriceHistory,
    VehicleStatus
)
from services.canonical_vehicle_service import CanonicalVehicleService
from core.config import settings

logger = logging.getLogger(__name__)

class VehicleService:
    """Service for vehicle database operations"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.vehicles_collection = db.vehicles
        self.price_history_collection = db.price_history
        self.canonical_service = CanonicalVehicleService(db)

    async def create_or_update_vehicle(self, vehicle_data: VehicleCreate, scraping_session_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new vehicle or update existing one"""
        try:
            # Check if vehicle already exists
            existing_vehicle = await self.vehicles_collection.find_one({
                "mercadolibre_id": vehicle_data.mercadolibre_id
            })
            
            current_time = datetime.utcnow()
            
            if existing_vehicle:
                # Update existing vehicle
                update_data = vehicle_data.dict(exclude_unset=True)
                update_data["updated_at"] = current_time
                update_data["last_scraped_at"] = current_time
                
                # Always record price history on every scrape (not just changes)
                if vehicle_data.price_numeric:
                    await self._record_price_change(
                        existing_vehicle["_id"],
                        vehicle_data.mercadolibre_id,
                        vehicle_data.price,
                        vehicle_data.price_numeric,
                        scraping_session_id
                    )
                
                result = await self.vehicles_collection.update_one(
                    {"_id": existing_vehicle["_id"]},
                    {"$set": update_data}
                )
                
                # Update canonical vehicle stats if this vehicle is linked to one
                if existing_vehicle.get("canonical_vehicle_id"):
                    await self.canonical_service.update_canonical_vehicle_stats(
                        existing_vehicle["canonical_vehicle_id"]
                    )
                
                if result.modified_count > 0:
                    return await self.vehicles_collection.find_one({"_id": existing_vehicle["_id"]})
                else:
                    return existing_vehicle
            else:
                # Find or create canonical vehicle
                canonical_id = await self.canonical_service.find_or_create_canonical_vehicle(vehicle_data)
                
                # Create new vehicle
                vehicle_dict = vehicle_data.dict()
                vehicle_dict["created_at"] = current_time
                vehicle_dict["updated_at"] = current_time
                vehicle_dict["last_scraped_at"] = current_time
                vehicle_dict["status"] = VehicleStatus.ACTIVE
                vehicle_dict["views_count"] = 0
                vehicle_dict["tracking_count"] = 0
                vehicle_dict["canonical_vehicle_id"] = canonical_id
                
                result = await self.vehicles_collection.insert_one(vehicle_dict)
                
                # Record initial price
                if vehicle_data.price_numeric:
                    await self._record_price_change(
                        result.inserted_id,
                        vehicle_data.mercadolibre_id,
                        vehicle_data.price,
                        vehicle_data.price_numeric,
                        scraping_session_id
                    )
                
                # Update canonical vehicle stats
                if canonical_id:
                    await self.canonical_service.update_canonical_vehicle_stats(canonical_id)
                
                return await self.vehicles_collection.find_one({"_id": result.inserted_id})
                
        except Exception as e:
            logger.error(f"Error creating/updating vehicle {vehicle_data.mercadolibre_id}: {e}")
            raise

    async def _record_price_change(
        self, 
        vehicle_id: str, 
        mercadolibre_id: str, 
        price: Optional[str], 
        price_numeric: float,
        scraping_session_id: Optional[str] = None
    ):
        """Record price change in time series history collection"""
        try:
            # Convert ObjectId to string if needed
            vehicle_id_str = str(vehicle_id)
            
            # Convert None price to string representation of numeric price
            price_str = price if price is not None else str(int(price_numeric))
            
            price_record = PriceHistory.create_from_vehicle_data(
                vehicle_id=vehicle_id_str,
                mercadolibre_id=mercadolibre_id,
                price=price_str,
                price_numeric=price_numeric,
                scraping_session_id=scraping_session_id
            )
            
            # Convert to dict and let MongoDB generate the _id
            price_record_dict = price_record.dict(by_alias=True)
            
            result = await self.price_history_collection.insert_one(price_record_dict)
            
            if settings.DEBUG_SCRAPING:
                logger.info(f"🔍 DEBUG: Price history recorded for vehicle {vehicle_id_str}, price: {price_str}, _id: {result.inserted_id}")
            
        except Exception as e:
            logger.error(f"Error recording price change for vehicle {vehicle_id}: {e}")
            if settings.DEBUG_SCRAPING:
                import traceback
                logger.info(f"🔍 DEBUG: Price history error traceback: {traceback.format_exc()}")

    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[Vehicle]:
        """Get vehicle by ID"""
        try:
            from bson import ObjectId
            try:
                # Convert string ID to ObjectId
                object_id = ObjectId(vehicle_id)
                vehicle = await self.vehicles_collection.find_one({"_id": object_id})
                if vehicle:
                    vehicle["_id"] = str(vehicle["_id"])
                    return Vehicle(**vehicle)
                return None
            except Exception as e:
                # If ID conversion fails, try searching by mercadolibre_id as fallback
                vehicle = await self.vehicles_collection.find_one({"mercadolibre_id": vehicle_id})
                if vehicle:
                    vehicle["_id"] = str(vehicle["_id"])
                    return Vehicle(**vehicle)
                return None
        except Exception as e:
            logger.error(f"Error getting vehicle {vehicle_id}: {e}")
            return None

    async def get_vehicle_by_mercadolibre_id(self, mercadolibre_id: str) -> Optional[Vehicle]:
        """Get vehicle by MercadoLibre ID"""
        try:
            vehicle = await self.vehicles_collection.find_one({"mercadolibre_id": mercadolibre_id})
            if vehicle:
                vehicle["_id"] = str(vehicle["_id"])
                return Vehicle(**vehicle)
            return None
        except Exception as e:
            logger.error(f"Error getting vehicle by ML ID {mercadolibre_id}: {e}")
            return None

    async def search_vehicles(
        self, 
        filters: VehicleSearchFilters, 
        page: int = 1, 
        page_size: int = 20
    ) -> VehicleSearchResponse:
        """Search vehicles with filters and pagination"""
        try:
            # Build query
            query = self._build_search_query(filters)
            
            # Calculate pagination
            skip = (page - 1) * page_size
            
            # Get total count
            total_count = await self.vehicles_collection.count_documents(query)
            
            # Get paginated results
            cursor = self.vehicles_collection.find(query).sort("updated_at", -1).skip(skip).limit(page_size)
            vehicles_data = await cursor.to_list(length=page_size)
            
            # Convert ObjectId to string for each vehicle
            vehicles = []
            for vehicle_data in vehicles_data:
                if "_id" in vehicle_data:
                    vehicle_data["_id"] = str(vehicle_data["_id"])
                vehicles.append(Vehicle(**vehicle_data))
            
            # Calculate pagination info
            total_pages = (total_count + page_size - 1) // page_size
            has_next = page < total_pages
            has_previous = page > 1
            
            return VehicleSearchResponse(
                vehicles=vehicles,
                total_count=total_count,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                has_next=has_next,
                has_previous=has_previous
            )
            
        except Exception as e:
            logger.error(f"Error searching vehicles: {e}")
            raise

    def _build_search_query(self, filters: VehicleSearchFilters) -> Dict[str, Any]:
        """Build MongoDB query from search filters"""
        query = {}
        
        # Status filter
        if filters.status:
            query["status"] = filters.status
        
        # Text search across multiple fields
        if filters.search_query:
            search_terms = filters.search_query.strip().split()
            if search_terms:
                # Create regex patterns for each search term (case-insensitive)
                search_conditions = []
                for term in search_terms:
                    term_pattern = {"$regex": term, "$options": "i"}
                    # Search across multiple fields
                    search_conditions.append({
                        "$or": [
                            {"title": term_pattern},
                            {"brand": term_pattern},
                            {"model": term_pattern},
                            {"edition": term_pattern},
                            {"location": term_pattern}
                        ]
                    })
                
                # All search terms must match (AND logic)
                if len(search_conditions) == 1:
                    query.update(search_conditions[0])
                else:
                    query["$and"] = search_conditions
        
        # Price filters
        price_filter = {}
        if filters.min_price is not None:
            price_filter["$gte"] = filters.min_price
        if filters.max_price is not None:
            price_filter["$lte"] = filters.max_price
        if price_filter:
            query["price_numeric"] = price_filter
        
        # Year filters
        if filters.min_year or filters.max_year:
            year_filter = {}
            if filters.min_year:
                year_filter["$gte"] = str(filters.min_year)
            if filters.max_year:
                year_filter["$lte"] = str(filters.max_year)
            if year_filter:
                query["year"] = year_filter
        
        # Brand filter
        if filters.brand:
            query["brand"] = {"$regex": filters.brand, "$options": "i"}
        
        # Model filter
        if filters.model:
            query["model"] = {"$regex": filters.model, "$options": "i"}
        
        # Location filter
        if filters.location:
            query["location"] = {"$regex": filters.location, "$options": "i"}
        
        # Fuel type filter
        if filters.fuel_type:
            query["fuel_type"] = {"$regex": filters.fuel_type, "$options": "i"}
        
        # Transmission filter
        if filters.transmission:
            query["transmission"] = {"$regex": filters.transmission, "$options": "i"}
        
        # Kilometers filters
        if filters.min_kilometers or filters.max_kilometers:
            # This requires parsing the kilometers string to extract numeric value
            # For now, we'll implement a basic text search
            kilometers_conditions = []
            if filters.min_kilometers:
                kilometers_conditions.append({"kilometers": {"$regex": f".*{filters.min_kilometers}.*"}})
            if filters.max_kilometers:
                kilometers_conditions.append({"kilometers": {"$regex": f".*{filters.max_kilometers}.*"}})
            if kilometers_conditions:
                query["$or"] = kilometers_conditions
        
        return query

    async def update_vehicle(self, vehicle_id: str, update_data: VehicleUpdate) -> Optional[Vehicle]:
        """Update vehicle by ID"""
        try:
            update_dict = update_data.dict(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await self.vehicles_collection.update_one(
                {"_id": vehicle_id},
                {"$set": update_dict}
            )
            
            if result.modified_count > 0:
                vehicle = await self.vehicles_collection.find_one({"_id": vehicle_id})
                return Vehicle(**vehicle) if vehicle else None
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating vehicle {vehicle_id}: {e}")
            raise

    async def delete_vehicle(self, vehicle_id: str) -> bool:
        """Delete vehicle by ID"""
        try:
            result = await self.vehicles_collection.delete_one({"_id": vehicle_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting vehicle {vehicle_id}: {e}")
            raise

    async def get_vehicle_price_history(self, vehicle_id: str, limit: Optional[int] = None) -> List[PriceHistory]:
        """Get price history for a vehicle from time series collection"""
        try:
            # Query time series collection using metadata field
            query = {"metadata.vehicle_id": vehicle_id}
            cursor = self.price_history_collection.find(query).sort("timestamp", -1)
            
            if limit:
                cursor = cursor.limit(limit)
            
            history_data = await cursor.to_list(length=limit)
            return [PriceHistory(**record) for record in history_data]
            
        except Exception as e:
            logger.error(f"Error getting price history for vehicle {vehicle_id}: {e}")
            return []

    async def get_recent_vehicles(self, limit: int = 10) -> List[Vehicle]:
        """Get recently added/updated vehicles"""
        try:
            cursor = self.vehicles_collection.find({
                "status": VehicleStatus.ACTIVE
            }).sort("updated_at", -1).limit(limit)
            
            vehicles_data = await cursor.to_list(length=limit)
            return [Vehicle(**vehicle) for vehicle in vehicles_data]
            
        except Exception as e:
            logger.error(f"Error getting recent vehicles: {e}")
            return []

    async def get_price_drops(self, hours: int = 24, limit: int = 10) -> List[Dict[str, Any]]:
        """Get vehicles with recent price drops using time series aggregation"""
        try:
            since_date = datetime.utcnow() - timedelta(hours=hours)
            
            # Use MongoDB aggregation pipeline with time series collection
            pipeline = [
                # Match recent price records
                {
                    "$match": {
                        "timestamp": {"$gte": since_date}
                    }
                },
                # Sort by vehicle and timestamp
                {
                    "$sort": {
                        "metadata.vehicle_id": 1,
                        "timestamp": -1
                    }
                },
                # Group by vehicle to get current and previous prices
                {
                    "$group": {
                        "_id": "$metadata.vehicle_id",
                        "mercadolibre_id": {"$first": "$metadata.mercadolibre_id"},
                        "prices": {
                            "$push": {
                                "price_numeric": "$price_numeric",
                                "timestamp": "$timestamp"
                            }
                        }
                    }
                },
                # Filter vehicles with at least 2 price records
                {
                    "$match": {
                        "prices.1": {"$exists": True}
                    }
                },
                # Calculate price drops
                {
                    "$addFields": {
                        "current_price": {"$arrayElemAt": ["$prices.price_numeric", 0]},
                        "previous_price": {"$arrayElemAt": ["$prices.price_numeric", 1]},
                        "price_drop": {
                            "$subtract": [
                                {"$arrayElemAt": ["$prices.price_numeric", 1]},
                                {"$arrayElemAt": ["$prices.price_numeric", 0]}
                            ]
                        }
                    }
                },
                # Filter only actual price drops (current < previous)
                {
                    "$match": {
                        "price_drop": {"$gt": 0}
                    }
                },
                # Calculate percentage and add fields
                {
                    "$addFields": {
                        "price_drop_percentage": {
                            "$multiply": [
                                {
                                    "$divide": [
                                        "$price_drop",
                                        "$previous_price"
                                    ]
                                },
                                100
                            ]
                        }
                    }
                },
                # Sort by price drop percentage (highest first)
                {
                    "$sort": {"price_drop_percentage": -1}
                },
                # Limit results
                {"$limit": limit}
            ]
            
            # Execute aggregation
            price_drops_cursor = self.price_history_collection.aggregate(pipeline)
            price_drops_data = await price_drops_cursor.to_list(length=limit)
            
            # Enrich with vehicle data
            price_drops = []
            for drop_data in price_drops_data:
                vehicle = await self.get_vehicle_by_id(drop_data["_id"])
                if vehicle:
                    price_drop = {
                        "vehicle": vehicle,
                        "current_price": drop_data["current_price"],
                        "previous_price": drop_data["previous_price"],
                        "price_drop": drop_data["price_drop"],
                        "price_drop_percentage": drop_data["price_drop_percentage"]
                    }
                    price_drops.append(price_drop)
            
            return price_drops
            
        except Exception as e:
            logger.error(f"Error getting price drops: {e}")
            return []

    async def get_vehicle_stats(self) -> Dict[str, Any]:
        """Get vehicle statistics"""
        try:
            total_vehicles = await self.vehicles_collection.count_documents({})
            active_vehicles = await self.vehicles_collection.count_documents({"status": VehicleStatus.ACTIVE})
            sold_vehicles = await self.vehicles_collection.count_documents({"status": VehicleStatus.SOLD})
            
            # Average price
            pipeline = [
                {"$match": {"price_numeric": {"$exists": True, "$ne": None}}},
                {"$group": {"_id": None, "avg_price": {"$avg": "$price_numeric"}}}
            ]
            avg_result = await self.vehicles_collection.aggregate(pipeline).to_list(length=1)
            avg_price = avg_result[0]["avg_price"] if avg_result else 0
            
            return {
                "total_vehicles": total_vehicles,
                "active_vehicles": active_vehicles,
                "sold_vehicles": sold_vehicles,
                "average_price": avg_price,
                "last_updated": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error getting vehicle stats: {e}")
            return {} 