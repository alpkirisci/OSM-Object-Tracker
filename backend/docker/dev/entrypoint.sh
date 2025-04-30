#!/bin/sh

echo "Waiting for PostgreSQL to start..."
until pg_isready -h db -p 5432 -U user; do
  echo "PostgreSQL is not ready yet... sleeping"
  sleep 2
done

# Initialize database
echo "PostgreSQL is ready! Running database initialization..."
python init_db.py

echo "Starting FastAPI server..."
# Start the application
if [ "$DEBUG" = "True" ]; then
  if [ -f "populate_db.py" ]; then
    python populate_db.py
  fi
  echo "Starting in development mode..."
  exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
else
  echo "Starting in production mode..."
  exec uvicorn main:app --host 0.0.0.0 --port 8000
fi