#!/bin/bash

# Exit on any error
set -e

# Color codes for formatted output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory of the script
SCRIPT_DIR="$( dirname "$(readlink -f "$0")" )"
DOCKERLESS_DIR="$SCRIPT_DIR/dockerless_setup"

# Check sudo access
check_sudo_access() {
    echo -e "${YELLOW}Checking sudo access...${NC}"
    if ! sudo -v; then
        echo -e "${RED}This script requires sudo access. Please run with sudo or configure sudo access.${NC}"
        exit 1
    fi
}

# Check required dependencies
check_dependencies() {
    # Make scripts executable
    echo -e "${YELLOW}Ensuring scripts are executable...${NC}"
    chmod +x "$DOCKERLESS_DIR"/*.sh

    local missing_deps=()

    # Check for Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("Python 3.10+")
    fi

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js 22.x")
    fi

    # Check for PostgreSQL
    if ! command -v psql &> /dev/null; then
        missing_deps+=("PostgreSQL")
    fi

    # Check PostgreSQL service
    if ! systemctl is-active --quiet postgresql; then
        echo -e "${YELLOW}PostgreSQL service is not running. Attempting to start...${NC}"
        sudo systemctl start postgresql || missing_deps+=("PostgreSQL service")
    fi

    # If any dependencies are missing, provide installation guidance
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Missing or inactive dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  • ${YELLOW}$dep${NC}"
        done
        
        echo -e "\n${YELLOW}Installation guidance:${NC}"
        echo "- For Ubuntu/Debian:"
        echo "  sudo apt update"
        echo "  sudo apt install python3 nodejs postgresql"
        echo "  sudo systemctl start postgresql"
        exit 1
    fi
}

# Comprehensive permission handling
handle_permissions() {
    echo -e "${YELLOW}Setting up comprehensive file permissions...${NC}"

    # Directories to set permissions for
    local directories=(
        ".next"
        "uploads"
        "frontend/.next"
        "backend/media"
        "backend/static"
        "dockerless_setup"
    )

    # Ensure current user owns these directories
    for dir in "${directories[@]}"; do
        if [ -d "$SCRIPT_DIR/$dir" ]; then
            echo -e "${GREEN}Setting permissions for $dir${NC}"
            sudo chown -R $USER:$USER "$SCRIPT_DIR/$dir"
            sudo chmod -R 755 "$SCRIPT_DIR/$dir"
        fi
    done

    # Ensure all setup scripts are executable
    find "$SCRIPT_DIR/dockerless_setup" -type f -name "*.sh" -exec chmod +x {} \;

    # Create necessary upload directories with correct permissions
    mkdir -p "$SCRIPT_DIR/uploads/videos"
    mkdir -p "$SCRIPT_DIR/frontend/public/uploads"
    mkdir -p "$SCRIPT_DIR/backend/media"

    # Set permissions for upload directories
    sudo chown -R $USER:$USER "$SCRIPT_DIR/uploads"
    sudo chmod -R 755 "$SCRIPT_DIR/uploads"

    sudo chown -R $USER:$USER "$SCRIPT_DIR/frontend/public/uploads"
    sudo chmod -R 755 "$SCRIPT_DIR/frontend/public/uploads"

    sudo chown -R $USER:$USER "$SCRIPT_DIR/backend/media"
    sudo chmod -R 755 "$SCRIPT_DIR/backend/media"

    echo -e "${GREEN}Permission setup completed successfully!${NC}"
}

# Execute setup scripts
setup_project() {
    echo -e "${GREEN}Starting project setup...${NC}"

    # Handle permissions first
    handle_permissions

    # Setup database first
    echo -e "${YELLOW}Setting up database...${NC}"
    "$DOCKERLESS_DIR/db.sh" setup

    # Setup backend
    echo -e "${YELLOW}Setting up backend...${NC}"
    "$DOCKERLESS_DIR/backend.sh" setup

    # Setup frontend
    echo -e "${YELLOW}Setting up frontend...${NC}"
    "$DOCKERLESS_DIR/frontend.sh" setup

    echo -e "${GREEN}Project setup completed successfully!${NC}"
}

# Start services in background
start_services() {
    echo -e "${GREEN}Starting project services...${NC}"

    # Start database services (ensures PostgreSQL is running)
    echo -e "${YELLOW}Starting database service...${NC}"
    "$DOCKERLESS_DIR/db.sh" start

    # Start backend
    echo -e "${YELLOW}Starting backend service...${NC}"
    "$DOCKERLESS_DIR/backend.sh" start &
    BACKEND_PID=$!

    # Give backend a moment to start
    sleep 2

    # Start frontend
    echo -e "${YELLOW}Starting frontend service...${NC}"
    "$DOCKERLESS_DIR/frontend.sh" start &
    FRONTEND_PID=$!

    # Wait for services to start
    wait $BACKEND_PID $FRONTEND_PID

    echo -e "${GREEN}All services started successfully!${NC}"
    echo -e "\n${YELLOW}Services running:${NC}"
    echo "- Backend: http://localhost:8000"
    echo "- Frontend: http://localhost:3000"
}

# Stop all services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"

    # More aggressive stopping mechanism
    "$DOCKERLESS_DIR/frontend.sh" stop
    "$DOCKERLESS_DIR/backend.sh" stop
    "$DOCKERLESS_DIR/db.sh" stop

    # Additional cleanup for any lingering processes
    pkill -f "uvicorn main:app" || true
    pkill -f "node" || true

    echo -e "${GREEN}All services stopped.${NC}"
}

# Main function
main() {
    # Parse command
    case "${1:-}" in
        setup)
            check_sudo_access
            check_dependencies
            setup_project
            ;;
        start)
            check_sudo_access
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            check_sudo_access
            start_services
            ;;
        *)
            echo -e "${RED}Usage: $0 {setup|start|stop|restart}${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

exit 0