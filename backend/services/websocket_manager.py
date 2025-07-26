import asyncio
import json
import logging
from typing import Dict, List, Any
import socketio

logger = logging.getLogger(__name__)

class WebSocketManager:
    """Socket.IO connection manager for real-time updates"""
    
    def __init__(self, sio: socketio.AsyncServer):
        self.sio = sio
        
    async def send_to_client(self, client_id: str, message_type: str, data: Any):
        """Send a message to a specific client"""
        try:
            message = {
                "type": message_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            await self.sio.emit(message_type, data, room=client_id)
        except Exception as e:
            logger.error(f"Error sending message to client {client_id}: {e}")
    
    async def broadcast(self, message_type: str, data: Any):
        """Broadcast a message to all connected clients"""
        try:
            message = {
                "type": message_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            await self.sio.emit(message_type, data)
        except Exception as e:
            logger.error(f"Error broadcasting message: {e}")
    
    async def send_message(self, message_type: str, data: Any, client_id: str = None):
        """Send a message to a specific client or broadcast to all"""
        if client_id:
            await self.send_to_client(client_id, message_type, data)
        else:
            await self.broadcast(message_type, data)
    
    async def send_scraping_update(self, job_id: str, status: str, **kwargs):
        """Send scraping progress update"""
        data = {
            "job": {
                "_id": job_id,
                "status": status,
                **kwargs
            }
        }
        room = f"scraping_job_{job_id}"
        logger.info(f"🔍 DEBUG: Sending scraping update to room {room}: {data}")
        logger.info(f"🔍 DEBUG: Event name: scraping_job_update")
        logger.info(f"🔍 DEBUG: Data structure: {type(data)}")
        logger.info(f"🔍 DEBUG: Data keys: {list(data.keys())}")
        await self.sio.emit("scraping_job_update", data, room=room)
    
    async def send_price_alert(self, alert_data: Dict[str, Any]):
        """Send price alert notification"""
        await self.sio.emit("price_alert", alert_data, room="alerts")
    
    async def send_system_notification(self, message: str, level: str = "info"):
        """Send system notification"""
        data = {
            "message": message,
            "level": level,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.sio.emit("system_notification", data)
    
    async def send_vehicle_update(self, vehicle_id: str, vehicle_data: Dict[str, Any]):
        """Send vehicle update to subscribed clients"""
        await self.sio.emit("vehicle_update", {"vehicle": vehicle_data}, room=f"vehicle_{vehicle_id}")
    
    async def send_vehicle_price_update(self, vehicle_id: str, vehicle_data: Dict[str, Any]):
        """Send vehicle price update to subscribed clients"""
        await self.sio.emit("vehicle_price_update", {"vehicle": vehicle_data}, room=f"vehicle_{vehicle_id}")
    
    async def send_alert_triggered(self, alert_data: Dict[str, Any]):
        """Send alert triggered notification"""
        await self.sio.emit("alert_triggered", alert_data, room="alerts") 