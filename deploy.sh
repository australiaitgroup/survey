#!/bin/bash
set -e

echo "=== Deploying Survey App to EC2 ==="

# Fix PATH to use correct Docker installation
export PATH="/usr/bin:$PATH"
echo "Fixed PATH: $PATH"
echo "Docker location: $(which docker)"

# Navigate to project directory
cd /home/ubuntu/survey || mkdir -p /home/ubuntu/survey

echo "=== Current Working Directory ==="
pwd
echo "=== File Listing ==="
ls -la

# Step 1: Check Docker Compose version
echo "=== Checking Docker Compose version ==="

# Debug environment
echo "PATH: $PATH"
echo "Docker location: $(which docker)"
echo "Docker version:"
docker --version

# Check Docker Compose plugin locations
echo "Checking Docker Compose plugin locations:"
ls -la ~/.docker/cli-plugins/ 2>/dev/null || echo "~/.docker/cli-plugins/ not found"
ls -la /usr/local/lib/docker/cli-plugins/ 2>/dev/null || echo "/usr/local/lib/docker/cli-plugins/ not found"
ls -la /usr/lib/docker/cli-plugins/ 2>/dev/null || echo "/usr/lib/docker/cli-plugins/ not found"

# Ensure Docker Compose plugin is installed
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    mkdir -p ~/.docker/cli-plugins
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o ~/.docker/cli-plugins/docker-compose
    chmod +x ~/.docker/cli-plugins/docker-compose
fi

echo "Docker Compose version:"
docker compose version

# Step 2: Stop Old Containers
echo "=== Stopping Old Containers ==="
echo "=== Docker Compose Files Check ==="
if [ -f "docker-compose.prod.yml" ]; then
    echo "✓ docker-compose.prod.yml exists"
else
    echo "✗ docker-compose.prod.yml missing"
    exit 1
fi

# Stop and remove existing survey containers
docker compose -f docker-compose.prod.yml down || true

# Remove only survey-related images
docker images | grep survey | awk '{print $3}' | xargs -r docker rmi -f || true

# Clean up only dangling images
docker image prune -f

# Step 3: Build and Deploy
echo "=== Building and Deploying ==="

# Create .env file with environment variables
cat > .env << 'EOF'
MONGODB_URI=${MONGO_URI}
PORT=5173
NODE_ENV=production
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF

echo "✅ Environment file created"

# Validate that required environment variables are set
if [ -z "${MONGO_URI}" ]; then
    echo "ERROR: MONGO_URI environment variable is required but not set"
    exit 1
fi

echo "✅ Using external MongoDB at: ${MONGO_URI}"

# Build and start services
echo "Building and starting services..."
echo "Testing docker compose version again:"
docker compose version
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
sleep 15

# Check container status
echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

# Show logs if there are issues
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "=== Container Logs ==="
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi

echo "=== Deployment completed successfully ==="
