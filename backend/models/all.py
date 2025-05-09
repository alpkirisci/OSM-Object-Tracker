from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Integer, Float, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base
from uuid import uuid4
from datetime import datetime
import enum

class ObjectType(str, enum.Enum):
    SHIP = "ship"
    CAR = "car"
    AIRPLANE = "airplane"
    DRONE = "drone"
    OTHER = "other"

class CustomObjectType(Base):
    __tablename__ = "custom_object_types"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    name = Column(String, index=True, unique=True)  # The type string identifier (e.g., "ship", "car")
    display_name = Column(String)  # User-friendly name (e.g., "Ship", "Car")
    description = Column(Text, nullable=True)
    icon = Column(String, default="tag")  # Icon identifier
    color = Column(String, default="#1890ff")  # Color in hex format
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    sensor_id = Column(String, index=True, unique=True)  # External sensor ID
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    type = Column(String)  # Sensor type
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sensor_data = relationship("SensorData", back_populates="sensor")

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    type = Column(String)  # "websocket", "rest", etc.
    connection_info = Column(JSONB)  # Store connection details as JSON
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tracked_objects = relationship("TrackedObject", back_populates="source")

class TrackedObject(Base):
    __tablename__ = "tracked_objects"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    object_id = Column(String, index=True)  # External object ID
    name = Column(String, index=True, nullable=True)
    type = Column(String, index=True)  # Type string (e.g., "ship", "car")
    additional_info = Column(JSONB, nullable=True)  # Additional information
    source_id = Column(String, ForeignKey("data_sources.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = relationship("DataSource", back_populates="tracked_objects")
    sensor_data = relationship("SensorData", back_populates="tracked_object")

class SensorData(Base):
    __tablename__ = "sensor_data"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    tracked_object_id = Column(String, ForeignKey("tracked_objects.id"))
    sensor_id = Column(String, ForeignKey("sensors.id"), nullable=True)
    raw_sensor_id = Column(String, index=True)  # Original sensor ID from the data
    latitude = Column(Float)
    longitude = Column(Float)
    altitude = Column(Float, nullable=True)
    additional_data = Column(JSONB, nullable=True)  # Additional sensor data
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tracked_object = relationship("TrackedObject", back_populates="sensor_data")
    sensor = relationship("Sensor", back_populates="sensor_data")

class DataValidationLog(Base):
    __tablename__ = "data_validation_logs"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    log_type = Column(String, index=True)  # error, warning, info
    message = Column(Text)
    raw_data = Column(JSONB, nullable=True)  # The raw data that caused the issue
    object_id = Column(String, nullable=True, index=True)
    sensor_id = Column(String, nullable=True, index=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ObjectLocation(Base):
    __tablename__ = "object_locations"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    object_id = Column(String, ForeignKey("tracked_objects.id"), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    altitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationship
    object = relationship("TrackedObject", backref="locations")
