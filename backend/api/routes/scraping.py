from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List, Optional
import uuid
import logging
import asyncio
from datetime import datetime

from models.vehicle import ScrapingJob, ScrapingJobType, ScrapingJobStatus, ScrapingStats
from services.scraping_service import MercadoLibreScraper
from services.websocket_manager import WebSocketManager
from services.vehicle_service import VehicleService
from core.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket manager will be injected from main app
async def get_websocket_manager() -> WebSocketManager:
    """Dependency to get WebSocket manager"""
    from main import websocket_manager
    return websocket_manager

@router.post("/start-bulk-scraping", response_model=Dict[str, Any])
async def start_bulk_scraping(
    background_tasks: BackgroundTasks,
    max_pages: Optional[int] = Query(None, description="Maximum pages to scrape"),
    db=Depends(get_database)
):
    """Start bulk scraping of all vehicle listings"""
    try:
        # Create scraping job
        job_id = str(uuid.uuid4())
        job = ScrapingJob(
            id=job_id,
            job_type=ScrapingJobType.BULK_LISTINGS,
            status=ScrapingJobStatus.PENDING,
            parameters={"max_pages": max_pages}
        )
        
        # Save job to database
        await db.scraping_jobs.insert_one(job.dict(by_alias=True))
        
        # Start background task
        background_tasks.add_task(
            run_bulk_scraping_task,
            job_id, 
            max_pages,
            db
        )
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": "Bulk scraping started successfully",
            "max_pages": max_pages
        }
        
    except Exception as e:
        logger.error(f"Error starting bulk scraping: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scrape-single-vehicle", response_model=Dict[str, Any])
async def scrape_single_vehicle(
    url: str,
    background_tasks: BackgroundTasks,
    save_to_db: bool = True,
    db=Depends(get_database)
):
    """Scrape a single vehicle listing"""
    try:
        # Create scraping job
        job_id = str(uuid.uuid4())
        job = ScrapingJob(
            id=job_id,
            job_type=ScrapingJobType.SINGLE_VEHICLE,
            status=ScrapingJobStatus.PENDING,
            parameters={"url": url, "save_to_db": save_to_db}
        )
        
        # Save job to database
        await db.scraping_jobs.insert_one(job.dict(by_alias=True))
        
        # Start background task
        background_tasks.add_task(
            run_single_vehicle_scraping_task,
            job_id,
            url,
            save_to_db,
            db
        )
        
        return {
            "job_id": job_id,
            "status": "started",
            "message": "Single vehicle scraping started",
            "url": url
        }
        
    except Exception as e:
        logger.error(f"Error starting single vehicle scraping: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{job_id}", response_model=ScrapingJob)
