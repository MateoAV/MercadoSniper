import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)

class Database:
    """Database connection manager"""
    
    def __init__(self):
        self.mongodb_client: Optional[AsyncIOMotorClient] = None
        self.mongodb_db = None
        self.redis_client: Optional[redis.Redis] = None

    async def connect_mongodb(self):
        """Connect to MongoDB"""
        try:
            self.mongodb_client = AsyncIOMotorClient(settings.DATABASE_URL)
            self.mongodb_db = self.mongodb_client[settings.DATABASE_NAME]
            
            # Test the connection
            await self.mongodb_client.admin.command('ping')
            logger.info("MongoDB connected successfully")
            
            # Create indexes
            await self.create_indexes()
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise

    async def connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
            
            # Test the connection
            await self.redis_client.ping()
            logger.info("Redis connected successfully")
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            # Redis is optional, so we don't raise an exception

    async def disconnect_mongodb(self):
        """Disconnect from MongoDB"""
        if self.mongodb_client:
            self.mongodb_client.close()
            logger.info("MongoDB disconnected")

    async def disconnect_redis(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis disconnected")

    async def create_indexes(self):
        """Create database indexes and time series collections for optimal performance"""
        try:
            # Vehicle listings indexes
            await self.mongodb_db.vehicles.create_index([("mercadolibre_id", 1)], unique=True)
            await self.mongodb_db.vehicles.create_index([("title", "text")])
            await self.mongodb_db.vehicles.create_index([("price", 1)])
            await self.mongodb_db.vehicles.create_index([("price_numeric", 1)])
            await self.mongodb_db.vehicles.create_index([("year", 1)])
            await self.mongodb_db.vehicles.create_index([("location", 1)])
            await self.mongodb_db.vehicles.create_index([("brand", 1), ("model", 1)])
            await self.mongodb_db.vehicles.create_index([("canonical_vehicle_id", 1)])
            await self.mongodb_db.vehicles.create_index([("status", 1)])
            await self.mongodb_db.vehicles.create_index([("created_at", -1)])
            await self.mongodb_db.vehicles.create_index([("updated_at", -1)])
            
            # Canonical vehicles indexes
            await self.mongodb_db.canonical_vehicles.create_index([("brand", 1), ("model", 1)])
            await self.mongodb_db.canonical_vehicles.create_index([("brand", 1), ("model", 1), ("year", 1)])
            await self.mongodb_db.canonical_vehicles.create_index([("brand", 1), ("model", 1), ("edition", 1)])
            await self.mongodb_db.canonical_vehicles.create_index([("status", 1)])
            await self.mongodb_db.canonical_vehicles.create_index([("total_listings", -1)])
            await self.mongodb_db.canonical_vehicles.create_index([("active_listings", -1)])
            await self.mongodb_db.canonical_vehicles.create_index([("avg_price", 1)])
            await self.mongodb_db.canonical_vehicles.create_index([("canonical_title", "text"), ("brand", "text"), ("model", "text")])
            await self.mongodb_db.canonical_vehicles.create_index([("created_at", -1)])
            await self.mongodb_db.canonical_vehicles.create_index([("updated_at", -1)])
            
            # Create time series collection for price history
            await self.create_price_history_timeseries()
            
            # Price history indexes (for time series collection)
            await self.mongodb_db.price_history.create_index([("metadata.mercadolibre_id", 1), ("timestamp", -1)])
            await self.mongodb_db.price_history.create_index([("metadata.vehicle_id", 1), ("timestamp", -1)])
            await self.mongodb_db.price_history.create_index([("scraping_session_id", 1)])
            await self.mongodb_db.price_history.create_index([("timestamp", -1)])
            
            # Alerts indexes
            await self.mongodb_db.alerts.create_index([("user_id", 1)])
            await self.mongodb_db.alerts.create_index([("vehicle_id", 1)])
            await self.mongodb_db.alerts.create_index([("canonical_vehicle_id", 1)])
            await self.mongodb_db.alerts.create_index([("is_active", 1)])
            await self.mongodb_db.alerts.create_index([("status", 1)])
            await self.mongodb_db.alerts.create_index([("target_price", 1)])
            await self.mongodb_db.alerts.create_index([("created_at", -1)])
            
            # Scraping jobs indexes
            await self.mongodb_db.scraping_jobs.create_index([("status", 1)])
            await self.mongodb_db.scraping_jobs.create_index([("created_at", -1)])
            
            logger.info("Database indexes and time series collections created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")

    async def create_price_history_timeseries(self):
        """Create time series collection for price history data"""
        try:
            # Check if price_history collection already exists
            collections = await self.mongodb_db.list_collection_names()
            
            if "price_history" not in collections:
                # Create time series collection for price history
                await self.mongodb_db.create_collection(
                    "price_history",
                    timeseries={
                        "timeField": "timestamp",  # Time field
                        "metaField": "metadata",   # Metadata field for grouping
                        "granularity": "hours"     # Data granularity (seconds, minutes, hours)
                    }
                )
                logger.info("Created time series collection 'price_history'")
            else:
                logger.info("Time series collection 'price_history' already exists")
                
        except Exception as e:
            logger.warning(f"Could not create time series collection (may already exist): {e}")
            # If creation fails, the collection might already exist or MongoDB version doesn't support time series

# Global database instance
database = Database()

async def init_db():
    """Initialize database connections"""
    await database.connect_mongodb()
    await database.connect_redis()

async def close_db():
    """Close database connections"""
    await database.disconnect_mongodb()
    await database.disconnect_redis()

def get_database():
    """Get MongoDB database instance"""
    return database.mongodb_db

def get_redis():
    """Get Redis client instance"""
    return database.redis_client 