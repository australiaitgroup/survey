#!/bin/bash

echo "=== Super Admin 空白页诊断 ==="
echo "Date: $(date)"
echo

echo "1. 检查页面基本结构..."
echo "页面标题:"
curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep "<title>"

echo "React 根节点:"
curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep "root"

echo

echo "2. 检查关键资源文件..."
echo "Main JS 文件 (main-Z5r3i4xY.js):"
curl -I https://uat-sigma.jiangren.com.au/super-admin/assets/main-Z5r3i4xY.js 2>/dev/null | head -1

echo "Vendor JS 文件 (vendor-Q3K9tvtn.js):"
curl -I https://uat-sigma.jiangren.com.au/super-admin/assets/vendor-Q3K9tvtn.js 2>/dev/null | head -1

echo "Router JS 文件 (router-DQoDbRjX.js):"
curl -I https://uat-sigma.jiangren.com.au/super-admin/assets/router-DQoDbRjX.js 2>/dev/null | head -1

echo

echo "3. 检查 JS 文件内容片段..."
echo "Main JS 文件前50个字符:"
curl -s https://uat-sigma.jiangren.com.au/super-admin/assets/main-Z5r3i4xY.js | head -c 100

echo
echo

echo "4. 检查路由配置..."
echo "Main JS 文件中的路由信息:"
curl -s https://uat-sigma.jiangren.com.au/super-admin/assets/main-Z5r3i4xY.js | grep -o "super-admin" | head -5

echo

echo "=== 可能的问题和解决方案 ==="
echo "1. 浏览器控制台错误:"
echo "   - 按 F12 打开开发者工具"
echo "   - 查看 Console 标签页"
echo "   - 刷新页面并查看错误信息"
echo

echo "2. 网络请求问题:"
echo "   - 按 F12 打开开发者工具"
echo "   - 查看 Network 标签页"
echo "   - 刷新页面并查看是否所有资源都加载成功"
echo

echo "3. React 挂载问题:"
echo "   - 检查是否有 JavaScript 错误阻止了 React 应用启动"
echo "   - 查看是否所有模块都正确加载"
echo

echo "4. 缓存问题:"
echo "   - 硬刷新: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)"
echo "   - 清除浏览器缓存和 Cookie"
echo "   - 尝试无痕模式"
