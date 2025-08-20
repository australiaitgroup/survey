#!/bin/bash

echo "=== 缓存清除效果验证 ==="
echo "Date: $(date)"
echo

echo "请按照以下步骤清除缓存："
echo
echo "🚀 快速方法 (先试这个)："
echo "1. 打开 https://uat-sigma.jiangren.com.au/super-admin/"
echo "2. 按 Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac) 强制刷新"
echo
echo "📱 如果还不行，试试无痕模式："
echo "1. 按 Ctrl+Shift+N (Chrome) 或 Cmd+Shift+N (Safari) 打开无痕窗口"
echo "2. 访问 https://uat-sigma.jiangren.com.au/super-admin/"
echo
echo "🧹 如果仍然不行，完全清除缓存："
echo "1. 按 Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)"
echo "2. 选择 '全部时间' 并清除所有缓存数据"
echo

echo "=== 当前服务器状态检查 ==="
echo "1. UAT 域名状态:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://uat-sigma.jiangren.com.au/super-admin/)
echo "   HTTP 状态: $STATUS"

echo
echo "2. 内容检查:"
TITLE=$(curl -s https://uat-sigma.jiangren.com.au/super-admin/ | grep -o '<title>[^<]*</title>')
echo "   页面标题: $TITLE"

echo
echo "3. JavaScript 文件状态:"
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://uat-sigma.jiangren.com.au/super-admin/assets/main-Z5r3i4xY.js)
echo "   JavaScript HTTP 状态: $JS_STATUS"

echo
if [ "$STATUS" = "200" ] && [ "$JS_STATUS" = "200" ]; then
    echo "✅ 服务器端一切正常！问题确实是缓存导致的。"
    echo "请按照上面的步骤清除浏览器缓存。"
else
    echo "❌ 服务器端可能有问题，需要进一步调查。"
fi

echo
echo "=== 验证完成 ==="
