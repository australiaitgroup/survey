#!/bin/bash

# Docker测试脚本 - Survey Backend

echo "🧪 Testing Survey Backend Docker Deployment..."

# 检查服务状态
echo "📋 Checking service status..."
docker-compose ps

# 等待服务启动
echo "⏳ Waiting for services to be ready..."
sleep 10

# 测试Backend健康检查
echo "🏥 Testing backend health check..."
BACKEND_HEALTH=$(docker-compose exec -T backend wget --no-verbose --tries=1 --spider http://localhost:5050/api/surveys 2>&1)

if echo "$BACKEND_HEALTH" | grep -q "200 OK"; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    echo "Backend logs:"
    docker-compose logs backend | tail -20
fi

# 测试MongoDB连接
echo "🍃 Testing MongoDB connection..."
MONGO_TEST=$(docker-compose exec -T mongodb mongosh --eval "db.runCommand({ping: 1})" 2>/dev/null)

if echo "$MONGO_TEST" | grep -q "ok.*1"; then
    echo "✅ MongoDB connection successful"
else
    echo "❌ MongoDB connection failed"
    echo "MongoDB logs:"
    docker-compose logs mongodb | tail -10
fi

# 测试API端点
echo "🌐 Testing API endpoints..."
sleep 5

# 测试surveys端点（通过backend容器内部）
API_TEST=$(docker-compose exec -T backend wget --no-verbose --tries=1 --spider http://localhost:5050/api/surveys 2>&1)

if echo "$API_TEST" | grep -q "200 OK"; then
    echo "✅ API endpoint /api/surveys is accessible"
else
    echo "❌ API endpoint test failed"
    echo "Detailed backend logs:"
    docker-compose logs backend | tail -30
fi

echo ""
echo "🔍 For detailed troubleshooting:"
echo "   View all logs: docker-compose logs"
echo "   View backend logs: docker-compose logs backend"
echo "   View mongodb logs: docker-compose logs mongodb"
echo "   Access backend container: docker-compose exec backend sh"