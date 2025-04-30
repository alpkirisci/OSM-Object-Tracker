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
    echo "Creating default .env file..."
    cat > .env << 'EOF'
# Default development environment variables
DB_PASSWORD=password
SECRET_KEY=dev_secret_key_replace_in_production
DEBUG=True
EOF
fi

# Make sure entrypoint scripts are executable
echo "Making entrypoint scripts executable..."
chmod +x ./frontend/entrypoint.sh 2>/dev/null || echo "Warning: entrypoint.sh not found in frontend directory"
chmod +x ./backend/entrypoint.sh 2>/dev/null || echo "Warning: entrypoint.sh not found in backend directory"

# We don't need to create these directories in the root, Docker will handle them
# Only create directories if they are referenced in docker-compose but don't exist

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
        docker-compose -f docker-compose.dev.yml up --build -d
    else
        docker compose -f docker-compose.dev.yml up --build -d
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
        docker-compose -f docker-compose.dev.yml ps
    else
        docker compose -f docker-compose.dev.yml ps
    fi
fi

# Display access information
echo ""
echo "Setup completed!"
echo "================================"
echo "Your application should be running at:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Database: localhost:5432"
echo ""
echo "Database credentials:"
echo "User: user"
echo "Password: password"
echo "Database name: education_db"
echo "================================"
echo "Populated users:"
echo "email: test@example.com | password: password123"
echo "email: admin@example.com | password: admin123"

# Determine which compose file to use in commands
if [ -d "./docker-images" ] && [ -f "./docker-images/load-images.sh" ]; then
    COMPOSE_FILE="docker-compose.prebuilt.yml"
else
    COMPOSE_FILE="docker-compose.dev.yml"
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