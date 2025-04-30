# Project Deployment Guide

## Prerequisites

### Supported Operating Systems
- Ubuntu 22.04 LTS or later
- Debian 11 or later

### Required Dependencies
- Python 3.10+
- Node.js 22+
- PostgreSQL 12+

## Dependency Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3 nodejs postgresql
sudo systemctl start postgresql
```

### Dependency Verification
The script will automatically check for:
- Python installation
- Node.js installation 
- PostgreSQL installation
- PostgreSQL service status

## Script Usage

### Setup Commands
```bash
# Make the script executable
sudo chmod +x dockerless_setup.sh

# Setup the entire project (first-time setup)
sudo ./dockerless_setup.sh setup

# Start all services
sudo ./dockerless_setup.sh start

# Stop all services
sudo ./dockerless_setup.sh stop

# Restart services
sudo ./dockerless_setup.sh restart
```

## What Each Command Does

### `setup`
- Checks sudo access
- Verifies system dependencies
- Sets up comprehensive file permissions
- Initializes database
- Prepares backend and frontend environments

### `start`
- Launches database service
- Starts backend server (http://localhost:8000)
- Starts frontend application (http://localhost:3000)

### `stop`
- Gracefully terminates all running services
- Kills any lingering processes if necessary

### `restart`
- Stops all current services
- Restarts all services

## Troubleshooting

### Common Issues
- Ensure you have sudo access
- Verify all dependencies are installed
- Check that PostgreSQL service is running
- Confirm no port conflicts (8000 and 3000)

### Permissions
The script automatically handles:
- Setting correct user ownership
- Making scripts executable
- Creating necessary directories
- Setting appropriate directory permissions

## Security Notes
- The script requires sudo access
- Only run scripts from trusted sources
- Review the script contents before execution

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: localhost:5432 (user: user, password: password, db: osm_tracker_db)