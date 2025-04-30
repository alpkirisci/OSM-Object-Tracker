#!/bin/bash
set -e

echo "Starting project setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose (supporting both V1 and V2 syntaxes)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file and create if missing
if [ ! -f ".env" ]; then
    echo "Creating default .env file for production..."
    echo "WARNING: Please update these values for production use!"
    cat > .env << 'EOF'
# Production environment variables - PLEASE CHANGE THESE VALUES!
DB_PASSWORD=change_this_password_in_production
SECRET_KEY=change_this_secret_key_in_production
DEBUG=False
ALLOWED_HOSTS=*
EOF
fi

# Make sure entrypoint scripts are executable
echo "Making entrypoint scripts executable..."
chmod +x ./frontend/entrypoint.sh 2>/dev/null || echo "Warning: entrypoint.sh not found in frontend directory"
chmod +x ./backend/entrypoint.sh 2>/dev/null || echo "Warning: entrypoint.sh not found in backend directory"

# Create necessary directories if they don't exist
echo "Creating nginx directories if needed..."
mkdir -p ./nginx/conf.d
mkdir -p ./nginx/logs
# Note: We don't create static and db directories in the root - Docker will handle them

# Check if nginx configuration exists, if not create a default config
if [ ! -f "./nginx/conf.d/default.conf" ]; then
    echo "Creating default nginx configuration..."
    cat > ./nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# Check if prebuilt images exist
if [ -d "./docker-images" ] && [ -f "./docker-images/load-images.sh" ]; then
    echo "Found prebuilt Docker images. Loading..."
    (cd docker-images && ./load-images.sh)
    
    echo "Starting containers with prebuilt images..."
    # Use docker compose or docker-compose depending on availability
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prebuilt.yml up -d
    else
        docker compose -f docker-compose.prebuilt.yml up -d
    fi
else
    echo "No prebuilt images found."
    echo "Building and starting Docker containers from source..."
    # Use docker compose or docker-compose depending on availability
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prod.yml up --build -d
    else
        docker compose -f docker-compose.prod.yml up --build -d
    fi
fi

# Wait for services to be ready
echo "Waiting for services to be ready..."
echo "This may take a minute or two..."
sleep 20

# Check if services are running
echo "Checking if services are running..."
if [ -d "./docker-images" ] && [ -f "./docker-images/load-images.sh" ]; then
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prebuilt.yml ps
    else
        docker compose -f docker-compose.prebuilt.yml ps
    fi
else
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker compose -f docker-compose.prod.yml ps
    fi
fi

# Display access information
echo ""
echo "Setup completed!"
echo "================================"
echo "Your application is running at:"
echo "Frontend: http://localhost"
echo "API: http://localhost/api"
echo "Database: localhost:5432 (only accessible within Docker network)"
echo "================================"

# Determine which compose file to use in commands
if [ -d "./docker-images" ] && [ -f "./docker-images/load-images.sh" ]; then
    COMPOSE_FILE="docker-compose.prebuilt.yml"
else
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Support both docker-compose and docker compose commands
if command -v docker-compose &> /dev/null; then
    COMPOSE_COMMAND="docker-compose"
else
    COMPOSE_COMMAND="docker compose"
fi

echo "To stop the application, run: $COMPOSE_COMMAND -f $COMPOSE_FILE down"
echo "To start the application, run: $COMPOSE_COMMAND -f $COMPOSE_FILE up -d"
echo "To view logs, run: $COMPOSE_COMMAND -f $COMPOSE_FILE logs -f"
echo "================================"

exit 0 