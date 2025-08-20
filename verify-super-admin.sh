#!/bin/bash

# 快速验证 Super Admin 部署状态
TARGET_ENV=${1:-"uat"}

if [ "$TARGET_ENV" = "prod" ]; then
    BASE_URL="https://sigma.jiangren.com.au"
elif [ "$TARGET_ENV" = "uat" ]; then
    BASE_URL="https://uat-sigma.jiangren.com.au"
else
    echo "用法: $0 [uat|prod]"
    exit 1
fi

echo "🔍 验证 $TARGET_ENV 环境 Super Admin 状态..."
echo "基础URL: $BASE_URL"
echo ""

echo "1. 测试主页重定向..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/super-admin/)
echo "   状态码: $STATUS"

echo ""
echo "2. 测试登录页面..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/super-admin/login)
echo "   状态码: $STATUS"

echo ""
echo "3. 获取登录页面内容预览..."
curl -s $BASE_URL/super-admin/login | head -5

echo ""
echo "4. 测试不存在路由 (应该返回 SPA index.html)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/super-admin/dashboard)
echo "   状态码: $STATUS"

echo ""
echo "✅ 验证完成"
