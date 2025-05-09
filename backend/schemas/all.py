from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime
from enum import Enum

# Enum for object types matching the model
class ObjectType(str, Enum):
    SHIP = "ship"
    CAR = "car"
    AIRPLANE = "airplane"
    DRONE = "drone"
    OTHER = "other"

# Custom Object Type schemas
class CustomObjectTypeBase(BaseModel):
    name: str  # Now uses string directly instead of ObjectType enum
    display_name: str
    description: Optional[str] = None
    icon: str = "tag" 
    color: str = "#1890ff"
    is_active: bool = True

class CustomObjectTypeCreate(CustomObjectTypeBase):
    pass

class CustomObjectTypeUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None

class CustomObjectType(CustomObjectTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Sensor schemas
class SensorBase(BaseModel):
    sensor_id: str
    name: str
    description: Optional[str] = None
    type: str
    is_active: bool = True

class SensorCreate(SensorBase):
    pass

class SensorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None

class Sensor(SensorBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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

# Tracked Object schemas
class TrackedObjectBase(BaseModel):
    object_id: str
    name: Optional[str] = None
    type: str  # Changed from ObjectType to string
    additional_info: Optional[Dict[str, Any]] = None
    source_id: str

class TrackedObjectCreate(TrackedObjectBase):
    pass

class TrackedObjectUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    additional_info: Optional[Dict[str, Any]] = None
    source_id: Optional[str] = None

class TrackedObject(TrackedObjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended Tracked Object with custom type info
class TrackedObjectWithTypeInfo(TrackedObject):
    custom_type: Optional[CustomObjectType] = None

# Sensor Data schemas
class SensorDataBase(BaseModel):
    tracked_object_id: str
    raw_sensor_id: str
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

class SensorDataCreate(SensorDataBase):
    pass

class SensorData(SensorDataBase):
    id: str
    sensor_id: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Incoming sensor data payload (from external sources)
class IncomingSensorData(BaseModel):
    object_id: str
    object_name: Optional[str] = None
    object_type: str  # Now accepts any string value
    sensor_id: str
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None

# Data Validation Log schemas
class DataValidationLogBase(BaseModel):
    log_type: Literal["error", "warning", "info"]
    message: str
    raw_data: Optional[Dict[str, Any]] = None
    object_id: Optional[str] = None
    sensor_id: Optional[str] = None
    resolved: bool = False

class DataValidationLogCreate(DataValidationLogBase):
    pass

class DataValidationLogUpdate(BaseModel):
    resolved: Optional[bool] = None

class DataValidationLog(DataValidationLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Available icon options
class IconOption(BaseModel):
    name: str
    displayName: str
    value: str

# Available color options
class ColorOption(BaseModel):
    name: str
    displayName: str
    value: str