async def get_scraping_job(job_id: str, db=Depends(get_database)):
    """Get scraping job status and details"""
    try:
        job = await db.scraping_jobs.find_one({"_id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return ScrapingJob(**job)
        
    except Exception as e:
        logger.error(f"Error getting scraping job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs", response_model=List[ScrapingJob])
async def get_scraping_jobs(
    status: Optional[ScrapingJobStatus] = None,
    job_type: Optional[ScrapingJobType] = None,
    limit: int = Query(50, le=100),
    db=Depends(get_database)
):
    """Get list of scraping jobs with optional filtering"""
    try:
        query = {}
        if status:
            query["status"] = status
        if job_type:
            query["job_type"] = job_type
            
        cursor = db.scraping_jobs.find(query).sort("created_at", -1).limit(limit)
        jobs = await cursor.to_list(length=limit)
        
        return [ScrapingJob(**job) for job in jobs]
        
    except Exception as e:
        logger.error(f"Error getting scraping jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/job/{job_id}")
async def cancel_scraping_job(job_id: str, db=Depends(get_database)):
    """Cancel a running scraping job"""
    try:
        job = await db.scraping_jobs.find_one({"_id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job["status"] in [ScrapingJobStatus.COMPLETED, ScrapingJobStatus.FAILED]:
            raise HTTPException(
                status_code=400, 
                detail="Cannot cancel completed or failed job"
            )
        
        # Update job status
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": ScrapingJobStatus.CANCELLED,
                    "completed_at": datetime.utcnow(),
                    "error_message": "Cancelled by user"
                }
            }
        )
        
        # Send WebSocket notification
        websocket_manager = await get_websocket_manager()
        await websocket_manager.send_scraping_update(
            job_id, 
            ScrapingJobStatus.CANCELLED,
            progress_percentage=0,
            message="Job cancelled by user"
        )
        
        return {"message": "Job cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Error cancelling scraping job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=ScrapingStats)
async def get_scraping_stats(db=Depends(get_database)):
    """Get scraping statistics"""
    try:
        # Get job statistics
        total_jobs = await db.scraping_jobs.count_documents({})
        completed_jobs = await db.scraping_jobs.count_documents({"status": ScrapingJobStatus.COMPLETED})
        failed_jobs = await db.scraping_jobs.count_documents({"status": ScrapingJobStatus.FAILED})
        running_jobs = await db.scraping_jobs.count_documents({"status": ScrapingJobStatus.RUNNING})
        
        # Get total vehicles scraped
        total_vehicles = await db.vehicles.count_documents({})
        
        # Get last scraping time
        last_job = await db.scraping_jobs.find_one(
            {"status": ScrapingJobStatus.COMPLETED},
            sort=[("completed_at", -1)]
        )
        last_scraping_time = None
        if last_job and "completed_at" in last_job:
            last_scraping_time = last_job["completed_at"]
        
        # Calculate average scraping time (simplified)
        completed_jobs_cursor = db.scraping_jobs.find({
            "status": ScrapingJobStatus.COMPLETED,
            "started_at": {"$exists": True},
            "completed_at": {"$exists": True}
        })
        
        total_time = 0
        job_count = 0
        async for job in completed_jobs_cursor:
            if job.get("started_at") and job.get("completed_at"):
                duration = (job["completed_at"] - job["started_at"]).total_seconds()
                total_time += duration
                job_count += 1
        
        average_scraping_time = total_time / job_count if job_count > 0 else None
        
        return ScrapingStats(
            total_jobs=total_jobs,
            completed_jobs=completed_jobs,
            failed_jobs=failed_jobs,
            running_jobs=running_jobs,
            total_vehicles_scraped=total_vehicles,
            last_scraping_time=last_scraping_time,
            average_scraping_time=average_scraping_time
        )
        
    except Exception as e:
        logger.error(f"Error getting scraping stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task functions
async def run_bulk_scraping_task(job_id: str, max_pages: Optional[int], db):
    """Background task for bulk scraping with incremental progress updates"""
    websocket_manager = await get_websocket_manager()
    vehicle_service = VehicleService(db)
    
    try:
        # Update job status to running
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": ScrapingJobStatus.RUNNING,
                    "started_at": datetime.utcnow()
                }
            }
        )
        
        # Start scraping with incremental saving
        async with MercadoLibreScraper(websocket_manager) as scraper:
            all_vehicles = await scraper.scrape_all_listings_with_incremental_save(
                job_id, max_pages, vehicle_service, db
            )
            
            # Get final job stats from database
            final_job = await db.scraping_jobs.find_one({"_id": job_id})
            total_vehicles = len(all_vehicles)
            saved_count = final_job.get("successful_items", 0) if final_job else 0
            failed_count = final_job.get("failed_items", 0) if final_job else 0
            
            # Send completion notification
            await websocket_manager.send_scraping_update(
                job_id,
                ScrapingJobStatus.COMPLETED,
                progress_percentage=100,
                total_vehicles=total_vehicles,
                saved_count=saved_count,
                failed_count=failed_count,
                message=f"Bulk scraping completed! Scraped {total_vehicles} vehicles, saved {saved_count} to database."
            )
            
    except Exception as e:
        logger.error(f"Bulk scraping task failed: {e}")
        
        # Update job status to failed
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": ScrapingJobStatus.FAILED,
                    "completed_at": datetime.utcnow(),
                    "error_message": str(e)
                }
            }
        )
        
        # Send failure notification
        await websocket_manager.send_scraping_update(
            job_id,
            ScrapingJobStatus.FAILED,
            progress_percentage=0,
            error_message=str(e),
            message=f"Bulk scraping failed: {str(e)}"
        )

async def run_single_vehicle_scraping_task(
    job_id: str, 
    url: str, 
    save_to_db: bool, 
    db
):
    """Background task for single vehicle scraping"""
    websocket_manager = await get_websocket_manager()
    vehicle_service = VehicleService(db)
    
    try:
        # Update job status to running
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": ScrapingJobStatus.RUNNING,
                    "started_at": datetime.utcnow()
                }
            }
        )
        
        # Start scraping
        async with MercadoLibreScraper(websocket_manager) as scraper:
            vehicle_data = await scraper.scrape_single_vehicle(url)
            
            if not vehicle_data:
                raise Exception("Failed to scrape vehicle data")
            
            saved_vehicle = None
            if save_to_db:
                saved_vehicle = await vehicle_service.create_or_update_vehicle(vehicle_data)
            
            # Update job completion
            results = {
                "vehicle_data": vehicle_data.dict(),
                "saved_to_db": save_to_db,
                "database_id": str(saved_vehicle.get("_id")) if saved_vehicle else None
            }
            
            await db.scraping_jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": ScrapingJobStatus.COMPLETED,
                        "completed_at": datetime.utcnow(),
                        "total_items": 1,
                        "processed_items": 1,
                        "successful_items": 1,
                        "failed_items": 0,
                        "progress_percentage": 100.0,
                        "results": results
                    }
                }
            )
            
            # Send completion notification
            await websocket_manager.send_scraping_update(
                job_id,
                ScrapingJobStatus.COMPLETED,
                progress_percentage=100,
                vehicle_data=vehicle_data.dict(),
                saved_to_db=save_to_db,
                message=f"Single vehicle scraping completed! Scraped: {vehicle_data.title}"
            )
            
    except Exception as e:
        logger.error(f"Single vehicle scraping task failed: {e}")
        
        # Update job status to failed
        await db.scraping_jobs.update_one(
            {"_id": job_id},
            {
                "$set": {
                    "status": ScrapingJobStatus.FAILED,
                    "completed_at": datetime.utcnow(),
                    "error_message": str(e)
                }
            }
        )
        
        # Send failure notification
        await websocket_manager.send_scraping_update(
            job_id,
            ScrapingJobStatus.FAILED,
            progress_percentage=0,
            error_message=str(e),
            message=f"Single vehicle scraping failed: {str(e)}"
        ) 