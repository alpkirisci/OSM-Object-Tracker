from sqlalchemy import and_
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from models.all import TrackedObject, DataSource, ObjectLocation
from datetime import datetime

class OSMService:
    """
    Service for interacting with OpenStreetMap data and objects
    """
    def __init__(self, db: Session):
        self.db = db
    
    def get_objects_by_type(self, type: str, limit: int = 100, offset: int = 0) -> List[TrackedObject]:
        """
        Get objects by type (node, way, relation)
        """
        return self.db.query(TrackedObject).filter(TrackedObject.type == type).offset(offset).limit(limit).all()
    
    def get_objects_by_tag(self, tag_key: str, tag_value: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[TrackedObject]:
        """
        Get objects by tag
        If tag_value is provided, filter by both key and value
        """
        query = self.db.query(TrackedObject).filter(TrackedObject.additional_info.has_key(tag_key))
        
        if tag_value:
            # Filter on the value of the tag
            # Note: This filtering will depend on your database's JSON capabilities
            # This example works for PostgreSQL's JSONB
            query = query.filter(TrackedObject.additional_info[tag_key].astext == tag_value)
            
        return query.offset(offset).limit(limit).all()
    
    def get_objects_by_type_and_tag(self, type: str, tag_key: str, tag_value: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[TrackedObject]:
        """
        Get objects by both type and tag
        """
        query = self.db.query(TrackedObject).filter(TrackedObject.type == type).filter(TrackedObject.additional_info.has_key(tag_key))
        
        if tag_value:
            query = query.filter(TrackedObject.additional_info[tag_key].astext == tag_value)
            
        return query.offset(offset).limit(limit).all()
    
    def get_active_data_sources(self) -> List[DataSource]:
        """
        Get all active data sources
        """
        return self.db.query(DataSource).filter(DataSource.is_active == True).all()
    
    def process_object_data(self, data: Dict[str, Any], source_id: str) -> TrackedObject:
        """
        Process received data and create or update an object
        """
        # Check if object exists
        osm_id = data.get("osm_id")
        obj_type = data.get("type")
        
        existing_object = self.db.query(TrackedObject).filter(
            TrackedObject.object_id == osm_id,
            TrackedObject.type == obj_type
        ).first()
        
        if existing_object:
            # Update existing object
            existing_object.additional_info = data.get("tags", existing_object.additional_info)
            self.db.commit()
            
            # If longitude and latitude are provided, update location
            if "longitude" in data and "latitude" in data:
                self.update_object_location(
                    existing_object.id, 
                    data.get("latitude"), 
                    data.get("longitude")
                )
                
            return existing_object
        else:
            # Create new object
            new_object = TrackedObject(
                object_id=osm_id,
                type=obj_type,
                additional_info=data.get("tags", {}),
                source_id=source_id
            )
            self.db.add(new_object)
            self.db.commit()
            self.db.refresh(new_object)
            
            # If longitude and latitude are provided, add location
            if "longitude" in data and "latitude" in data:
                self.update_object_location(
                    new_object.id, 
                    data.get("latitude"), 
                    data.get("longitude")
                )
                
            return new_object
    
    def update_object_location(self, object_id: str, latitude: float, longitude: float, timestamp: Optional[datetime] = None) -> ObjectLocation:
        """
        Add a new location record for an object
        """
        location = ObjectLocation(
            object_id=object_id,
            latitude=latitude,
            longitude=longitude,
            timestamp=timestamp or datetime.utcnow()
        )
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location 