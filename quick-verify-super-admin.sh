#!/bin/bash

# Super Admin UAT 部署快速验证
echo "🔍 Super Admin UAT 部署验证"
echo "=================================="

# 检查主入口
echo ""
echo "1. 检查主入口访问："
curl -I https://uat-sigma.jiangren.com.au/super-admin 2>/dev/null | head -3

echo ""
echo "2. 检查主入口（带斜杠）："
curl -I https://uat-sigma.jiangren.com.au/super-admin/ 2>/dev/null | head -3

echo ""
echo "3. 检查页面内容："
if curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -q "Super Admin Dashboard"; then
    echo "✅ 页面标题正确"
else
    echo "❌ 页面标题不正确"
fi

echo ""
echo "4. 检查静态资源路径："
if curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -q "/super-admin/assets/"; then
    echo "✅ 静态资源路径正确"
else
    echo "❌ 静态资源路径不正确"
fi

echo ""
echo "✅ 验证完成"
echo ""
echo "🔗 访问地址: https://uat-sigma.jiangren.com.au/super-admin/"
echo "💡 注意: 只支持主入口访问，不支持子路由"
