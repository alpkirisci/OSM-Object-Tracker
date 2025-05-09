from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from dependencies import get_db
from schemas.all import DataSource, DataSourceCreate, DataSourceUpdate, TrackedObject
from models.all import DataSource as DataSourceModel
from models.all import TrackedObject as TrackedObjectModel
from services.data_source_service import DataSourceService

router = APIRouter(
    prefix="/api/data-sources",
    tags=["data_sources"]
)

@router.get("", response_model=List[DataSource])
async def get_data_sources(
    db: Session = Depends(get_db)
):
    """
    Get all data sources
    """
    data_source_service = DataSourceService(db)
    return data_source_service.get_all_data_sources()

@router.get("/{source_id}", response_model=DataSource)
async def get_data_source(
    source_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific data source by ID
    """
    data_source_service = DataSourceService(db)
    source = data_source_service.get_data_source_by_id(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return source

@router.post("", response_model=DataSource, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    source: DataSourceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new data source
    """
    data_source_service = DataSourceService(db)
    return data_source_service.create_data_source(source.dict())

@router.put("/{source_id}", response_model=DataSource)
async def update_data_source(
    source_id: str,
    source_update: DataSourceUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing data source
    """
    data_source_service = DataSourceService(db)
    db_source = data_source_service.update_data_source(source_id, source_update.dict(exclude_unset=True))
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return db_source

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    source_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a data source
    """
    data_source_service = DataSourceService(db)
    success = data_source_service.delete_data_source(source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Data source not found")
    return None

@router.post("/{source_id}/activate", response_model=DataSource)
async def activate_data_source(
    source_id: str,
    db: Session = Depends(get_db)
):
    """
    Activate a data source
    """
    data_source_service = DataSourceService(db)
    db_source = data_source_service.activate_data_source(source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return db_source

@router.post("/{source_id}/deactivate", response_model=DataSource)
async def deactivate_data_source(
    source_id: str,
    db: Session = Depends(get_db)
):
    """
    Deactivate a data source
    """
    data_source_service = DataSourceService(db)
    db_source = data_source_service.deactivate_data_source(source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Data source not found")
    return db_source

@router.get("/{source_id}/objects", response_model=List[TrackedObject])
async def get_source_objects(
    source_id: str,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get all objects from a specific data source
    """
    # First check if the data source exists
    data_source_service = DataSourceService(db)
    source = data_source_service.get_data_source_by_id(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")
    
    # Get objects from this source
    objects = db.query(TrackedObjectModel)\
        .filter(TrackedObjectModel.source_id == source_id)\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return objects 