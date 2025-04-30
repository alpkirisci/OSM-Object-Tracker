from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

# Data Source schemas
class DataSourceBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # "websocket", "rest", etc.
    connection_info: Dict[str, Any]
    is_active: bool = True


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    connection_info: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class DataSource(DataSourceBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# OSM Object schemas
class OSMObjectBase(BaseModel):
    osm_id: str
    type: str  # node, way, relation
    tags: Dict[str, Any]
    geom: str  # GeoJSON representation
    source_id: str


class OSMObjectCreate(OSMObjectBase):
    pass


class OSMObjectUpdate(BaseModel):
    osm_id: Optional[str] = None
    type: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None
    geom: Optional[str] = None
    source_id: Optional[str] = None


class OSMObject(OSMObjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Object Location schemas
class ObjectLocationBase(BaseModel):
    object_id: str
    latitude: float
    longitude: float
    timestamp: Optional[datetime] = None


class ObjectLocationCreate(ObjectLocationBase):
    pass


class ObjectLocation(ObjectLocationBase):
    id: str
    timestamp: datetime

    class Config:
        from_attributes = True