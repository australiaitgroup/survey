#!/bin/bash

echo "=== Super Admin 访问问题诊断 ==="
echo "Time: $(date)"
echo

echo "1. 测试服务器响应..."
echo "不带斜杠:"
curl -I https://uat-sigma.jiangren.com.au/super-admin 2>/dev/null | head -3
echo

echo "带斜杠:"
curl -I https://uat-sigma.jiangren.com.au/super-admin/ 2>/dev/null | head -3
echo

echo "2. 测试 DNS 解析..."
echo "域名解析:"
nslookup uat-sigma.jiangren.com.au | grep -A2 "Non-authoritative answer:" || echo "DNS 解析可能有问题"
echo

echo "3. 测试网络连通性..."
echo "Ping 测试:"
ping -c 3 uat-sigma.jiangren.com.au | grep "packets transmitted" || echo "网络连通性有问题"
echo

echo "4. 测试页面内容..."
echo "页面标题:"
curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep "<title>" || echo "页面内容有问题"
echo

echo "5. 测试静态资源..."
echo "主要 JS 文件:"
curl -I https://uat-sigma.jiangren.com.au/super-admin/assets/main-Z5r3i4xY.js 2>/dev/null | head -1
echo

echo "CSS 文件:"
css_file=$(curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -o 'href="[^"]*\.css"' | head -1 | sed 's/href="//; s/"//')
if [ ! -z "$css_file" ]; then
    echo "CSS file: $css_file"
    curl -I "https://uat-sigma.jiangren.com.au$css_file" 2>/dev/null | head -1
else
    echo "未发现 CSS 文件（可能使用 Tailwind CDN）"
fi
echo

echo "=== 问题排查建议 ==="
echo "如果服务器响应正常但浏览器无法访问，请尝试："
echo "1. 清除浏览器缓存和 Cookie"
echo "2. 使用无痕模式访问"
echo "3. 尝试不同的浏览器"
echo "4. 检查浏览器控制台错误"
echo "5. 使用 https://uat-sigma.jiangren.com.au/super-admin/ (带斜杠)"
echo "6. 清除 DNS 缓存: sudo dscacheutil -flushcache (macOS)"
echo "7. 检查浏览器的 HTTPS/SSL 设置"
