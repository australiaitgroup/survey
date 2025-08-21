#!/bin/bash

# Simple Backend API Test Script
# Quick test to verify backend API is working in Docker

API_BASE="http://localhost:5050"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=========================================="
echo "Quick Backend API Test"
echo "=========================================="
echo "API Base: $API_BASE"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    if response=$(curl -s --connect-timeout 5 --max-time 10 "$url" 2>/dev/null); then
        if [ -n "$response" ]; then
            echo "✅ OK"
            return 0
        else
            echo "❌ Empty response"
            return 1
        fi
    else
        echo "❌ Failed to connect"
        return 1
    fi
}

# Function to test POST endpoint
test_post_endpoint() {
    local url=$1
    local data=$2
    local name=$3
    
    echo -n "Testing $name (POST)... "
    
    if response=$(curl -s --connect-timeout 10 --max-time 15 \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url" 2>/dev/null); then
        if [ -n "$response" ]; then
            echo "✅ OK"
            echo "$response" | head -c 100
            echo ""
            return 0
        else
            echo "❌ Empty response"
            return 1
        fi
    else
        echo "❌ Failed to connect"
        return 1
    fi
}

# Check if containers are running
echo "1. Container Status Check:"
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo "   ✅ Containers are running"
else
    echo "   ❌ Containers not running properly"
    echo "   Starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    sleep 10
fi

echo ""
echo "2. API Endpoint Tests:"

# Wait a moment for the service to be ready
sleep 3

# Test basic endpoints
test_endpoint "$API_BASE" "Homepage"
test_endpoint "$API_BASE/api/surveys" "Surveys API"
test_endpoint "$API_BASE/admin" "Admin Panel"

echo ""
echo "3. Database Connectivity Test:"

# Test creating a survey to verify database connection
survey_data='{
    "title": "API Test Survey",
    "description": "Testing API functionality",
    "questions": [
        {
            "text": "Is the API working?",
            "type": "multiple_choice",
            "options": ["Yes", "No"]
        }
    ]
}'

test_post_endpoint "$API_BASE/api/surveys" "$survey_data" "Create Survey"

echo ""
echo "4. Container Health Check:"
echo "App container logs (last 5 lines):"
app_container=$(docker-compose -f "$COMPOSE_FILE" ps -q app)
if [ -n "$app_container" ]; then
    docker logs --tail 5 "$app_container"
else
    echo "❌ App container not found"
fi

echo ""
echo "MongoDB container status:"
mongodb_container=$(docker-compose -f "$COMPOSE_FILE" ps -q mongodb)
if [ -n "$mongodb_container" ]; then
    if docker inspect "$mongodb_container" --format='{{.State.Running}}' | grep -q true; then
        echo "✅ MongoDB is running"
    else
        echo "❌ MongoDB is not running"
    fi
else
    echo "❌ MongoDB container not found"
fi

echo ""
echo "=========================================="
echo "Test completed!"
echo "Access the application at: $API_BASE"
echo "=========================================="