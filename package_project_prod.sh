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
echo "Copying docker-compose.prod.yml..."
cp docker-compose.prod.yml "$PACKAGE_DIR/" 2>/dev/null || echo "Warning: docker-compose.prod.yml not found"

# Check if .env file exists and copy it
if [ -f ".env" ]; then
    echo "Copying .env file..."
    cp .env "$PACKAGE_DIR/"
else
    echo "Warning: .env file not found. Creating a sample .env file for production..."
    cat > "$PACKAGE_DIR/.env" << 'EOF'
# Sample production environment variables - Update these values for your environment
DB_PASSWORD=change_this_password_in_production
SECRET_KEY=change_this_secret_key_in_production
DEBUG=False
ALLOWED_HOSTS=*
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

# Step 2: Copy package files from package_prod directory
echo "Copying package setup files..."
if [ ! -d "package_prod" ]; then
    echo "Error: package_prod directory not found. Please create it with all required files."
    exit 1
fi

cp package_prod/setup.sh "$PACKAGE_DIR/"
cp package_prod/README.md "$PACKAGE_DIR/"
chmod +x "$PACKAGE_DIR/setup.sh"

# Create docker-images directory
mkdir -p "$PACKAGE_DIR/docker-images"
cp package_prod/load-images.sh "$PACKAGE_DIR/docker-images/"
chmod +x "$PACKAGE_DIR/docker-images/load-images.sh"

# Copy docker-compose for prebuilt images and replace image names
if [ -f "package_prod/docker-compose.prebuilt.yml" ]; then
    echo "Copying and configuring docker-compose.prebuilt.yml..."
    
    # Build the images first if needed
    echo "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build
    
    # Determine image names
    FRONTEND_IMAGE=$(docker-compose -f docker-compose.prod.yml images -q frontend)
    BACKEND_IMAGE=$(docker-compose -f docker-compose.prod.yml images -q backend)
    
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
        package_prod/docker-compose.prebuilt.yml > "$PACKAGE_DIR/docker-compose.prebuilt.yml"
else
    echo "Error: docker-compose.prebuilt.yml not found in package_prod directory."
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

echo "Pulling and saving nginx image..."
docker pull nginx:stable-alpine
docker save nginx:stable-alpine | gzip > "$PACKAGE_DIR/docker-images/nginx-image.tar.gz"

# Handle Nginx directory
echo "Setting up Nginx configuration..."
mkdir -p "$PACKAGE_DIR/nginx/conf.d"
mkdir -p "$PACKAGE_DIR/nginx/logs"

# Copy existing nginx configuration if available
if [ -d "nginx" ] && [ -f "nginx/conf.d/app.conf" ]; then
    echo "Copying existing nginx configuration..."
    cp -r nginx/conf.d "$PACKAGE_DIR/nginx/"
    # Create logs directory but don't copy log files
    mkdir -p "$PACKAGE_DIR/nginx/logs"
    # Copy SSL files if they exist
    if [ -d "nginx/ssl" ]; then
        cp -r nginx/ssl "$PACKAGE_DIR/nginx/"
    fi
else
    # Create a default nginx config
    echo "Creating default nginx configuration..."
    cat > "$PACKAGE_DIR/nginx/conf.d/default.conf" << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

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