from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from dependencies import get_db
from models.all import CustomObjectType as CustomObjectTypeModel, ObjectType
from schemas.all import CustomObjectType, CustomObjectTypeCreate, CustomObjectTypeUpdate, IconOption, ColorOption
from uuid import uuid4
import logging

router = APIRouter(
    prefix="/object-types",
    tags=["object types"],
    responses={404: {"description": "Not found"}},
)

# Define available icons and colors
AVAILABLE_ICONS = [
    {"name": "tag", "displayName": "Tag", "value": "FiTag"},
    {"name": "map", "displayName": "Map", "value": "FiMap"},
    {"name": "user", "displayName": "User", "value": "FiUser"},
    {"name": "ship", "displayName": "Ship", "value": "FiAnchor"},
    {"name": "car", "displayName": "Car", "value": "FiTruck"},
    {"name": "plane", "displayName": "Airplane", "value": "FiSend"},
    {"name": "drone", "displayName": "Drone", "value": "FiRadio"},
    {"name": "truck", "displayName": "Truck", "value": "FiPackage"},
    {"name": "helicopter", "displayName": "Helicopter", "value": "FiWind"},
    {"name": "submarine", "displayName": "Submarine", "value": "FiActivity"},
    {"name": "tank", "displayName": "Tank", "value": "FiShield"},
    {"name": "navigation", "displayName": "Navigation", "value": "FiNavigation"},
    {"name": "crosshair", "displayName": "Crosshair", "value": "FiCrosshair"},
    {"name": "target", "displayName": "Target", "value": "FiTarget"},
    {"name": "compass", "displayName": "Compass", "value": "FiCompass"},
    {"name": "flag", "displayName": "Flag", "value": "FiFlag"},
    {"name": "info", "displayName": "Info", "value": "FiInfo"},
    {"name": "alert", "displayName": "Alert", "value": "FiAlertTriangle"},
]

AVAILABLE_COLORS = [
    {"name": "blue", "displayName": "Blue", "value": "#1890ff"},
    {"name": "green", "displayName": "Green", "value": "#52c41a"},
    {"name": "red", "displayName": "Red", "value": "#f5222d"},
    {"name": "orange", "displayName": "Orange", "value": "#fa8c16"},
    {"name": "yellow", "displayName": "Yellow", "value": "#fadb14"},
    {"name": "purple", "displayName": "Purple", "value": "#722ed1"},
    {"name": "magenta", "displayName": "Magenta", "value": "#eb2f96"},
    {"name": "cyan", "displayName": "Cyan", "value": "#13c2c2"},
    {"name": "gray", "displayName": "Gray", "value": "#8c8c8c"},
    {"name": "black", "displayName": "Black", "value": "#000000"},
]

@router.get("/", response_model=List[CustomObjectType])
def get_object_types(
    skip: int = 0, 
    limit: int = 100,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(CustomObjectTypeModel)
    
    if not include_inactive:
        query = query.filter(CustomObjectTypeModel.is_active == True)
    
    return query.offset(skip).limit(limit).all()

@router.get("/icons", response_model=List[IconOption])
def get_available_icons():
    return AVAILABLE_ICONS

@router.get("/colors", response_model=List[ColorOption])
def get_available_colors():
    return AVAILABLE_COLORS

@router.get("/{type_id}", response_model=CustomObjectType)
def get_object_type(type_id: str, db: Session = Depends(get_db)):
    db_type = db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.id == type_id).first()
    if db_type is None:
        raise HTTPException(status_code=404, detail="Object type not found")
    return db_type

@router.post("/", response_model=CustomObjectType)
def create_object_type(obj_type: CustomObjectTypeCreate, db: Session = Depends(get_db)):
    # Check if type with this name already exists
    existing = db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.name == obj_type.name).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail=f"An object type with name '{obj_type.name}' already exists")
        else:
            # Reactivate and update the existing type
            for key, value in obj_type.dict().items():
                setattr(existing, key, value)
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return existing
    
    # Create new type
    try:
        db_type = CustomObjectTypeModel(
            id=str(uuid4()),
            name=obj_type.name.lower(),  # Ensure lowercase for consistency
            display_name=obj_type.display_name,
            description=obj_type.description,
            icon=obj_type.icon,
            color=obj_type.color,
            is_active=obj_type.is_active
        )
        db.add(db_type)
        db.commit()
        db.refresh(db_type)
        return db_type
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create object type: {str(e)}")

@router.put("/{type_id}", response_model=CustomObjectType)
def update_object_type(type_id: str, obj_type: CustomObjectTypeUpdate, db: Session = Depends(get_db)):
    db_type = db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.id == type_id).first()
    if db_type is None:
        raise HTTPException(status_code=404, detail="Object type not found")
    
    try:
        # Update object type fields if provided
        update_data = obj_type.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_type, key, value)
        
        db.commit()
        db.refresh(db_type)
        return db_type
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update object type: {str(e)}")

@router.delete("/{type_id}")
def delete_object_type(type_id: str, db: Session = Depends(get_db)):
    db_type = db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.id == type_id).first()
    if db_type is None:
        raise HTTPException(status_code=404, detail="Object type not found")
    
    try:
        # Soft delete by setting is_active to False
        db_type.is_active = False
        db.commit()
        return {"detail": "Object type deactivated"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete object type: {str(e)}")

@router.post("/initialize", response_model=List[CustomObjectType])
def initialize_default_types(db: Session = Depends(get_db)):
    """Initialize default object types based on common types"""
    default_types = [
        {"name": "ship", "display_name": "Ship", "icon": "FiAnchor", "color": "#1890ff", "description": "Maritime vessels including boats and ships"},
        {"name": "car", "display_name": "Car", "icon": "FiTruck", "color": "#52c41a", "description": "Automobiles and passenger vehicles"},
        {"name": "airplane", "display_name": "Airplane", "icon": "FiSend", "color": "#722ed1", "description": "Fixed-wing aircraft"},
        {"name": "drone", "display_name": "Drone", "icon": "FiRadio", "color": "#fa8c16", "description": "Unmanned aerial vehicles"},
        {"name": "truck", "display_name": "Truck", "icon": "FiPackage", "color": "#eb2f96", "description": "Heavy-duty vehicles for transport"},
        {"name": "helicopter", "display_name": "Helicopter", "icon": "FiWind", "color": "#13c2c2", "description": "Rotary-wing aircraft"},
        {"name": "submarine", "display_name": "Submarine", "icon": "FiActivity", "color": "#1890ff", "description": "Underwater vessels"},
        {"name": "other", "display_name": "Other", "icon": "FiInfo", "color": "#8c8c8c", "description": "Miscellaneous objects not in other categories"}
    ]
    
    created_types = []
    
    for type_info in default_types:
        existing = db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.name == type_info["name"]).first()
        if not existing:
            db_type = CustomObjectTypeModel(
                id=str(uuid4()),
                name=type_info["name"],
                display_name=type_info["display_name"],
                description=type_info["description"],
                icon=type_info["icon"],
                color=type_info["color"],
                is_active=True
            )
            db.add(db_type)
            created_types.append(db_type)
    
    if created_types:
        db.commit()
        for t in created_types:
            db.refresh(t)
    
    # Return all active types
    return db.query(CustomObjectTypeModel).filter(CustomObjectTypeModel.is_active == True).all() 