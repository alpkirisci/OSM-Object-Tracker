#!/bin/bash
set -e

echo "Creating complete project package..."

# Define package name with date
DATE_STAMP=$(date +%Y%m%d)
PROJECT_NAME=$(basename $(pwd))
PACKAGE_DIR="${PROJECT_NAME}-package-${DATE_STAMP}"

# Create package directory
mkdir -p "$PACKAGE_DIR"

# Step 1: Copy project files with safer approach
echo "Copying project files..."

# Copy frontend directory
echo "Copying frontend files..."
mkdir -p "$PACKAGE_DIR/frontend"
cp -r frontend/* "$PACKAGE_DIR/frontend/" 2>/dev/null || true

# Copy backend directory with special handling for uploads
echo "Copying backend files..."
mkdir -p "$PACKAGE_DIR/backend"
# Skip uploads directory to avoid permission issues
find backend -type d -not -path "backend/uploads*" | while read dir; do
    mkdir -p "$PACKAGE_DIR/$dir" 2>/dev/null || true
done
find backend -type f -not -path "backend/uploads*" | while read file; do
    cp "$file" "$PACKAGE_DIR/$file" 2>/dev/null || true
done

# Create uploads directory structure but don't copy the files
mkdir -p "$PACKAGE_DIR/backend/uploads/data" 2>/dev/null || true
mkdir -p "$PACKAGE_DIR/backend/uploads/images" 2>/dev/null || true
touch "$PACKAGE_DIR/backend/uploads/.gitkeep" 2>/dev/null || true

# Copy docker-compose file
echo "Copying docker-compose.dev.yml..."
cp docker-compose.dev.yml "$PACKAGE_DIR/" 2>/dev/null || echo "Warning: docker-compose.dev.yml not found"

# Check if .env file exists and copy it
if [ -f ".env" ]; then
    echo "Copying .env file..."
    cp .env "$PACKAGE_DIR/"
else
    echo "Warning: .env file not found. Creating a sample .env file..."
    cat > "$PACKAGE_DIR/.env" << 'EOF'
# Sample environment variables - Update these values for your environment
DB_PASSWORD=password
SECRET_KEY=dev_secret_key_replace_in_production
DEBUG=True
EOF
fi

# Check if static directory exists and copy it
if [ -d "static" ]; then
    echo "Copying static directory..."
    cp -r static "$PACKAGE_DIR/"
fi

# Check if db directory exists and copy it
if [ -d "db" ]; then
    echo "Copying db directory..."
    cp -r db "$PACKAGE_DIR/"
fi

# Step 2: Copy package files from package_dev directory
echo "Copying package setup files..."
if [ ! -d "package_dev" ]; then
    echo "Error: package_dev directory not found. Please create it with all required files."
    exit 1
fi

cp package_dev/setup.sh "$PACKAGE_DIR/"
cp package_dev/README.md "$PACKAGE_DIR/"
chmod +x "$PACKAGE_DIR/setup.sh"

# Create docker-images directory
mkdir -p "$PACKAGE_DIR/docker-images"
cp package_dev/load-images.sh "$PACKAGE_DIR/docker-images/"
chmod +x "$PACKAGE_DIR/docker-images/load-images.sh"

# Copy docker-compose for prebuilt images and replace image names
if [ -f "package_dev/docker-compose.prebuilt.yml" ]; then
    echo "Copying and configuring docker-compose.prebuilt.yml..."
    
    # Build the images first if needed
    echo "Building Docker images..."
    docker-compose -f docker-compose.dev.yml build
    
    # Determine image names
    FRONTEND_IMAGE=$(docker-compose -f docker-compose.dev.yml images -q frontend)
    BACKEND_IMAGE=$(docker-compose -f docker-compose.dev.yml images -q backend)
    
    # If the above command doesn't work, fall back to default naming convention
    if [ -z "$FRONTEND_IMAGE" ]; then
        FRONTEND_IMAGE="${PROJECT_NAME}_frontend"
        echo "Using default frontend image name: $FRONTEND_IMAGE"
    fi
    
    if [ -z "$BACKEND_IMAGE" ]; then
        BACKEND_IMAGE="${PROJECT_NAME}_backend"
        echo "Using default backend image name: $BACKEND_IMAGE"
    fi
    
    # Copy and replace image names in docker-compose.prebuilt.yml
    sed -e "s|FRONTEND_IMAGE_PLACEHOLDER|${FRONTEND_IMAGE}|g" \
        -e "s|BACKEND_IMAGE_PLACEHOLDER|${BACKEND_IMAGE}|g" \
        package_dev/docker-compose.prebuilt.yml > "$PACKAGE_DIR/docker-compose.prebuilt.yml"
else
    echo "Error: docker-compose.prebuilt.yml not found in package_dev directory."
    exit 1
fi

# Step 3: Build and save Docker images
echo "Building and saving Docker images..."

# Save the images
echo "Saving frontend image ($FRONTEND_IMAGE)..."
docker save "$FRONTEND_IMAGE" | gzip > "$PACKAGE_DIR/docker-images/frontend-image.tar.gz"

echo "Saving backend image ($BACKEND_IMAGE)..."
docker save "$BACKEND_IMAGE" | gzip > "$PACKAGE_DIR/docker-images/backend-image.tar.gz"

echo "Pulling and saving postgres image..."
docker pull postgres:15
docker save postgres:15 | gzip > "$PACKAGE_DIR/docker-images/postgres-image.tar.gz"

# Step 4: Create the final package
echo "Creating final tar archive..."
PACKAGE_FILE="${PROJECT_NAME}-package-${DATE_STAMP}.tar.gz"
tar -czvf "$PACKAGE_FILE" "$PACKAGE_DIR"

echo "Clean up temporary directory..."
rm -rf "$PACKAGE_DIR"

echo "Package created successfully: $PACKAGE_FILE"
echo ""
echo "To set up the project on another machine:"
echo "1. Transfer the package to the target machine"
echo "2. Extract with: tar -xzvf $PACKAGE_FILE"
echo "3. Navigate to the extracted directory: cd ${PROJECT_NAME}-package-${DATE_STAMP}"
echo "4. Run: ./setup.sh"

exit 0