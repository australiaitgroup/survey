#!/bin/bash

# 服务器权限配置脚本
# 在你的Web服务器上运行此脚本

echo "🔧 配置Jenkins用户权限..."

# 获取当前用户名
CURRENT_USER=$(whoami)
echo "当前用户: $CURRENT_USER"

# 配置sudoers权限
echo "添加sudo权限..."
sudo tee -a /etc/sudoers.d/jenkins-nginx << EOF
# Jenkins Super Admin 部署权限
$CURRENT_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp, /bin/sed, /usr/bin/sed, /bin/rm
EOF

echo "✅ 权限配置完成！"

# 测试权限
echo "🧪 测试nginx权限..."
if sudo nginx -v; then
    echo "✅ Nginx权限测试成功"
else
    echo "❌ Nginx权限测试失败"
fi
