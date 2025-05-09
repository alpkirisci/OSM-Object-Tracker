from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies import get_db
from schemas.all import Sensor, SensorCreate, SensorUpdate
from models.all import Sensor as SensorModel
from uuid import uuid4

router = APIRouter(
    prefix="/sensors",
    tags=["sensors"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Sensor)
def create_sensor(sensor: SensorCreate, db: Session = Depends(get_db)):
    # Check if sensor with this ID already exists
    existing_sensor = db.query(SensorModel).filter(SensorModel.sensor_id == sensor.sensor_id).first()
    if existing_sensor:
        raise HTTPException(status_code=400, detail=f"Sensor with ID {sensor.sensor_id} already exists")
    
    # Create new sensor
    db_sensor = SensorModel(
        id=str(uuid4()),
        sensor_id=sensor.sensor_id,
        name=sensor.name,
        description=sensor.description,
        type=sensor.type,
        is_active=sensor.is_active
    )
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

@router.get("/", response_model=List[Sensor])
def get_sensors(
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SensorModel)
    
    # Apply filters if provided
    if is_active is not None:
        query = query.filter(SensorModel.is_active == is_active)
    
    if type:
        query = query.filter(SensorModel.type == type)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{sensor_id}", response_model=Sensor)
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    db_sensor = db.query(SensorModel).filter(SensorModel.id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return db_sensor

@router.get("/by-sensor-id/{external_sensor_id}", response_model=Sensor)
def get_sensor_by_external_id(external_sensor_id: str, db: Session = Depends(get_db)):
    db_sensor = db.query(SensorModel).filter(SensorModel.sensor_id == external_sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return db_sensor

@router.put("/{sensor_id}", response_model=Sensor)
def update_sensor(sensor_id: str, sensor: SensorUpdate, db: Session = Depends(get_db)):
    db_sensor = db.query(SensorModel).filter(SensorModel.id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    # Update sensor fields if provided
    update_data = sensor.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sensor, key, value)
    
    db.commit()
    db.refresh(db_sensor)
    return db_sensor

@router.delete("/{sensor_id}")
def delete_sensor(sensor_id: str, db: Session = Depends(get_db)):
    db_sensor = db.query(SensorModel).filter(SensorModel.id == sensor_id).first()
    if db_sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    
    db.delete(db_sensor)
    db.commit()
    return {"detail": "Sensor deleted"} 