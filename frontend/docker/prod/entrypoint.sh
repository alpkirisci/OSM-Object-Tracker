#!/bin/sh
set -e

# In production, we don't need to wait for backend to be ready before starting the frontend
# since Nginx will handle routing

echo "Starting Next.js in production mode..."
exec "$@"