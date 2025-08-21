#!/bin/bash

# Docker启动脚本 - Survey Backend

echo "🚀 Starting Survey Backend Docker Deployment..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# 检查环境文件
if [ ! -f ".env.docker" ]; then
    echo "❌ Error: .env.docker file not found. Please ensure it exists."
    exit 1
fi

echo "📦 Building backend Docker image..."
docker build -f Dockerfile.backend -t survey-backend .

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build backend Docker image."
    exit 1
fi

echo "🐳 Starting services with docker-compose..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Survey backend deployment started successfully!"
    echo ""
    echo "📋 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 To view logs:"
    echo "   Backend logs: docker-compose logs -f backend"
    echo "   All logs: docker-compose logs -f"
    echo ""
    echo "🛑 To stop services:"
    echo "   docker-compose down"
else
    echo "❌ Error: Failed to start services."
    exit 1
fi