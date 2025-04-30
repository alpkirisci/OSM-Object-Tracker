from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Boolean, Integer, JSONB, Float
from sqlalchemy.orm import relationship
from database import Base
from uuid import uuid4
from datetime import datetime

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
    objects = relationship("OSMObject", back_populates="source")

class OSMObject(Base):
    __tablename__ = "osm_objects"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    osm_id = Column(String, index=True)
    type = Column(String, index=True)  # node, way, relation
    tags = Column(JSONB)  # Store OSM tags as JSON
    geom = Column(String)  # GeoJSON representation
    source_id = Column(String, ForeignKey("data_sources.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = relationship("DataSource", back_populates="objects")
    locations = relationship("ObjectLocation", back_populates="object")

class ObjectLocation(Base):
    __tablename__ = "object_locations"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
    object_id = Column(String, ForeignKey("osm_objects.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    object = relationship("OSMObject", back_populates="locations")
