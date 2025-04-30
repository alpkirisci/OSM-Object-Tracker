#!/bin/bash

# Wait a bit for backend to be ready
until curl -fs http://backend:8000/ >/dev/null; do
  echo "Waiting for backend to start..."
  sleep 2
done
# Setup sample data if available
echo "Checking if sample data setup is available..."
curl -X POST http://backend:8000/setup-samples -H "Content-Type: application/json" || echo "Sample setup not available or failed"

# Enable Compose Bake for better build performance
export COMPOSE_BAKE=true
echo "Enabled COMPOSE_BAKE for better build performance"

# Start the development server with enhanced hot reloading
echo "Starting Next.js dev server with hot reloading..."
exec npm run dev