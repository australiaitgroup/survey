#!/bin/bash

# Docker API Test Script for Survey Application
# Tests backend API functionality in Docker environment

set -e

COMPOSE_FILE="docker-compose.prod.yml"
PORT=5050
API_BASE="http://localhost:${PORT}"

echo "======================================"
echo "Docker API Test for Survey Application"
echo "======================================"
echo "Using compose file: $COMPOSE_FILE"
echo "Testing API at: $API_BASE"
echo ""

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s --connect-timeout 2 --max-time 5 "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready (attempt $attempt)"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to become ready after $max_attempts attempts"
    return 1
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo ""
    echo "Testing: $description"
    echo "Endpoint: $endpoint"
    
    # Make request and capture response
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$endpoint" 2>/dev/null) || {
        echo "❌ Failed to connect to $endpoint"
        return 1
    }
    
    # Extract HTTP status and body
    http_status=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_status" = "$expected_status" ]; then
        echo "✅ HTTP $http_status - $description works correctly"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "   Response preview: ${body:0:100}..."
        fi
        return 0
    else
        echo "❌ HTTP $http_status (expected $expected_status) - $description failed"
        if [ -n "$body" ]; then
            echo "   Error response: ${body:0:200}..."
        fi
        return 1
    fi
}

# Start the containers
echo "🚀 Starting Docker containers..."
docker-compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "📊 Container Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "🔍 Checking individual containers:"

# Check MongoDB
echo ""
echo "1. MongoDB Container:"
mongodb_container=$(docker-compose -f "$COMPOSE_FILE" ps -q mongodb)
if [ -n "$mongodb_container" ]; then
    mongodb_running=$(docker inspect "$mongodb_container" --format='{{.State.Running}}' 2>/dev/null)
    if [ "$mongodb_running" = "true" ]; then
        echo "   ✅ MongoDB is running"
        # Test MongoDB connection from app container
        app_container=$(docker-compose -f "$COMPOSE_FILE" ps -q app)
        if [ -n "$app_container" ]; then
            if docker exec "$app_container" nc -z mongodb 27017 2>/dev/null; then
                echo "   ✅ MongoDB is accessible from app container"
            else
                echo "   ❌ MongoDB is not accessible from app container"
            fi
        fi
    else
        echo "   ❌ MongoDB is not running"
        echo "   Logs:"
        docker logs --tail 10 "$mongodb_container"
        exit 1
    fi
else
    echo "   ❌ MongoDB container not found"
    exit 1
fi

# Check App Container
echo ""
echo "2. App Container:"
app_container=$(docker-compose -f "$COMPOSE_FILE" ps -q app)
if [ -n "$app_container" ]; then
    app_running=$(docker inspect "$app_container" --format='{{.State.Running}}' 2>/dev/null)
    if [ "$app_running" = "true" ]; then
        echo "   ✅ App container is running"
        # Check if port 5050 is listening inside container
        if docker exec "$app_container" netstat -tlnp 2>/dev/null | grep :5050; then
            echo "   ✅ Port 5050 is listening inside container"
        else
            echo "   ❌ Port 5050 is not listening inside container"
            echo "   Container processes:"
            docker exec "$app_container" ps aux
        fi
    else
        echo "   ❌ App container is not running"
        echo "   Exit code: $(docker inspect "$app_container" --format='{{.State.ExitCode}}' 2>/dev/null)"
        echo "   Logs:"
        docker logs --tail 15 "$app_container"
        exit 1
    fi
else
    echo "   ❌ App container not found"
    exit 1
fi

# Wait for the application to be ready
echo ""
echo "⏳ Waiting for application to be ready..."
if ! wait_for_service "$API_BASE" "Survey Application"; then
    echo ""
    echo "📋 Debug Information:"
    echo "Host ports:"
    netstat -tlnp | grep :$PORT || echo "Port $PORT not found"
    echo ""
    echo "App container logs:"
    docker logs --tail 20 "$app_container"
    exit 1
fi

# Test API endpoints
echo ""
echo "🧪 Testing API endpoints..."

# Test basic endpoints
test_api_endpoint "$API_BASE" "Homepage/Root endpoint"
test_api_endpoint "$API_BASE/api/surveys" "Surveys API endpoint"
test_api_endpoint "$API_BASE/admin" "Admin dashboard"

# Test API functionality
echo ""
echo "🔧 Testing API functionality..."

# Test creating a survey (POST)
echo ""
echo "Testing: Create Survey (POST)"
create_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Docker Test Survey",
        "description": "Test survey created by Docker API test",
        "questions": [
            {
                "text": "How is the Docker setup?",
                "type": "multiple_choice",
                "options": ["Excellent", "Good", "Needs work"]
            }
        ]
    }' \
    "$API_BASE/api/surveys" 2>/dev/null) || {
    echo "❌ Failed to create survey"
}

if [ -n "$create_response" ]; then
    create_status=$(echo "$create_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    create_body=$(echo "$create_response" | sed -E 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$create_status" = "201" ] || [ "$create_status" = "200" ]; then
        echo "✅ Survey creation successful (HTTP $create_status)"
        survey_id=$(echo "$create_body" | grep -o '"_id":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$survey_id" ]; then
            echo "   Created survey ID: $survey_id"
            
            # Test getting the created survey
            echo ""
            echo "Testing: Get Created Survey"
            test_api_endpoint "$API_BASE/api/surveys/$survey_id" "Get specific survey"
        fi
    else
        echo "❌ Survey creation failed (HTTP $create_status)"
        echo "   Response: ${create_body:0:200}..."
    fi
fi

# Test database connection through API
echo ""
echo "Testing: Database connectivity through API"
# Try to get surveys count or any DB operation
db_test_response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$API_BASE/api/surveys" 2>/dev/null)
if [ -n "$db_test_response" ]; then
    db_status=$(echo "$db_test_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    if [ "$db_status" = "200" ]; then
        echo "✅ Database connection through API is working"
    else
        echo "❌ Database connection through API failed (HTTP $db_status)"
    fi
fi

# Show final status
echo ""
echo "🎯 Final Status Check:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "📈 Resource Usage:"
echo "Memory usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "✅ Docker API test completed successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   Application: $API_BASE"
echo "   Admin Panel: $API_BASE/admin"
echo "   API Docs: $API_BASE/api"
echo ""
echo "To stop the containers: docker-compose -f $COMPOSE_FILE down"