from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from models.all import DataSource, TrackedObject
from core.websocket import websocket_manager

class DataSourceService:
    """
    Service for managing data sources and processing incoming data
    """
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_data_sources(self) -> List[DataSource]:
        """
        Get all data sources
        """
        return self.db.query(DataSource).all()
    
    def get_active_data_sources(self) -> List[DataSource]:
        """
        Get all active data sources
        """
        return self.db.query(DataSource).filter(DataSource.is_active == True).all()
    
    def get_data_source_by_id(self, source_id: str) -> Optional[DataSource]:
        """
        Get a specific data source by ID
        """
        return self.db.query(DataSource).filter(DataSource.id == source_id).first()
    
    def create_data_source(self, data: Dict[str, Any]) -> DataSource:
        """
        Create a new data source
        """
        new_source = DataSource(**data)
        self.db.add(new_source)
        self.db.commit()
        self.db.refresh(new_source)
        return new_source
    
    def update_data_source(self, source_id: str, data: Dict[str, Any]) -> Optional[DataSource]:
        """
        Update an existing data source
        """
        source = self.get_data_source_by_id(source_id)
        if not source:
            return None
        
        for key, value in data.items():
            setattr(source, key, value)
            
        self.db.commit()
        self.db.refresh(source)
        return source
    
    def delete_data_source(self, source_id: str) -> bool:
        """
        Delete a data source
        """
        source = self.get_data_source_by_id(source_id)
        if not source:
            return False
        
        self.db.delete(source)
        self.db.commit()
        return True
    
    def activate_data_source(self, source_id: str) -> Optional[DataSource]:
        """
        Activate a data source
        """
        source = self.get_data_source_by_id(source_id)
        if not source:
            return None
        
        source.is_active = True
        self.db.commit()
        self.db.refresh(source)
        return source
    
    def deactivate_data_source(self, source_id: str) -> Optional[DataSource]:
        """
        Deactivate a data source
        """
        source = self.get_data_source_by_id(source_id)
        if not source:
            return None
        
        source.is_active = False
        self.db.commit()
        self.db.refresh(source)
        return source
    
    async def process_incoming_data(self, source_id: str, data: Dict[str, Any]) -> Optional[TrackedObject]:
        """
        Process incoming data from a data source and broadcast updates
        """
        source = self.get_data_source_by_id(source_id)
        if not source or not source.is_active:
            return None
        
        # Process data into a tracked object
        # Implementation depends on the specific data format from the source
        osm_id = data.get("osm_id")
        obj_type = data.get("type")
        
        if not osm_id or not obj_type:
            return None
        
        # Check if object exists
        obj = self.db.query(TrackedObject).filter(
            TrackedObject.object_id == osm_id,
            TrackedObject.type == obj_type
        ).first()
        
        if obj:
            # Update existing object
            for key, value in data.items():
                if key not in ["id", "created_at", "updated_at"]:
                    setattr(obj, key, value)
            self.db.commit()
            self.db.refresh(obj)
        else:
            # Create new object
            obj = TrackedObject(
                object_id=osm_id,
                type=obj_type,
                additional_info=data.get("tags", {}),
                source_id=source_id
            )
            self.db.add(obj)
            self.db.commit()
            self.db.refresh(obj)
        
        # Broadcast update to connected clients
        await websocket_manager.broadcast_object_update(obj.id, {
            "id": obj.id,
            "object_id": obj.object_id,
            "type": obj.type,
            "additional_info": obj.additional_info,
            "source_id": obj.source_id
        })
        
        return obj 