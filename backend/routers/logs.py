from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies import get_db
from schemas.all import DataValidationLog, DataValidationLogCreate, DataValidationLogUpdate
from models.all import DataValidationLog as DataValidationLogModel
from uuid import uuid4

router = APIRouter(
    prefix="/logs",
    tags=["logs"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=DataValidationLog)
def create_log(log: DataValidationLogCreate, db: Session = Depends(get_db)):
    db_log = DataValidationLogModel(
        id=str(uuid4()),
        log_type=log.log_type,
        message=log.message,
        raw_data=log.raw_data,
        object_id=log.object_id,
        sensor_id=log.sensor_id,
        resolved=log.resolved
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/", response_model=List[DataValidationLog])
def get_logs(
    skip: int = 0, 
    limit: int = 100, 
    log_type: Optional[str] = None,
    object_id: Optional[str] = None,
    sensor_id: Optional[str] = None,
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DataValidationLogModel)
    
    # Apply filters if provided
    if log_type:
        query = query.filter(DataValidationLogModel.log_type == log_type)
    
    if object_id:
        query = query.filter(DataValidationLogModel.object_id == object_id)
    
    if sensor_id:
        query = query.filter(DataValidationLogModel.sensor_id == sensor_id)
        
    if resolved is not None:
        query = query.filter(DataValidationLogModel.resolved == resolved)
    
    # Order by created_at (newest first)
    query = query.order_by(DataValidationLogModel.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{log_id}", response_model=DataValidationLog)
def get_log(log_id: str, db: Session = Depends(get_db)):
    db_log = db.query(DataValidationLogModel).filter(DataValidationLogModel.id == log_id).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    return db_log

@router.put("/{log_id}", response_model=DataValidationLog)
def update_log(log_id: str, log: DataValidationLogUpdate, db: Session = Depends(get_db)):
    db_log = db.query(DataValidationLogModel).filter(DataValidationLogModel.id == log_id).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Update log fields if provided
    update_data = log.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_log, key, value)
    
    db.commit()
    db.refresh(db_log)
    return db_log

@router.delete("/{log_id}")
def delete_log(log_id: str, db: Session = Depends(get_db)):
    db_log = db.query(DataValidationLogModel).filter(DataValidationLogModel.id == log_id).first()
    if db_log is None:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(db_log)
    db.commit()
    return {"detail": "Log deleted"} 