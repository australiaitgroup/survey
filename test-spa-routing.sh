#!/bin/bash

echo "=== 测试 SPA 路由修复状态 ==="
echo "Date: $(date)"
echo

# 测试不同路由
routes=(
    "https://uat-sigma.jiangren.com.au/super-admin"
    "https://uat-sigma.jiangren.com.au/super-admin/"
    "https://uat-sigma.jiangren.com.au/super-admin/login"
    "https://uat-sigma.jiangren.com.au/super-admin/dashboard"
)

for route in "${routes[@]}"; do
    echo "测试路由: $route"
    status=$(curl -s -o /dev/null -w "%{http_code}" "$route")
    if [ "$status" = "200" ]; then
        echo "✅ 状态: $status"
    else
        echo "❌ 状态: $status"
    fi
    echo
done

echo "=== S3 直接访问测试 ==="
s3_url="http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin"
echo "测试 S3 网站端点: $s3_url"
status=$(curl -s -o /dev/null -w "%{http_code}" "$s3_url")
echo "状态: $status"
echo

echo "=== 建议 ==="
echo "1. 如果域名路由仍然 404，请重新运行 Jenkinsfile_super_admin"
echo "2. 确保 Configure S3 Website 阶段成功执行"
echo "3. 清除浏览器缓存: Ctrl+F5 或 Cmd+Shift+R"
echo "4. 检查浏览器控制台是否有 JavaScript 错误"
