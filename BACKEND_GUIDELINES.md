# Backend Development Guidelines

This document outlines the architectural patterns, conventions, and best practices for developing the backend of our OpenStreetMap Object Tracking application.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Dependency Management](#dependency-management)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Error Handling](#error-handling)
7. [Logging](#logging)
8. [WebSocket Implementation](#websocket-implementation)
9. [Services](#services)
10. [Configuration Management](#configuration-management)
11. [Testing](#testing)

## Architecture Overview

The backend is built using FastAPI, a modern, high-performance web framework for building APIs with Python. The application follows a clean architecture pattern with the following components:

- **Routers**: Handle HTTP requests and responses
- **Models**: Define database models using SQLAlchemy ORM
- **Schemas**: Define Pydantic models for request/response validation
- **Services**: Contain business logic and external service integrations
- **Dependencies**: Provide reusable components and dependency injection
- **Database**: PostgreSQL database with SQLAlchemy as the ORM

## Project Structure

```
backend/
├── main.py                # Application entry point
├── database.py            # Database connection and session management
├── config.py              # Application configuration
├── dependencies.py        # Dependency injection
├── routers/               # API route handlers
│   ├── __init__.py
│   ├── objects.py         # OSM object endpoints
│   ├── data_sources.py    # Data source management endpoints
│   ├── admin.py           # Admin-specific endpoints
│   └── websockets.py      # WebSocket connection handlers
├── models/                # SQLAlchemy ORM models
│   ├── __init__.py
│   └── all.py             # All database models
├── schemas/               # Pydantic data models
│   ├── __init__.py
│   └── all.py             # All Pydantic schemas
├── services/              # Business logic and external services
│   ├── __init__.py
│   ├── osm_service.py     # OpenStreetMap integration
│   └── data_ingestion.py  # Data ingestion service
├── core/                  # Core functionality
│   ├── __init__.py
│   └── websocket.py       # WebSocket connection management
└── migrations/            # Alembic database migrations
```

## Dependency Management

Dependencies are managed through `requirements.txt`. Key dependencies include:

- fastapi
- uvicorn
- sqlalchemy
- psycopg2-binary
- pydantic
- websockets
- alembic (for migrations)
- pytest (for testing)

## Database Design

### Models

Database models are defined using SQLAlchemy ORM in `models/all.py`. Follow these conventions:

1. Use `String` as primary key type with UUID4 generation:
   ```python
   id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))
   ```

2. Include audit fields on all tables:
   ```python
   created_at = Column(DateTime, default=datetime.utcnow)
   updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   ```

3. Define relationships using SQLAlchemy's relationship attribute:
   ```python
   # Example from one side
   source = relationship("DataSource", back_populates="objects")
   # Example from many side
   objects = relationship("Object", back_populates="source")
   ```

### Example Model Structure

```python
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
```

## API Design

### Routers

Organize endpoints into logical groupings in separate router files. Each router should:

1. Use APIRouter with prefix, tags and dependencies:
   ```python
   router = APIRouter(
       prefix="/objects",
       tags=["objects"]
   )
   ```

2. Use descriptive function names that indicate HTTP method and resource:
   ```python
   @router.get("", response_model=List[schemas.OSMObject])
   async def get_objects(db: Session = Depends(get_db)):
       ...
   ```

3. Use appropriate HTTP methods:
   - GET: For retrieving resources
   - POST: For creating resources
   - PUT/PATCH: For updating resources
   - DELETE: For removing resources

4. Define clear response models:
   ```python
   @router.get("/{object_id}", response_model=schemas.OSMObject)
   async def get_object(object_id: str, db: Session = Depends(get_db)):
       ...
   ```

5. Use query parameters for filtering, sorting, and pagination:
   ```python
   @router.get("", response_model=List[schemas.OSMObject])
   async def get_objects(
       type: Optional[str] = None,
       tag: Optional[str] = None,
       limit: int = 100,
       offset: int = 0,
       db: Session = Depends(get_db)
   ):
       ...
   ```

### Schemas

Define Pydantic models in `schemas/all.py` with:

1. Base models for common fields:
   ```python
   class OSMObjectBase(BaseModel):
       osm_id: str
       type: str
       tags: Dict[str, Any]
       geom: str
   ```

2. Create models for input validation:
   ```python
   class OSMObjectCreate(OSMObjectBase):
       source_id: str
   ```

3. Update models with optional fields:
   ```python
   class OSMObjectUpdate(BaseModel):
       tags: Optional[Dict[str, Any]] = None
       geom: Optional[str] = None
   ```

4. Response models with all fields:
   ```python
   class OSMObject(OSMObjectBase):
       id: str
       source_id: str
       created_at: datetime
       updated_at: datetime

       class Config:
           from_attributes = True
   ```

## Error Handling

Use FastAPI's HTTPException for consistent error responses:

```python
if not object:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Object not found"
    )
```

Create meaningful error messages that help clients understand what went wrong and how to fix it.

## Logging

Configure logging in `main.py` for consistent log formatting:

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="backend.log"
)
logger = logging.getLogger(__name__)
```

Use logging liberally throughout the application to track important events:

```python
logger.info(f"Processing object {object_id}")
logger.error(f"Failed to connect to data source: {str(e)}")
```

## WebSocket Implementation

Implement WebSocket connections in `routers/websockets.py`:

```python
@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Process incoming message
            await websocket_manager.send_personal_message(
                {"type": "response", "content": "Message received"}, 
                client_id
            )
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
```

Create a WebSocket manager in `core/websocket.py` to handle connections:

```python
class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

    async def broadcast(self, message):
        for connection in self.active_connections.values():
            await connection.send_json(message)
```

## Services

Implement business logic in separate service classes:

```python
class OSMService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_objects_by_type(self, type: str, limit: int = 100, offset: int = 0):
        return self.db.query(OSMObjectModel).filter(OSMObjectModel.type == type).offset(offset).limit(limit).all()
    
    # More methods for business logic
```

Use dependency injection to provide services to routes:

```python
def get_osm_service(db: Session = Depends(get_db)):
    return OSMService(db)

@router.get("/objects/{type}")
def get_objects_by_type(
    type: str, 
    limit: int = 100, 
    offset: int = 0,
    service: OSMService = Depends(get_osm_service)
):
    return service.get_objects_by_type(type, limit, offset)
```

## Configuration Management

Use environment variables with fallbacks in `config.py`:

```python
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/osm_tracking_db")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    ALLOWED_HOSTS: list = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    
    # Additional configuration settings
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Data Source Management

For handling different data sources (entry points):

```python
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
```

## Testing

Use pytest for testing:

```python
def test_get_objects(test_client, test_db):
    # Create test objects
    test_object = OSMObjectModel(
        osm_id="123456",
        type="node",
        tags={"highway": "traffic_signals"},
        geom="POINT(0 0)",
        source_id="test-source-id"
    )
    test_db.add(test_object)
    test_db.commit()
    
    # Test the endpoint
    response = test_client.get("/objects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["osm_id"] == "123456"
```

## Database Migrations

Use Alembic for database migrations:

```
alembic init migrations
```

Update `alembic.ini` with your database connection string and configure `env.py` to use your SQLAlchemy models.

Generate migrations:

```
alembic revision --autogenerate -m "Create initial tables"
```

Apply migrations:

```
alembic upgrade head
```

## Code Formatting and Linting

Use black for code formatting and flake8 for linting. Add configuration files to the project root:

- `.flake8` configuration
- `pyproject.toml` for black configuration

## Conclusion

These guidelines provide a foundation for developing a maintainable, scalable backend for the OpenStreetMap Object Tracking application. By following these patterns and practices, we can ensure consistency and quality across the codebase. 