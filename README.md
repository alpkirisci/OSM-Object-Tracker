# OpenStreetMap Object Tracker

This web app tracks objects on OpenStreetMap and provides a user-friendly interface to filter and display them. It includes an admin dashboard for managing data entry points.

## Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: FastAPI, PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Setup Guide

Choose the appropriate setup method based on your needs:

### Production Setup

#### Option 1: Production with Docker (Recommended)
If you want to deploy on a Digital Ocean droplet or similar cloud provider:
- Follow the instructions in [droplet_README.md](droplet_README.md)

#### Option 2: Pre-packaged Production Deployment
For a ready-to-deploy production package with prebuilt Docker images:
```bash
# Generate a production package
./package_project_prod.sh
```
The script creates a package with all necessary files and prebuilt Docker images.

### Development Setup

#### Option 1: Development with Docker (Recommended)
Use Docker for a consistent development environment:
```bash
# Start the development environment
docker-compose -f docker-compose.dev.yml up
```

#### Option 2: Dockerless Development
If you prefer to run without Docker:
- Follow the instructions in [dockerless_dev_README.md](dockerless_dev_README.md)

#### Option 3: Pre-packaged Development Environment
For a portable development setup with prebuilt Docker images:
```bash
# Generate a development package
./package_project_dev.sh
```

## Key Features
- Track and display objects from OpenStreetMap
- Filter objects by various criteria
- Admin dashboard for managing data entry points
- Support for receiving data via various protocols (WebSocket, REST, etc.)

## Development

To run the application in development mode:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will start the following services:
- Frontend (Next.js) on http://localhost:3000
- Backend (FastAPI) on http://localhost:8000
- Test Data Source on http://localhost:8001 (generates simulated sensor data)
- PostgreSQL database

## Testing

The application includes a test data source container that automatically:
- Generates simulated objects of different types (ships, cars, airplanes, drones)
- Registers itself as a data source with the backend
- Creates simulated sensors
- Continuously sends position updates to the backend

This allows for easy testing of the application without manually adding data. The test data source is included in both development and production environments.

To view the simulated data, visit:
- http://localhost:8001/status - For simulation status
- http://localhost:8001/objects - To view all simulated objects
- http://localhost:8001/sensors - To view all simulated sensors 