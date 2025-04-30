#!/bin/sh
set -e

echo "Waiting for PostgreSQL to start..."
until pg_isready -h db -p 5432 -U user; do
  echo "PostgreSQL is not ready yet... sleeping"
  sleep 2
done

# Run database initialization
echo "PostgreSQL is ready! Running database initialization..."
python init_db.py

# Populate database with sample data if script exists
if [ -f "populate_db.py" ]; then
  echo "Populating database with sample data..."
  python populate_db.py
fi

echo "Starting FastAPI server in production mode..."
exec "$@"