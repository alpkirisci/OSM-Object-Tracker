from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from dependencies import get_db
from schemas.all import OSMObject, OSMObjectCreate, OSMObjectUpdate, ObjectLocation, ObjectLocationCreate
from models.all import OSMObject as OSMObjectModel
from models.all import ObjectLocation as ObjectLocationModel
from services.osm_service import OSMService

router = APIRouter(
    prefix="/api/objects",
    tags=["objects"]
)

@router.get("", response_model=List[OSMObject])
async def get_objects(
    type: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get all objects with optional filtering by type and tag
    """
    osm_service = OSMService(db)
    
    if type and tag:
        # Filter by both type and tag
        return osm_service.get_objects_by_type_and_tag(type, tag, limit, offset)
    elif type:
        # Filter by type only
        return osm_service.get_objects_by_type(type, limit, offset)
    elif tag:
        # Filter by tag only
        return osm_service.get_objects_by_tag(tag, None, limit, offset)
    else:
        # No filters
        query = db.query(OSMObjectModel)
        return query.offset(offset).limit(limit).all()

@router.get("/{object_id}", response_model=OSMObject)
async def get_object(object_id: str, db: Session = Depends(get_db)):
    """
    Get a specific object by ID
    """
    object = db.query(OSMObjectModel).filter(OSMObjectModel.id == object_id).first()
    if not object:
        raise HTTPException(status_code=404, detail="Object not found")
    return object

@router.post("", response_model=OSMObject, status_code=status.HTTP_201_CREATED)
async def create_object(
    object: OSMObjectCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new OSM object
    """
    db_object = OSMObjectModel(**object.dict())
    db.add(db_object)
    db.commit()
    db.refresh(db_object)
    return db_object

@router.put("/{object_id}", response_model=OSMObject)
async def update_object(
    object_id: str,
    object_update: OSMObjectUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing OSM object
    """
    db_object = db.query(OSMObjectModel).filter(OSMObjectModel.id == object_id).first()
    if not db_object:
        raise HTTPException(status_code=404, detail="Object not found")
    
    update_data = object_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_object, key, value)
    
    db.commit()
    db.refresh(db_object)
    return db_object

@router.delete("/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_object(
    object_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete an OSM object
    """
    db_object = db.query(OSMObjectModel).filter(OSMObjectModel.id == object_id).first()
    if not db_object:
        raise HTTPException(status_code=404, detail="Object not found")
    
    db.delete(db_object)
    db.commit()
    return None 

@router.get("/{object_id}/locations", response_model=List[ObjectLocation])
async def get_object_locations(
    object_id: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get location history for a specific OSM object
    """
    # First check if the object exists
    object = db.query(OSMObjectModel).filter(OSMObjectModel.id == object_id).first()
    if not object:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Query location history for this object, ordered by timestamp descending (newest first)
    locations = db.query(ObjectLocationModel)\
        .filter(ObjectLocationModel.object_id == object_id)\
        .order_by(ObjectLocationModel.timestamp.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return locations

@router.post("/{object_id}/locations", response_model=ObjectLocation, status_code=status.HTTP_201_CREATED)
async def add_object_location(
    object_id: str,
    location: ObjectLocationCreate,
    db: Session = Depends(get_db)
):
    """
    Add a new location record for an OSM object
    """
    # First check if the object exists
    object = db.query(OSMObjectModel).filter(OSMObjectModel.id == object_id).first()
    if not object:
        raise HTTPException(status_code=404, detail="Object not found")
    
    # Create a new location record
    db_location = ObjectLocationModel(
        object_id=object_id,
        latitude=location.latitude,
        longitude=location.longitude,
        timestamp=location.timestamp or datetime.utcnow()
    )
    
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location 