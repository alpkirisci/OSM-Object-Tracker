import asyncio
import random
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, WebSocket
import httpx
import uvicorn
import os
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Pydantic model for incoming sensor data
class SensorData(BaseModel):
    object_id: str
    object_name: Optional[str] = None
    object_type: str
    sensor_id: str
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

# Create FastAPI app
app = FastAPI(
    title="OSM Tracker Test Data Source",
    description="Generates simulated sensor data for testing",
    version="1.0.0",
)

# Configuration (could be moved to environment variables)
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
UPDATE_INTERVAL = int(os.getenv("UPDATE_INTERVAL", "2"))  # seconds
NUM_OBJECTS = int(os.getenv("NUM_OBJECTS", "5"))  # number of objects to simulate

# In-memory storage for simulated objects
simulated_objects = []
sensors = []
data_source_id = None

# Object types
OBJECT_TYPES = ["ship", "car", "airplane", "drone"]

# Initialize objects and sensors
def initialize_objects_and_sensors():
    global simulated_objects, sensors
    
    # Create simulated objects
    simulated_objects = [
        {
            "id": f"SIM-OBJ-{i+1}",
            "name": f"Simulated Object {i+1}",
            "type": random.choice(OBJECT_TYPES),
            "latitude": 41.0 + random.uniform(-1, 1),
            "longitude": 29.0 + random.uniform(-1, 1),
            "altitude": random.uniform(0, 1000) if random.random() > 0.5 else None,
            "speed": random.uniform(10, 100),
            "heading": random.uniform(0, 360),
        }
        for i in range(NUM_OBJECTS)
    ]
    
    # Create simulated sensors
    sensors = [
        {
            "id": f"SIM-SENSOR-{i+1}",
            "name": f"Simulated Sensor {i+1}",
            "type": "gps",
        }
        for i in range(3)  # 3 different sensors
    ]

# Register this data source with backend
async def register_data_source():
    global data_source_id
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{BACKEND_URL}/data-sources",
                json={
                    "name": "Simulated Data Source",
                    "description": "Automatically generated test data source",
                    "type": "simulation",
                    "connection_info": {
                        "url": "http://test_data_source:8001"
                    },
                    "is_active": True
                }
            )
            
            if response.status_code == 201:
                data = response.json()
                data_source_id = data["id"]
                logger.info(f"Successfully registered data source with ID: {data_source_id}")
                return data_source_id
            else:
                logger.error(f"Failed to register data source. Status: {response.status_code}, Response: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Error registering data source: {e}")
        return None

# Register sensors with backend
async def register_sensors():
    try:
        async with httpx.AsyncClient() as client:
            for sensor in sensors:
                response = await client.post(
                    f"{BACKEND_URL}/sensors",
                    json={
                        "sensor_id": sensor["id"],
                        "name": sensor["name"],
                        "description": "Simulated GPS sensor for testing",
                        "type": sensor["type"],
                        "is_active": True
                    }
                )
                
                if response.status_code not in (201, 200, 400):  # 400 means it already exists
                    logger.warning(f"Failed to register sensor {sensor['id']}. Status: {response.status_code}")
    except Exception as e:
        logger.error(f"Error registering sensors: {e}")

# Update object positions
def update_object_positions():
    for obj in simulated_objects:
        # Randomly move the object
        obj["latitude"] += random.uniform(-0.01, 0.01)
        obj["longitude"] += random.uniform(-0.01, 0.01)
        if obj["altitude"] is not None:
            obj["altitude"] += random.uniform(-10, 10)
        
        # Update heading and speed
        obj["heading"] += random.uniform(-10, 10) % 360
        obj["speed"] += random.uniform(-5, 5)
        if obj["speed"] < 0:
            obj["speed"] = 0

# Send data to backend
async def send_object_data():
    try:
        async with httpx.AsyncClient() as client:
            for obj in simulated_objects:
                # Randomly select a sensor
                sensor = random.choice(sensors)
                
                # Current time for consistent timestamp
                current_time = datetime.utcnow()
                
                # Prepare payload
                data = SensorData(
                    object_id=obj["id"],
                    object_name=obj["name"],
                    object_type=obj["type"],
                    sensor_id=sensor["id"],
                    latitude=obj["latitude"],
                    longitude=obj["longitude"],
                    altitude=obj["altitude"],
                    additional_data={
                        "speed": obj["speed"],
                        "heading": obj["heading"],
                        "source": "Simulated Data Source"
                    },
                    timestamp=current_time
                )
                
                # Convert to JSON-compatible dict with ISO formatted datetime
                json_data = data.dict(exclude_none=True)
                if "timestamp" in json_data:
                    json_data["timestamp"] = current_time.isoformat()
                
                # Send to backend
                response = await client.post(
                    f"{BACKEND_URL}/objects/incoming-data",
                    json=json_data
                )
                
                if response.status_code not in (200, 201):
                    logger.warning(f"Failed to send data for object {obj['id']}. Status: {response.status_code}")
                else:
                    logger.info(f"Successfully sent data for object {obj['id']}")
    except Exception as e:
        logger.error(f"Error sending object data: {e}")

# Background task for data simulation
async def data_simulation_task():
    # Wait for backend to be ready
    await asyncio.sleep(10)
    
    # Initialize simulation
    initialize_objects_and_sensors()
    
    # Register with backend
    await register_data_source()
    await register_sensors()
    
    # Main simulation loop
    while True:
        update_object_positions()
        await send_object_data()
        await asyncio.sleep(UPDATE_INTERVAL)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(data_simulation_task())

@app.get("/")
async def root():
    return {"message": "Test Data Source API operational"}

@app.get("/status")
async def status():
    return {
        "status": "running",
        "simulated_objects": len(simulated_objects),
        "sensors": len(sensors),
        "data_source_id": data_source_id,
        "backend_url": BACKEND_URL
    }

@app.get("/objects")
async def get_objects():
    return simulated_objects

@app.get("/sensors")
async def get_sensors():
    return sensors

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001,
        reload=False
    ) 