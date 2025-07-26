from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import bson

class VehicleStatus(str, Enum):
    """Vehicle status enumeration"""
    ACTIVE = "active"
    SOLD = "sold"
    PAUSED = "paused"
    REMOVED = "removed"

class CanonicalVehicleStatus(str, Enum):
    """Canonical vehicle status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MERGED = "merged"

class CanonicalVehicleCreate(BaseModel):
    """Canonical vehicle creation model"""
    brand: str = Field(..., description="Vehicle brand")
    model: str = Field(..., description="Vehicle model")
    year: Optional[str] = Field(None, description="Vehicle year")
    edition: Optional[str] = Field(None, description="Vehicle edition/trim")
    engine: Optional[str] = Field(None, description="Engine specifications")
    transmission: Optional[str] = Field(None, description="Transmission type")
    fuel_type: Optional[str] = Field(None, description="Fuel type")
    doors: Optional[int] = Field(None, description="Number of doors")
    body_type: Optional[str] = Field(None, description="Body type (sedan, hatchback, SUV, etc.)")
    canonical_title: Optional[str] = Field(None, description="Standardized vehicle title")
    canonical_image_url: Optional[str] = Field(None, description="Primary representative image")
    specifications: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Standardized specifications")

class CanonicalVehicle(BaseModel):
    """Canonical vehicle model - represents a unique vehicle configuration"""
    id: Optional[str] = Field(None, alias="_id")
    brand: str
    model: str
    year: Optional[str] = None
    edition: Optional[str] = None
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    doors: Optional[int] = None
    body_type: Optional[str] = None
    canonical_title: Optional[str] = None
    canonical_image_url: Optional[str] = None
    specifications: Dict[str, Any] = Field(default_factory=dict)
    
    # Market data
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_price: Optional[float] = None
    median_price: Optional[float] = None
    price_trend: Optional[str] = None  # "up", "down", "stable"
    
    # Statistics
    total_listings: int = 0
    active_listings: int = 0
    total_views: int = 0
    average_kilometers: Optional[float] = None
    
    # Status and metadata
    status: CanonicalVehicleStatus = CanonicalVehicleStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_market_update: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            bson.ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class CanonicalVehicleUpdate(BaseModel):
    """Canonical vehicle update model"""
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    edition: Optional[str] = None
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    doors: Optional[int] = None
    body_type: Optional[str] = None
    canonical_title: Optional[str] = None
    canonical_image_url: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    status: Optional[CanonicalVehicleStatus] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VehicleCreate(BaseModel):
    """Vehicle creation model"""
    title: str = Field(..., description="Vehicle title")
    price: Optional[str] = Field(None, description="Current price as string")
    price_numeric: Optional[float] = Field(None, description="Current price as number")
    mercadolibre_id: str = Field(..., description="MercadoLibre listing ID")
    url: str = Field(..., description="MercadoLibre URL")
    year: Optional[str] = Field(None, description="Vehicle year")
    kilometers: Optional[str] = Field(None, description="Vehicle kilometers")
    location: Optional[str] = Field(None, description="Vehicle location")
    image_url: Optional[str] = Field(None, description="Main image URL")
    brand: Optional[str] = Field(None, description="Vehicle brand")
    model: Optional[str] = Field(None, description="Vehicle model")
    edition: Optional[str] = Field(None, description="Vehicle edition/trim")
    engine: Optional[str] = Field(None, description="Engine specifications")
    transmission: Optional[str] = Field(None, description="Transmission type")
    fuel_type: Optional[str] = Field(None, description="Fuel type")
    color: Optional[str] = Field(None, description="Vehicle color")
    doors: Optional[int] = Field(None, description="Number of doors")
    additional_info: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional scraped data")
    canonical_vehicle_id: Optional[str] = Field(None, description="Reference to canonical vehicle")

class Vehicle(BaseModel):
    """Vehicle model with database fields"""
    id: Optional[str] = Field(None, alias="_id")
    title: str
    price: Optional[str] = None
    price_numeric: Optional[float] = None
    mercadolibre_id: str
    url: str
    year: Optional[str] = None
    kilometers: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    edition: Optional[str] = None
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    color: Optional[str] = None
    doors: Optional[int] = None
    additional_info: Dict[str, Any] = Field(default_factory=dict)
    canonical_vehicle_id: Optional[str] = Field(None, description="Reference to canonical vehicle")
    status: VehicleStatus = VehicleStatus.ACTIVE
    views_count: int = 0
    tracking_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_scraped_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            bson.ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class VehicleUpdate(BaseModel):
    """Vehicle update model"""
    title: Optional[str] = None
    price: Optional[str] = None
    price_numeric: Optional[float] = None
    year: Optional[str] = None
    kilometers: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    engine: Optional[str] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None
    color: Optional[str] = None
    doors: Optional[int] = None
    additional_info: Optional[Dict[str, Any]] = None
    status: Optional[VehicleStatus] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PriceHistory(BaseModel):
    """Price history model for MongoDB time series collection"""
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time field for time series")
    metadata: Dict[str, Any] = Field(..., description="Metadata for time series grouping")
    price: str = Field(..., description="Price as string")
    price_numeric: float = Field(..., description="Price as number")
    scraping_session_id: Optional[str] = Field(None, description="Reference to scraping session")
    
    @classmethod
    def create_from_vehicle_data(
        cls,
        vehicle_id: str,
        mercadolibre_id: str,
        price: str,
        price_numeric: float,
        scraping_session_id: Optional[str] = None
    ) -> "PriceHistory":
        """Create PriceHistory instance with proper time series metadata structure"""
        return cls(
            timestamp=datetime.utcnow(),
            metadata={
                "vehicle_id": vehicle_id,
                "mercadolibre_id": mercadolibre_id,
                "vehicle_type": "car",  # Can be extended for different vehicle types
                "source": "mercadolibre_co"
            },
            price=price,
            price_numeric=price_numeric,
            scraping_session_id=scraping_session_id
        )

    # Helper properties to maintain backward compatibility
    @property
    def vehicle_id(self) -> str:
        """Get vehicle_id from metadata"""
        return self.metadata.get("vehicle_id", "")
    
    @property
    def mercadolibre_id(self) -> str:
        """Get mercadolibre_id from metadata"""
        return self.metadata.get("mercadolibre_id", "")

    class Config:
        populate_by_name = True
        json_encoders = {
            bson.ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class ScrapingJobStatus(str, Enum):
    """Scraping job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ScrapingJobType(str, Enum):
    """Scraping job type enumeration"""
    BULK_LISTINGS = "bulk_listings"
    SINGLE_VEHICLE = "single_vehicle"
    PRICE_UPDATE = "price_update"

class ScrapingJob(BaseModel):
    """Scraping job model"""
    id: Optional[str] = Field(None, alias="_id")
    job_type: ScrapingJobType
    status: ScrapingJobStatus = ScrapingJobStatus.PENDING
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Job parameters")
    total_items: Optional[int] = None
    processed_items: int = 0
    successful_items: int = 0
    failed_items: int = 0
    progress_percentage: float = 0.0
    results: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            bson.ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class ScrapingStats(BaseModel):
    """Scraping statistics model"""
    total_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    running_jobs: int = 0
    total_vehicles_scraped: int = 0
    last_scraping_time: Optional[datetime] = None
    average_scraping_time: Optional[float] = None

class VehicleSearchFilters(BaseModel):
    """Vehicle search filters"""
    search_query: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    min_kilometers: Optional[int] = None
    max_kilometers: Optional[int] = None
    status: Optional[VehicleStatus] = VehicleStatus.ACTIVE
    
class VehicleSearchResponse(BaseModel):
    """Vehicle search response"""
    vehicles: List[Vehicle]
    total_count: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool 