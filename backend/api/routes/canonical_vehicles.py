from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
import logging

from core.database import get_database
from services.canonical_vehicle_service import CanonicalVehicleService
from models.vehicle import (
    CanonicalVehicle,
    CanonicalVehicleCreate,
    CanonicalVehicleUpdate,
    Vehicle
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/canonical-vehicles", tags=["canonical-vehicles"])

async def get_canonical_service():
    """Dependency to get canonical vehicle service"""
    db = get_database()
    return CanonicalVehicleService(db)

@router.get("/", response_model=Dict[str, Any])
async def get_canonical_vehicles(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    model: Optional[str] = Query(None, description="Filter by model"),
    year: Optional[str] = Query(None, description="Filter by year"),
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Get canonical vehicles with pagination and filters"""
    try:
        filters = {}
        if brand:
            filters["brand"] = brand
        if model:
            filters["model"] = model
        if year:
            filters["year"] = year
            
        result = await canonical_service.get_canonical_vehicles_with_listings(
            page=page,
            page_size=page_size,
            filters=filters if filters else None
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting canonical vehicles: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{canonical_id}", response_model=CanonicalVehicle)
async def get_canonical_vehicle(
    canonical_id: str,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Get canonical vehicle by ID"""
    try:
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        if not canonical:
            raise HTTPException(status_code=404, detail="Canonical vehicle not found")
        
        return canonical
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting canonical vehicle {canonical_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{canonical_id}/listings", response_model=List[Vehicle])
async def get_canonical_vehicle_listings(
    canonical_id: str,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Get all listings for a canonical vehicle"""
    try:
        # Check if canonical vehicle exists
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        if not canonical:
            raise HTTPException(status_code=404, detail="Canonical vehicle not found")
        
        listings = await canonical_service.get_listings_for_canonical(canonical_id)
        return listings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting listings for canonical vehicle {canonical_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=CanonicalVehicle)
async def create_canonical_vehicle(
    canonical_data: CanonicalVehicleCreate,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Create a new canonical vehicle"""
    try:
        canonical = await canonical_service.create_canonical_vehicle(canonical_data)
        return canonical
        
    except Exception as e:
        logger.error(f"Error creating canonical vehicle: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{canonical_id}", response_model=CanonicalVehicle)
async def update_canonical_vehicle(
    canonical_id: str,
    update_data: CanonicalVehicleUpdate,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Update canonical vehicle"""
    try:
        # Check if canonical vehicle exists
        existing = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Canonical vehicle not found")
        
        # Update canonical vehicle
        update_dict = update_data.dict(exclude_unset=True)
        await canonical_service.canonical_vehicles_collection.update_one(
            {"_id": canonical_id},
            {"$set": update_dict}
        )
        
        # Return updated canonical vehicle
        updated = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        return updated
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating canonical vehicle {canonical_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{canonical_id}/update-stats")
async def update_canonical_vehicle_stats(
    canonical_id: str,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Manually update canonical vehicle statistics"""
    try:
        # Check if canonical vehicle exists
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        if not canonical:
            raise HTTPException(status_code=404, detail="Canonical vehicle not found")
        
        await canonical_service.update_canonical_vehicle_stats(canonical_id)
        
        # Return updated canonical vehicle
        updated = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        return updated
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating canonical vehicle stats {canonical_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{source_id}/merge/{target_id}")
async def merge_canonical_vehicles(
    source_id: str,
    target_id: str,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Merge two canonical vehicles (move all listings from source to target)"""
    try:
        # Check if both canonical vehicles exist
        source = await canonical_service.get_canonical_vehicle_by_id(source_id)
        if not source:
            raise HTTPException(status_code=404, detail="Source canonical vehicle not found")
        
        target = await canonical_service.get_canonical_vehicle_by_id(target_id)
        if not target:
            raise HTTPException(status_code=404, detail="Target canonical vehicle not found")
        
        # Perform merge
        success = await canonical_service.merge_canonical_vehicles(source_id, target_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="Merge failed - no listings to move")
        
        return {
            "message": f"Successfully merged canonical vehicle {source_id} into {target_id}",
            "source_id": source_id,
            "target_id": target_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error merging canonical vehicles {source_id} -> {target_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{canonical_id}/market-analysis")
async def get_canonical_vehicle_market_analysis(
    canonical_id: str,
    canonical_service: CanonicalVehicleService = Depends(get_canonical_service)
):
    """Get market analysis for a canonical vehicle"""
    try:
        # Check if canonical vehicle exists
        canonical = await canonical_service.get_canonical_vehicle_by_id(canonical_id)
        if not canonical:
            raise HTTPException(status_code=404, detail="Canonical vehicle not found")
        
        # Get all listings for analysis
        listings = await canonical_service.get_listings_for_canonical(canonical_id)
        
        if not listings:
            return {
                "canonical_vehicle": canonical,
                "market_analysis": {
                    "total_listings": 0,
                    "message": "No active listings found for analysis"
                }
            }
        
        # Calculate market analysis
        prices = [listing.price_numeric for listing in listings if listing.price_numeric]
        locations = [listing.location for listing in listings if listing.location]
        years = [listing.year for listing in listings if listing.year]
        
        analysis = {
            "total_listings": len(listings),
            "active_listings": len([l for l in listings if l.status == "active"]),
            "price_analysis": {},
            "location_distribution": {},
            "year_distribution": {},
            "average_views": sum(listing.views_count for listing in listings) / len(listings) if listings else 0
        }
        
        if prices:
            analysis["price_analysis"] = {
                "min_price": min(prices),
                "max_price": max(prices),
                "avg_price": sum(prices) / len(prices),
                "median_price": sorted(prices)[len(prices) // 2],
                "price_range": max(prices) - min(prices)
            }
        
        # Location distribution
        from collections import Counter
        location_counts = Counter(locations)
        analysis["location_distribution"] = dict(location_counts.most_common(10))
        
        # Year distribution
        year_counts = Counter(years)
        analysis["year_distribution"] = dict(year_counts.most_common())
        
        return {
            "canonical_vehicle": canonical,
            "market_analysis": analysis,
            "listings_sample": listings[:5]  # First 5 listings as sample
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market analysis for canonical vehicle {canonical_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 