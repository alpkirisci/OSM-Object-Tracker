from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from dependencies import get_db
from schemas.all import TrackedObject, TrackedObjectCreate, TrackedObjectUpdate, SensorData, SensorDataCreate, IncomingSensorData, DataValidationLogCreate, ObjectType, TrackedObjectWithTypeInfo
from models.all import TrackedObject as TrackedObjectModel, SensorData as SensorDataModel, Sensor as SensorModel, DataValidationLog as DataValidationLogModel, CustomObjectType as CustomObjectTypeModel, DataSource as DataSourceModel
from uuid import uuid4
import logging

router = APIRouter(
    prefix="/objects",
    tags=["objects"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=TrackedObject)
def create_object(object: TrackedObjectCreate, db: Session = Depends(get_db)):
    db_object = TrackedObjectModel(
        id=str(uuid4()),
        object_id=object.object_id,
        name=object.name,
        type=object.type,
        additional_info=object.additional_info,
        source_id=object.source_id
    )
    db.add(db_object)
    db.commit()
    db.refresh(db_object)
    return db_object

@router.get("/", response_model=List[TrackedObjectWithTypeInfo])
def get_objects(
    skip: int = 0, 
    limit: int = 100, 
    type: Optional[str] = None,
    source_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrackedObjectModel)
    
    # Apply filters if provided
    if type is not None:
        query = query.filter(TrackedObjectModel.type == type)
    
    if source_id:
        query = query.filter(TrackedObjectModel.source_id == source_id)
    
    objects = query.offset(skip).limit(limit).all()
    
    # Get all type information in one query
    type_names = [obj.type for obj in objects]
    custom_types = db.query(CustomObjectTypeModel).filter(
        CustomObjectTypeModel.name.in_(type_names),
        CustomObjectTypeModel.is_active == True
    ).all()
    
    # Create a lookup dictionary
    type_lookup = {t.name: t for t in custom_types}
    
    # Add custom_type to each object
    for obj in objects:
        obj.custom_type = type_lookup.get(obj.type)
    
    return objects

@router.get("/{object_id}", response_model=TrackedObjectWithTypeInfo)
def get_object(object_id: str, db: Session = Depends(get_db)):
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.id == object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Get type info if available
    custom_type = db.query(CustomObjectTypeModel).filter(
        CustomObjectTypeModel.name == db_object.type,
        CustomObjectTypeModel.is_active == True
    ).first()
    
    db_object.custom_type = custom_type
    return db_object

@router.get("/by-object-id/{external_object_id}", response_model=TrackedObjectWithTypeInfo)
def get_object_by_external_id(external_object_id: str, db: Session = Depends(get_db)):
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.object_id == external_object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Get type info if available
    custom_type = db.query(CustomObjectTypeModel).filter(
        CustomObjectTypeModel.name == db_object.type,
        CustomObjectTypeModel.is_active == True
    ).first()
    
    db_object.custom_type = custom_type
    return db_object

@router.put("/{object_id}", response_model=TrackedObjectWithTypeInfo)
def update_object(object_id: str, object: TrackedObjectUpdate, db: Session = Depends(get_db)):
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.id == object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Update object fields if provided
    update_data = object.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_object, key, value)
    
    db.commit()
    db.refresh(db_object)
    return db_object

@router.delete("/{object_id}")
def delete_object(object_id: str, db: Session = Depends(get_db)):
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.id == object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    db.delete(db_object)
    db.commit()
    return {"detail": "Object deleted"}

# Sensor data endpoints
@router.post("/{object_id}/sensor-data", response_model=SensorData)
def add_sensor_data(object_id: str, data: SensorDataCreate, db: Session = Depends(get_db)):
    # Verify object exists
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.id == object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Create and add sensor data
    db_data = SensorDataModel(
        id=str(uuid4()),
        tracked_object_id=object_id,
        raw_sensor_id=data.raw_sensor_id,
        latitude=data.latitude,
        longitude=data.longitude,
        altitude=data.altitude,
        additional_data=data.additional_data,
        timestamp=data.timestamp or datetime.utcnow()
    )
    
    # Try to associate with a known sensor if it exists
    sensor = db.query(SensorModel).filter(SensorModel.sensor_id == data.raw_sensor_id).first()
    if sensor:
        db_data.sensor_id = sensor.id
    
    db.add(db_data)
    db.commit()
    db.refresh(db_data)
    return db_data

