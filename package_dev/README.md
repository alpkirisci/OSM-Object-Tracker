# Development Project Setup Package

This package contains everything needed to set up the project for development on a new machine.

## Prerequisites

- Docker
- Docker Compose

## Setup Options

### Option 1: Quick Setup (Recommended)

Run the setup script:
```
chmod +x setup.sh
./setup.sh
```

This will automatically detect if prebuilt images are available and use them,
or build from source if needed.

### Option 2: Manual Setup

If you want to build from source:
```
docker-compose -f docker-compose.dev.yml up --build -d
```

If you want to use prebuilt images (if available):
```
cd docker-images
./load-images.sh
cd ..
docker-compose -f docker-compose.prebuilt.yml up -d
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432 (user: user, password: password, db: osm_tracker_db)

## Development Notes

- All services have hot-reloading enabled for faster development
- Source code is mounted as volumes, so changes are reflected immediately
- Database data is persisted in a volume between restarts
- Environment variables are configured for development use
- All services are configured with restart: unless-stopped for better stability
- The database has a health check to ensure it's fully running before backend connects