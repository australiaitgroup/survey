#!/bin/bash

echo "=== Super Admin 详细诊断 ==="
echo "Date: $(date)"
echo

echo "1. 测试完整页面加载..."
curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -E "(script|link|title)" | head -10

echo
echo "2. 测试主要 JavaScript 文件..."
JS_FILE=$(curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -o '/super-admin/assets/main-[^"]*\.js' | head -1)
echo "JavaScript 文件: $JS_FILE"
curl -I https://uat-sigma.jiangren.com.au$JS_FILE 2>/dev/null | head -2

echo
echo "3. 测试 React Router 路径..."
curl -I https://uat-sigma.jiangren.com.au/super-admin/login 2>/dev/null | head -2
curl -I https://uat-sigma.jiangren.com.au/super-admin/dashboard 2>/dev/null | head -2

echo
echo "4. 检查 S3 直接访问..."
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/ 2>/dev/null | head -2

echo
echo "=== 诊断完成 ==="
echo "如果所有测试都返回 200，问题可能在于："
echo "1. 浏览器缓存 - 请使用 Ctrl+F5 强制刷新"
echo "2. JavaScript 错误 - 请检查浏览器控制台"
echo "3. DNS 缓存 - 请清除 DNS 缓存"
