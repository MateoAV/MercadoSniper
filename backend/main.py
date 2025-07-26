from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager
import asyncio
import logging
import socketio

from api.routes import alerts, vehicles, scraping, analytics, canonical_vehicles
from services.websocket_manager import WebSocketManager
from core.config import settings
from core.database import init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.ALLOWED_ORIGINS
)

# Initialize WebSocket manager
websocket_manager = WebSocketManager(sio)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting MercadoSniper API...")
    await init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down MercadoSniper API...")

app = FastAPI(
    title="MercadoSniper API",
    description="Intelligent Price Tracking System for MercadoLibre Colombia",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(vehicles.router, prefix="/api/vehicles", tags=["vehicles"])
app.include_router(canonical_vehicles.router, prefix="/api", tags=["canonical-vehicles"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["scraping"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Handle Socket.IO connection"""
    logger.info(f"Client {sid} connected")
    await sio.emit('notification', {
        'type': 'connection',
        'message': 'Connected to MercadoSniper API',
        'client_id': sid
    }, room=sid)

@sio.event
async def disconnect(sid):
    """Handle Socket.IO disconnection"""
    logger.info(f"Client {sid} disconnected")

@sio.event
async def subscribe(sid, data):
    """Generic subscribe handler"""
    channel = data.get('channel')
    if channel:
        await sio.enter_room(sid, channel)
        logger.info(f"Client {sid} subscribed to channel {channel}")

@sio.event
async def unsubscribe(sid, data):
    """Generic unsubscribe handler"""
    channel = data.get('channel')
    if channel:
        await sio.leave_room(sid, channel)
        logger.info(f"Client {sid} unsubscribed from channel {channel}")

@sio.event
async def subscribe_to_vehicle(sid, data):
    """Subscribe to vehicle updates"""
    vehicle_id = data.get('vehicle_id')
    if vehicle_id:
        await sio.enter_room(sid, f'vehicle_{vehicle_id}')
        logger.info(f"Client {sid} subscribed to vehicle {vehicle_id}")

@sio.event
async def unsubscribe_from_vehicle(sid, data):
    """Unsubscribe from vehicle updates"""
    vehicle_id = data.get('vehicle_id')
    if vehicle_id:
        await sio.leave_room(sid, f'vehicle_{vehicle_id}')
        logger.info(f"Client {sid} unsubscribed from vehicle {vehicle_id}")

@sio.event
async def subscribe_to_alerts(sid):
    """Subscribe to alerts"""
    await sio.enter_room(sid, 'alerts')
    logger.info(f"Client {sid} subscribed to alerts")

@sio.event
async def unsubscribe_from_alerts(sid):
    """Unsubscribe from alerts"""
    await sio.leave_room(sid, 'alerts')
    logger.info(f"Client {sid} unsubscribed from alerts")

@sio.event
async def subscribe_to_scraping_job(sid, data):
    """Subscribe to scraping job updates"""
    job_id = data.get('job_id')
    if job_id:
        await sio.enter_room(sid, f'scraping_job_{job_id}')
        logger.info(f"Client {sid} subscribed to job {job_id}")

@sio.event
async def unsubscribe_from_scraping_job(sid, data):
    """Unsubscribe from scraping job updates"""
    job_id = data.get('job_id')
    if job_id:
        await sio.leave_room(sid, f'scraping_job_{job_id}')
        logger.info(f"Client {sid} unsubscribed from job {job_id}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "MercadoSniper API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )

# Mount Socket.IO app
socket_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    uvicorn.run(
        "main:socket_app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    ) 