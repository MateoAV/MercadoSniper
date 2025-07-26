from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict, Any
import logging

from models.vehicle import (
    Vehicle, 
    VehicleCreate, 
    VehicleUpdate, 
    VehicleSearchFilters, 
    VehicleSearchResponse,
    PriceHistory
)
from services.vehicle_service import VehicleService
from core.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/search", response_model=VehicleSearchResponse)
async def search_vehicles(
    search_query: Optional[str] = Query(None, description="Search query"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_year: Optional[int] = Query(None, description="Minimum year"),
    max_year: Optional[int] = Query(None, description="Maximum year"),
    brand: Optional[str] = Query(None, description="Vehicle brand"),
    model: Optional[str] = Query(None, description="Vehicle model"),
    location: Optional[str] = Query(None, description="Location"),
    fuel_type: Optional[str] = Query(None, description="Fuel type"),
    transmission: Optional[str] = Query(None, description="Transmission type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db=Depends(get_database)
):
    """Search vehicles with filters and pagination"""
    try:
        vehicle_service = VehicleService(db)
        
        filters = VehicleSearchFilters(
            search_query=search_query,
            min_price=min_price,
            max_price=max_price,
            min_year=min_year,
            max_year=max_year,
            brand=brand,
            model=model,
            location=location,
            fuel_type=fuel_type,
            transmission=transmission
        )
        
        return await vehicle_service.search_vehicles(filters, page, page_size)
        
    except Exception as e:
        logger.error(f"Error searching vehicles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, db=Depends(get_database)):
    """Get vehicle by ID"""
    try:
        vehicle_service = VehicleService(db)
        vehicle = await vehicle_service.get_vehicle_by_id(vehicle_id)
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
        return vehicle
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mercadolibre/{mercadolibre_id}", response_model=Vehicle)
async def get_vehicle_by_ml_id(mercadolibre_id: str, db=Depends(get_database)):
    """Get vehicle by MercadoLibre ID"""
    try:
        vehicle_service = VehicleService(db)
        vehicle = await vehicle_service.get_vehicle_by_mercadolibre_id(mercadolibre_id)
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
        return vehicle
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting vehicle by ML ID {mercadolibre_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{vehicle_id}", response_model=Vehicle)
async def update_vehicle(
    vehicle_id: str, 
    update_data: VehicleUpdate, 
    db=Depends(get_database)
):
    """Update vehicle by ID"""
    try:
        vehicle_service = VehicleService(db)
        vehicle = await vehicle_service.update_vehicle(vehicle_id, update_data)
        
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
        return vehicle
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, db=Depends(get_database)):
    """Delete vehicle by ID"""
    try:
        vehicle_service = VehicleService(db)
        deleted = await vehicle_service.delete_vehicle(vehicle_id)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Vehicle not found")
            
        return {"message": "Vehicle deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vehicle_id}/price-history", response_model=List[PriceHistory])
async def get_vehicle_price_history(
    vehicle_id: str, 
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of price records"),
    db=Depends(get_database)
):
    """Get price history for a vehicle from time series collection"""
    try:
        vehicle_service = VehicleService(db)
        
        # Check if vehicle exists
        vehicle = await vehicle_service.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        history = await vehicle_service.get_vehicle_price_history(vehicle_id, limit)
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting price history for vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{vehicle_id}/price-analytics", response_model=Dict[str, Any])
async def get_vehicle_price_analytics(
    vehicle_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db=Depends(get_database)
):
    """Get advanced price analytics for a vehicle using time series data"""
    try:
        vehicle_service = VehicleService(db)
        
        # Check if vehicle exists
        vehicle = await vehicle_service.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        
        # Get price history for analysis
        history = await vehicle_service.get_vehicle_price_history(vehicle_id, limit=1000)
        
        if not history:
            return {
                "vehicle_id": vehicle_id,
                "message": "No price history available",
                "analytics": {}
            }
        
        # Calculate analytics
        prices = [h.price_numeric for h in history]
        
        analytics = {
            "vehicle_id": vehicle_id,
            "total_records": len(history),
            "date_range": {
                "from": history[-1].timestamp if history else None,
                "to": history[0].timestamp if history else None
            },
            "price_stats": {
                "current_price": prices[0] if prices else None,
                "highest_price": max(prices) if prices else None,
                "lowest_price": min(prices) if prices else None,
                "average_price": sum(prices) / len(prices) if prices else None,
                "price_variance": _calculate_variance(prices) if len(prices) > 1 else None
            },
            "price_changes": {
                "total_changes": len([i for i in range(1, len(prices)) if prices[i] != prices[i-1]]),
                "price_increases": len([i for i in range(1, len(prices)) if prices[i] > prices[i-1]]),
                "price_decreases": len([i for i in range(1, len(prices)) if prices[i] < prices[i-1]])
            }
        }
        
        # Calculate trend
        if len(prices) >= 2:
            price_change = prices[0] - prices[-1]
            price_change_percentage = (price_change / prices[-1]) * 100 if prices[-1] != 0 else 0
            analytics["trend"] = {
                "direction": "increasing" if price_change > 0 else "decreasing" if price_change < 0 else "stable",
                "change_amount": price_change,
                "change_percentage": price_change_percentage
            }
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting price analytics for vehicle {vehicle_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _calculate_variance(prices: List[float]) -> float:
    """Calculate price variance"""
    if len(prices) < 2:
        return 0.0
    
    mean = sum(prices) / len(prices)
    variance = sum((x - mean) ** 2 for x in prices) / (len(prices) - 1)
    return variance

@router.get("/", response_model=List[Vehicle])
async def get_recent_vehicles(
    limit: int = Query(10, ge=1, le=50, description="Number of vehicles to return"),
    db=Depends(get_database)
):
    """Get recently added/updated vehicles"""
    try:
        vehicle_service = VehicleService(db)
        vehicles = await vehicle_service.get_recent_vehicles(limit)
        return vehicles
        
    except Exception as e:
        logger.error(f"Error getting recent vehicles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/price-drops", response_model=List[Dict[str, Any]])
async def get_price_drops(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back for price drops"),
    limit: int = Query(10, ge=1, le=50, description="Number of price drops to return"),
    db=Depends(get_database)
):
    """Get vehicles with recent price drops using time series analytics"""
    try:
        vehicle_service = VehicleService(db)
        price_drops = await vehicle_service.get_price_drops(hours, limit)
        return price_drops
        
    except Exception as e:
        logger.error(f"Error getting price drops: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/stats", response_model=Dict[str, Any])
async def get_vehicle_stats(db=Depends(get_database)):
    """Get vehicle statistics"""
    try:
        vehicle_service = VehicleService(db)
        stats = await vehicle_service.get_vehicle_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Error getting vehicle stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/time-series-summary", response_model=Dict[str, Any])
async def get_time_series_summary(
    days: int = Query(7, ge=1, le=30, description="Number of days to summarize"),
    db=Depends(get_database)
):
    """Get time series summary statistics for all vehicles"""
    try:
        from datetime import datetime, timedelta
        
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Aggregation pipeline for time series summary
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": since_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "hour": {"$hour": "$timestamp"}
                    },
                    "avg_price": {"$avg": "$price_numeric"},
                    "min_price": {"$min": "$price_numeric"},
                    "max_price": {"$max": "$price_numeric"},
                    "price_count": {"$sum": 1},
                    "unique_vehicles": {"$addToSet": "$metadata.vehicle_id"}
                }
            },
            {
                "$addFields": {
                    "unique_vehicle_count": {"$size": "$unique_vehicles"}
                }
            },
            {
                "$sort": {"_id.date": 1, "_id.hour": 1}
            }
        ]
        
        vehicle_service = VehicleService(db)
        cursor = vehicle_service.price_history_collection.aggregate(pipeline)
        summary_data = await cursor.to_list(length=None)
        
        return {
            "summary_period_days": days,
            "from_date": since_date.isoformat(),
            "to_date": datetime.utcnow().isoformat(),
            "hourly_data": summary_data,
            "total_data_points": len(summary_data)
        }
        
    except Exception as e:
        logger.error(f"Error getting time series summary: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 