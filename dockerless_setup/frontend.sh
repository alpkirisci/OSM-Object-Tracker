#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Frontend directory
SCRIPT_DIR="$( dirname "$(readlink -f "$0")" )"
FRONTEND_DIR="$(readlink -f "$SCRIPT_DIR/../frontend")"

# Environment variables
export VITE_BACKEND_URL="http://localhost:8000"
export CHOKIDAR_USEPOLLING=true
export DEBUG=true

# Node version check
NODE_VERSION=$(node --version)
REQUIRED_MAJOR_VERSION=22

# Log file
LOG_FILE="$FRONTEND_DIR/frontend.log"

# Check Node.js version and dependencies
check_frontend_environment() {
    echo -e "${YELLOW}Checking frontend environment...${NC}"

    # Extract major version number
    CURRENT_MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/^v\([0-9]*\).*/\1/')
    REQUIRED_MAJOR_VERSION=22

    # Check if current major version is greater than or equal to required version
    if [ "$CURRENT_MAJOR_VERSION" -lt "$REQUIRED_MAJOR_VERSION" ]; then
        echo -e "${RED}Unsupported Node.js version detected.${NC}"
        echo -e "${YELLOW}Current version: $NODE_VERSION${NC}"
        echo -e "${YELLOW}Required version: v$REQUIRED_MAJOR_VERSION.x or higher${NC}"
        echo -e "\n${YELLOW}Node.js Installation Options:${NC}"
        echo "1. Using NodeSource repository (Recommended):"
        echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
        echo
        echo "2. Using NVM (Node Version Manager):"
        echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
        echo "   source ~/.bashrc"
        echo "   nvm install 22"
        echo "   nvm use 22"
        echo
        echo "3. Manual download from nodejs.org:"
        echo "   Visit https://nodejs.org/en/download/ and download Node.js v22.x"
        exit 1
    fi

    # Check for required tools
    local missing_deps=()
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}Missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  • ${YELLOW}$dep${NC}"
        done
        exit 1
    fi

    echo -e "${GREEN}Frontend environment check passed. Node.js version: $NODE_VERSION${NC}"
}

# Setup frontend project
setup_frontend() {
    echo -e "${YELLOW}Setting up frontend environment...${NC}"

    # Change to frontend directory
    cd "$FRONTEND_DIR"

    # Clear previous node_modules if exists
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi

    # Install dependencies
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install

    # Optional: Generate environment files or do additional setup
    if [ -f ".env.example" ] && [ ! -f ".env" ]; then
        echo -e "${YELLOW}Copying environment file...${NC}"
        cp .env.example .env
    fi

    echo -e "${GREEN}Frontend setup completed successfully!${NC}"
}

# Start frontend development server
start_frontend() {
    echo -e "${YELLOW}Starting frontend development server...${NC}"

    # Change to frontend directory
    cd "$FRONTEND_DIR"

    # Wait for backend to be ready
    wait_for_backend

    # Start development server with hot reload and polling
    echo -e "${YELLOW}Starting in development mode with hot reload...${NC}"
    npm run dev 2>&1 | tee "$LOG_FILE" &

    # Store PID
    echo $! > "$FRONTEND_DIR/frontend.pid"

    echo -e "${GREEN}Frontend server started successfully!${NC}"
}

# Wait for backend to be ready
wait_for_backend() {
    local backend_url="${VITE_BACKEND_URL:-http://localhost:8000}"
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}Waiting for backend to be ready at $backend_url...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        if curl -fs "$backend_url" >/dev/null; then
            echo -e "${GREEN}Backend is ready!${NC}"
            
            # Check if sample data setup endpoint exists
            echo -e "${YELLOW}Checking for sample data setup endpoint...${NC}"
            if curl -fs -o /dev/null -w "%{http_code}" "$backend_url/setup-samples" | grep -q "404"; then
                echo -e "${YELLOW}Sample data setup endpoint not available.${NC}"
            else
                echo -e "${YELLOW}Attempting to setup sample data...${NC}"
                curl -X POST "$backend_url/setup-samples" -H "Content-Type: application/json" || \
                    echo -e "${YELLOW}Sample setup failed.${NC}"
            fi
            
            return 0
        fi

        echo "Waiting for backend... (Attempt $((attempt+1))/$max_attempts)"
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}Backend did not become ready in time.${NC}"
    return 1
}

# Stop frontend server
stop_frontend() {
    echo -e "${YELLOW}Stopping frontend server...${NC}"

    # Check if PID file exists
    if [ -f "$FRONTEND_DIR/frontend.pid" ]; then
        local PID
        PID=$(cat "$FRONTEND_DIR/frontend.pid")
        
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm "$FRONTEND_DIR/frontend.pid"
            echo -e "${GREEN}Frontend server stopped successfully.${NC}"
        else
            echo -e "${RED}No active frontend server found.${NC}"
        fi
    else
        echo -e "${RED}No frontend server PID found.${NC}"
    fi
}

# Main script logic
main() {
    check_frontend_environment

    case "${1:-}" in
        setup)
            setup_frontend
            ;;
        start)
            start_frontend
            ;;
        stop)
            stop_frontend
            ;;
        restart)
            stop_frontend
            start_frontend
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