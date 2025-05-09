# Test Data Source

This is a simulated data source for testing the OSM Object Tracker application. It generates synthetic sensor data for various objects and sends it to the backend API.

## Features

- Automatically creates simulated objects of different types (ships, cars, airplanes, drones)
- Registers itself as a data source with the backend
- Registers simulated sensors with the backend
- Periodically sends updated position data to the backend
- Provides API endpoints to view current simulation state

## Configuration

The following environment variables can be used to configure the service:

- `BACKEND_URL` - URL of the backend API (default: `http://backend:8000`)
- `UPDATE_INTERVAL` - Interval in seconds between data updates (default: `2`)
- `NUM_OBJECTS` - Number of objects to simulate (default: `5`)

## API Endpoints

- `GET /` - Service health check
- `GET /status` - Shows current simulation status
- `GET /objects` - Lists all simulated objects
- `GET /sensors` - Lists all simulated sensors

## Running

This service is designed to be run as part of the docker-compose setup. It will automatically connect to the backend and start sending data once both services are operational. 