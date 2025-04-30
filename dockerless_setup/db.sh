#!/bin/bash

# Strict mode
set -euo pipefail

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database configuration (matching Docker Compose settings)
DB_NAME="osm_tracker_db"
DB_USER="user"
DB_PASSWORD="password"
DB_HOST="localhost"
DB_PORT="5432"

# Start PostgreSQL service
start_postgres() {
    echo -e "${YELLOW}Ensuring PostgreSQL service is active...${NC}"
    
    # On most systems, this starts the service if not already running
    sudo systemctl start postgresql || {
        echo -e "${RED}Failed to start PostgreSQL service!${NC}"
        exit 1
    }
    
    # Wait for PostgreSQL to be ready
    echo -e "${YELLOW}Waiting for PostgreSQL to become ready...${NC}"
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
        echo "Waiting for PostgreSQL to start..."
        sleep 2
    done
    
    echo -e "${GREEN}PostgreSQL service is ready.${NC}"
}

# Check if PostgreSQL is installed
check_postgres_installed() {
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}PostgreSQL is not installed!${NC}"
        echo -e "${YELLOW}Installation instructions:${NC}"
        echo "- Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "- macOS (Homebrew): brew install postgresql"
        exit 1
    fi
}

# Create database user
create_user() {
    echo -e "${YELLOW}Creating/updating database user: $DB_USER${NC}"
    
    sudo -u postgres psql -c "DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
            CREATE USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD';
            ALTER USER \"$DB_USER\" WITH SUPERUSER;
        ELSE
            ALTER USER \"$DB_USER\" WITH PASSWORD '$DB_PASSWORD' SUPERUSER;
        END IF;
    END
    \$\$;" || {
        echo -e "${RED}Failed to create/update database user $DB_USER${NC}"
        exit 1
    }
    
    echo -e "${GREEN}User $DB_USER configured successfully.${NC}"
}

# Create database
create_database() {
    echo -e "${YELLOW}Creating/checking database: $DB_NAME${NC}"
    
    # Check if database exists, create if not
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || {
        sudo -u postgres createdb "$DB_NAME" || {
            echo -e "${RED}Failed to create database $DB_NAME${NC}"
            exit 1
        }
    }
    
    # Grant all privileges to the user
    sudo -u postgres psql -c "
    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO \"$DB_USER\";
    " || {
        echo -e "${RED}Failed to grant privileges to $DB_USER${NC}"
        exit 1
    }
    
    echo -e "${GREEN}Database $DB_NAME configured successfully.${NC}"
}

# Stop PostgreSQL service
stop_postgres() {
    echo -e "${YELLOW}Stopping PostgreSQL service...${NC}"
    
    sudo systemctl stop postgresql || {
        echo -e "${RED}Failed to stop PostgreSQL service!${NC}"
        exit 1
    }
    
    echo -e "${GREEN}PostgreSQL service stopped successfully.${NC}"
}

# Main function
main() {
    # Check for command
    case "${1:-}" in
        setup)
            check_postgres_installed
            start_postgres
            create_user
            create_database
            ;;
        start)
            start_postgres
            ;;
        stop)
            stop_postgres
            ;;
        *)
            echo -e "${RED}Usage: $0 {setup|start|stop}${NC}"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

exit 0