from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
import logging

from dependencies import get_db
from core.websocket import websocket_manager
from models.all import OSMObject, DataSource
from services.data_source_service import DataSourceService

router = APIRouter(
    prefix="/api/ws",
    tags=["websockets"]
)

logger = logging.getLogger(__name__)

@router.websocket("/objects/{client_id}")
async def websocket_objects_endpoint(websocket: WebSocket, client_id: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint for real-time updates on OSM objects
    """
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                
                # Process the message based on its type
                message_type = json_data.get("type")
                
                if message_type == "subscribe":
                    # Client is subscribing to updates for specific object types
                    object_types = json_data.get("object_types", [])
                    await websocket.send_json({
                        "type": "subscribe_ack",
                        "message": f"Subscribed to updates for {', '.join(object_types) or 'all'} objects"
                    })
                    
                elif message_type == "get_objects":
                    # Client is requesting objects with optional filtering
                    object_type = json_data.get("object_type")
                    limit = json_data.get("limit", 100)
                    
                    query = db.query(OSMObject)
                    if object_type:
                        query = query.filter(OSMObject.type == object_type)
                    
                    objects = query.limit(limit).all()
                    
                    # Convert objects to dict for JSON serialization
                    objects_data = [
                        {
                            "id": obj.id,
                            "osm_id": obj.osm_id,
                            "type": obj.type,
                            "tags": obj.tags,
                            "geom": obj.geom,
                            "source_id": obj.source_id
                        } 
                        for obj in objects
                    ]
                    
                    await websocket.send_json({
                        "type": "objects_data",
                        "objects": objects_data
                    })
                
                else:
                    # Unknown message type
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
                    
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from client {client_id}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")

@router.websocket("/data-source/{source_id}/{client_id}")
async def websocket_data_source_endpoint(
    websocket: WebSocket, 
    source_id: str, 
    client_id: str, 
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for receiving data from a data source
    This allows external systems to push data to our application
    """
    # Verify that the data source exists and is active
    data_source = db.query(DataSource).filter(
        DataSource.id == source_id,
        DataSource.is_active == True
    ).first()
    
    if not data_source:
        # Close the connection if data source not found or inactive
        await websocket.close(code=1008, reason="Invalid or inactive data source")
        return
    
    data_source_service = DataSourceService(db)
    await websocket_manager.connect(websocket, f"source_{source_id}_{client_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                
                # Process incoming data using the service
                osm_object = await data_source_service.process_incoming_data(source_id, json_data)
                
                if osm_object:
                    # Send acknowledgment
                    await websocket.send_json({
                        "type": "ack",
                        "message": "Data processed successfully",
                        "object_id": osm_object.id
                    })
                else:
                    # Failed to process data
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to process data"
                    })
                
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from data source {source_id}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    
    except WebSocketDisconnect:
        websocket_manager.disconnect(f"source_{source_id}_{client_id}")
        logger.info(f"Data source {source_id} client {client_id} disconnected") 