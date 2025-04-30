# OpenStreetMap Object Tracking Backend

Backend for tracking objects from OpenStreetMap in real-time.

## Features

- Track OSM objects (nodes, ways, relations)
- Filter objects by type, tags, and other properties
- Real-time updates via WebSockets
- Multiple data source integration
- REST API for object management
- Simple admin interface for data source configuration

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-time**: WebSockets
- **Documentation**: Swagger/OpenAPI

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL
- Virtual environment (recommended)

### Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/osm_tracking_db
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

4. Initialize the database:
   ```bash
   python init_db.py
   ```

### Running the Application

For development:
```bash
uvicorn main:app --reload
```

For production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Documentation

When running in development mode (`DEBUG=True`), API documentation is available at:

- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`

## Project Structure

- `main.py`: Application entry point
- `config.py`: Configuration settings
- `database.py`: Database connection
- `models/`: SQLAlchemy database models
- `schemas/`: Pydantic models for API
- `routers/`: API endpoints
- `services/`: Business logic
- `core/`: Core functionality
- `migrations/`: Alembic database migrations

## Data Sources

A data source represents an external system that sends data to our application. Sources can be added and configured via the admin interface. Each source has:

- Name
- Description
- Type (websocket, rest, etc.)
- Connection information (stored as JSON)
- Active status

## WebSocket Communication

The application supports real-time communication through WebSockets. Clients can:

1. Connect to receive real-time updates: `/api/ws/objects/{client_id}`
2. Subscribe to specific object types
3. Request initial data

External systems can push data through: `/api/ws/data-source/{source_id}/{client_id}` 