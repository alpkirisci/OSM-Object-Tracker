# Production Project Setup Package

This package contains everything needed to set up the project on a production server.

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
docker-compose -f docker-compose.prod.yml up --build -d
```

If you want to use prebuilt images (if available):
```
cd docker-images
./load-images.sh
cd ..
docker-compose -f docker-compose.prebuilt.yml up -d
```

## Accessing the Application

- Frontend: http://localhost
- API: http://localhost/api
- Database: localhost:5432 (only accessible within Docker network)

## Production Notes

- All application services run in production mode with optimized settings
- Frontend and Backend are accessible through Nginx reverse proxy
- Database data is persisted in a volume
- Environment variables are configured for production use
- SSL/TLS is not enabled by default, consider configuring Nginx with your own SSL certificates
- To customize the Nginx configuration, edit files in the nginx/conf.d directory 