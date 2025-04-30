#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend directory (adjust as needed)
SCRIPT_DIR="$( dirname "$(readlink -f "$0")" )"
BACKEND_DIR="$(readlink -f "$SCRIPT_DIR/../backend")"

# Environment variables
export DATABASE_URL="postgresql://user:password@localhost/osm_tracker_db"
export DEBUG=True
export WATCHDOG_USE_POLLING=true

# Python virtual environment path
VENV_PATH="$BACKEND_DIR/venv"

# Log file
LOG_FILE="$BACKEND_DIR/backend.log"

# Minimum Python version required
PYTHON_MIN_MAJOR=3
PYTHON_MIN_MINOR=10

# Check Python version
check_python_version() {
    echo -e "${YELLOW}Checking Python version...${NC}"
    
    # Check if Python3 exists
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python3 is not installed.${NC}"
        exit 1
    fi

    # Get Python version
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PYTHON_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
    PYTHON_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")

    # Compare version
    if [ "$PYTHON_MAJOR" -lt "$PYTHON_MIN_MAJOR" ] || 
       ([ "$PYTHON_MAJOR" -eq "$PYTHON_MIN_MAJOR" ] && [ "$PYTHON_MINOR" -lt "$PYTHON_MIN_MINOR" ]); then
        echo -e "${RED}Python version $PYTHON_VERSION is not supported.${NC}"
        echo -e "${YELLOW}Required: Python ${PYTHON_MIN_MAJOR}.${PYTHON_MIN_MINOR}+${NC}"
        echo -e "\nInstallation guidance:"
        echo "1. For Ubuntu/Debian:"
        echo "   sudo add-apt-repository ppa:deadsnakes/ppa"
        echo "   sudo apt update"
        echo "   sudo apt install python3.10 python3.10-venv python3.10-dev"
        echo "   sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1"
        echo
        echo "2. For other systems, consider using pyenv or downloading from python.org"
        exit 1
    fi

    echo -e "${GREEN}Python version $PYTHON_VERSION ✓${NC}"
}

# Create virtual environment and install dependencies
setup_backend() {
    # Check Python version first
    check_python_version

    # Change to backend directory
    cd "$BACKEND_DIR"

    echo -e "${YELLOW}Setting up backend environment...${NC}"

    # Check if virtual environment exists
    if [ ! -d "$VENV_PATH" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv "$VENV_PATH"
    fi

    # Activate virtual environment
    # shellcheck disable=SC1091
    source "$VENV_PATH/bin/activate"

    # Upgrade pip and setuptools
    pip install --upgrade pip setuptools

    # Install requirements
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt

    # Database initialization
    echo -e "${YELLOW}Initializing database...${NC}"
    python init_db.py

    # Optionally populate database if script exists
    if [ -f "populate_db.py" ]; then
        echo -e "${YELLOW}Populating database with sample data...${NC}"
        python populate_db.py
    fi

    # Deactivate virtual environment
    deactivate

    echo -e "${GREEN}Backend setup completed successfully!${NC}"
}

# Start backend server
start_backend() {
    # Check Python version first
    check_python_version

    # Change to backend directory
    cd "$BACKEND_DIR"

    echo -e "${YELLOW}Starting backend server...${NC}"

    # Activate virtual environment
    # shellcheck disable=SC1091
    source "$VENV_PATH/bin/activate"

    # Start server with hot reload
    echo -e "${YELLOW}Starting in development mode with hot reload...${NC}"
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | tee "$LOG_FILE" &

    # Store PID
    echo $! > backend.pid

    # Deactivate virtual environment
    deactivate

    echo -e "${GREEN}Backend server started successfully!${NC}"
}

# Stop backend server
stop_backend() {
    cd "$BACKEND_DIR"

    echo -e "${YELLOW}Stopping backend server...${NC}"

    # Check if PID file exists
    if [ -f "backend.pid" ]; then
        PID=$(cat "backend.pid")
        
        # Try to stop the process more thoroughly
        if kill -0 "$PID" 2>/dev/null; then
            # First, try a graceful shutdown
            kill "$PID" 2>/dev/null || true
            
            # Wait a moment
            sleep 2
            
            # If still running, force kill
            if kill -0 "$PID" 2>/dev/null; then
                kill -9 "$PID" 2>/dev/null || true
            fi
        fi

        # Remove PID file
        rm -f "backend.pid"
        echo -e "${GREEN}Backend server stopped successfully.${NC}"
    else
        # Check for any Python/uvicorn processes on port 8000
        RUNNING_PROCS=$(lsof -ti:8000 | xargs -r kill -9 2>/dev/null || true)
        echo -e "${YELLOW}Cleaned up any processes on port 8000.${NC}"
    fi
}

# Main script logic
case "${1:-}" in
    setup)
        setup_backend
        ;;
    start)
        start_backend
        ;;
    stop)
        stop_backend
        ;;
    restart)
        stop_backend
        start_backend
        ;;
    *)
        echo -e "${RED}Usage: $0 {setup|start|stop|restart}${NC}"
        exit 1
        ;;
esac

exit 0