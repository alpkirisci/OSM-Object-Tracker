#!/bin/bash
set -e

echo "Loading Docker images for production..."

# Check if the image files exist
if [ ! -f "frontend-image.tar.gz" ]; then
    echo "Error: frontend-image.tar.gz not found"
    exit 1
fi

if [ ! -f "backend-image.tar.gz" ]; then
    echo "Error: backend-image.tar.gz not found"
    exit 1
fi

if [ ! -f "postgres-image.tar.gz" ]; then
    echo "Error: postgres-image.tar.gz not found"
    exit 1
fi

if [ ! -f "nginx-image.tar.gz" ]; then
    echo "Error: nginx-image.tar.gz not found"
    exit 1
fi

# Load the images with better error handling
echo "Loading frontend image..."
gunzip -c frontend-image.tar.gz | docker load

echo "Loading backend image..."
gunzip -c backend-image.tar.gz | docker load

echo "Loading postgres image..."
gunzip -c postgres-image.tar.gz | docker load

echo "Loading nginx image..."
gunzip -c nginx-image.tar.gz | docker load

echo "All images loaded successfully!" 