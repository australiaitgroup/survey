#!/bin/bash

echo "=== Testing Backend S3 Proxy Solution ==="
echo "Date: $(date)"
echo

echo "1. 重启后端服务（如果在运行）..."
# 查找并停止现有的 Node.js 进程
pkill -f "node.*server.js" || echo "No existing server process found"

echo
echo "2. 启动后端服务（背景运行）..."
cd /Users/miro/JR/survey
NODE_ENV=production nohup node server.js > server.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

echo
echo "3. 等待服务启动..."
sleep 3

echo
echo "4. 测试后端代理功能..."

echo "测试根路径重定向："
curl -I http://localhost:5050/super-admin 2>/dev/null | head -3

echo
echo "测试 Super Admin 页面代理："
curl -I http://localhost:5050/super-admin/ 2>/dev/null | head -3

echo
echo "测试获取 index.html 内容："
curl -s http://localhost:5050/super-admin/index.html | head -5

echo
echo "5. 检查服务器日志（最后10行）："
tail -10 server.log

echo
echo "=== 测试完成 ==="
echo "如果测试成功，现在可以通过 https://sigma.jiangren.com.au/super-admin/ 访问了"
echo "服务器运行中，PID: $SERVER_PID"
echo "要停止服务器，运行: kill $SERVER_PID"