@router.get("/{object_id}/sensor-data", response_model=List[SensorData])
def get_object_sensor_data(
    object_id: str, 
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Verify object exists
    db_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.id == object_id).first()
    if db_object is None:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Get sensor data for this object
    data = db.query(SensorDataModel)\
        .filter(SensorDataModel.tracked_object_id == object_id)\
        .order_by(SensorDataModel.timestamp.desc())\
        .offset(skip).limit(limit).all()
    
    return data

# Endpoint for handling incoming sensor data
@router.post("/incoming-data", response_model=SensorData)
def process_incoming_sensor_data(data: IncomingSensorData, db: Session = Depends(get_db)):
    # Convert type to lowercase for consistency
    object_type = data.object_type.lower().strip()
    
    # Check if we have styling for this type
    # If not, we'll still process it - just without custom styling
    custom_type = db.query(CustomObjectTypeModel).filter(
        CustomObjectTypeModel.name == object_type,
        CustomObjectTypeModel.is_active == True
    ).first()
    
    if not custom_type:
        # Log unknown type as informational - not stopping processing
        # Process the data to make it JSON serializable
        raw_data = data.dict()
        if "timestamp" in raw_data and raw_data["timestamp"]:
            raw_data["timestamp"] = raw_data["timestamp"].isoformat()
            
        log_entry = DataValidationLogModel(
            id=str(uuid4()),
            log_type="info",
            message=f"No styling found for object type: {data.object_type}",
            raw_data=raw_data,
            object_id=data.object_id,
            sensor_id=data.sensor_id
        )
        db.add(log_entry)
        db.commit()
    
    # Check if sensor exists
    sensor = db.query(SensorModel).filter(SensorModel.sensor_id == data.sensor_id).first()
    sensor_id = sensor.id if sensor else None
    
    if not sensor:
        # Log unknown sensor
        # Process the data to make it JSON serializable
        raw_data = data.dict()
        if "timestamp" in raw_data and raw_data["timestamp"]:
            raw_data["timestamp"] = raw_data["timestamp"].isoformat()
            
        log_entry = DataValidationLogModel(
            id=str(uuid4()),
            log_type="warning",
            message=f"Unknown sensor ID: {data.sensor_id}",
            raw_data=raw_data,
            object_id=data.object_id,
            sensor_id=data.sensor_id
        )
        db.add(log_entry)
        db.commit()
    
    # Look for existing object with this object_id
    tracked_object = db.query(TrackedObjectModel).filter(TrackedObjectModel.object_id == data.object_id).first()
    
    if tracked_object:
        # Check for mismatched object information
        if (data.object_name and tracked_object.name and data.object_name != tracked_object.name) or \
           (object_type != tracked_object.type):
            # Process the data to make it JSON serializable
            raw_data = data.dict()
            if "timestamp" in raw_data and raw_data["timestamp"]:
                raw_data["timestamp"] = raw_data["timestamp"].isoformat()
                
            log_entry = DataValidationLogModel(
                id=str(uuid4()),
                log_type="warning",
                message=f"Mismatched object information for object ID: {data.object_id}",
                raw_data=raw_data,
                object_id=data.object_id,
                sensor_id=data.sensor_id
            )
            db.add(log_entry)
            db.commit()
            
            # Continue processing but don't update the object
    else:
        # Get source_id from additional_data if available, otherwise use default
        source_id = "auto_created"
        if data.additional_data and "source" in data.additional_data:
            # Try to find a data source with this name
            source_name = data.additional_data["source"]
            data_source = db.query(DataSourceModel).filter(DataSourceModel.name == source_name).first()
            if data_source:
                source_id = data_source.id
            else:
                # Look for data sources with this name in their description
                data_source = db.query(DataSourceModel).filter(DataSourceModel.description.ilike(f"%{source_name}%")).first()
                if data_source:
                    source_id = data_source.id
        
        # Create new tracked object
        tracked_object = TrackedObjectModel(
            id=str(uuid4()),
            object_id=data.object_id,
            name=data.object_name,
            type=object_type,
            additional_info={},
            source_id=source_id
        )
        db.add(tracked_object)
        db.commit()
        db.refresh(tracked_object)
    
    # Create sensor data entry
    sensor_data = SensorDataModel(
        id=str(uuid4()),
        tracked_object_id=tracked_object.id,
        sensor_id=sensor_id,
        raw_sensor_id=data.sensor_id,
        latitude=data.latitude,
        longitude=data.longitude,
        altitude=data.altitude,
        additional_data=data.additional_data,
        timestamp=data.timestamp or datetime.utcnow()
    )
    db.add(sensor_data)
    db.commit()
    db.refresh(sensor_data)
    
    return sensor_data 