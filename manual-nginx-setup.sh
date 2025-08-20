#!/bin/bash

# 手动 Nginx 配置脚本 (如果 Jenkins SSH 不可用)
# 在 web 服务器上直接运行此脚本

set -e

CONFIG_FILE="/etc/nginx/sites-available/sigma.jiangren.com.au"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 手动更新 Nginx 配置 - Super Admin"
echo "======================================"

# 检查是否为 root 或有 sudo 权限
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    echo "❌ 此脚本需要 root 权限或 sudo 权限"
    echo "请使用: sudo $0"
    exit 1
fi

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Nginx 配置文件不存在: $CONFIG_FILE"
    echo "可用的配置文件:"
    ls -la /etc/nginx/sites-available/
    echo
    echo "请检查域名配置文件名是否正确"
    exit 1
fi

# 检查是否已经包含 Super Admin 配置
if grep -q "Super Admin\|super-admin" "$CONFIG_FILE"; then
    echo "ℹ️  Super Admin 配置已存在"
    echo "如需重新配置，请先手动删除相关配置再运行此脚本"
    exit 0
fi

echo "📋 创建配置备份..."
if [ "$EUID" -eq 0 ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"
else
    sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
fi
echo "✅ 备份已创建: $BACKUP_FILE"

echo "🔧 添加 Super Admin 配置..."

# 创建临时配置片段
cat > /tmp/super-admin-config.txt << 'EOF'

    # ==================== Super Admin 配置开始 ====================

    # Super Admin 应用代理到 S3
    location /super-admin/ {
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 移除 S3 响应头
        proxy_hide_header x-amz-id-2;
        proxy_hide_header x-amz-request-id;
        proxy_hide_header x-amz-meta-server-side-encryption;

        # SPA 路由支持
        proxy_intercept_errors on;
        error_page 404 = @super_admin_spa;

        # 超时设置
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;
    }

    # 处理没有尾部斜杠的 /super-admin 请求
    location = /super-admin {
        return 301 $scheme://$host/super-admin/;
    }

    # Super Admin SPA 路由回退
    location @super_admin_spa {
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html;
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ==================== Super Admin 配置结束 ====================
EOF

# 在最后一个 } 之前插入配置
if [ "$EUID" -eq 0 ]; then
    sed -i '/^}$/i\' "$CONFIG_FILE"
    sed -i '/^}$/r /tmp/super-admin-config.txt' "$CONFIG_FILE"
else
    sudo sed -i '/^}$/i\' "$CONFIG_FILE"
    sudo sed -i '/^}$/r /tmp/super-admin-config.txt' "$CONFIG_FILE"
fi

# 清理临时文件
rm -f /tmp/super-admin-config.txt

echo "🧪 测试 Nginx 配置..."
if [ "$EUID" -eq 0 ]; then
    nginx -t
else
    sudo nginx -t
fi

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过"

    echo "🔄 重新加载 Nginx..."
    if [ "$EUID" -eq 0 ]; then
        nginx -s reload
    else
        sudo nginx -s reload
    fi

    echo "✅ Nginx 配置更新完成!"
    echo
    echo "🌐 Super Admin 现在可以通过以下地址访问:"
    echo "   https://sigma.jiangren.com.au/super-admin"
    echo
    echo "📋 其他访问方式:"
    echo "   S3 直接访问: http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin"
    echo
    echo "🔍 验证访问:"
    echo "   curl -I https://sigma.jiangren.com.au/super-admin/"
else
    echo "❌ Nginx 配置测试失败"
    echo "正在恢复备份配置..."

    if [ "$EUID" -eq 0 ]; then
        cp "$BACKUP_FILE" "$CONFIG_FILE"
    else
        sudo cp "$BACKUP_FILE" "$CONFIG_FILE"
    fi

    echo "⚠️  配置已恢复，请检查错误并重试"
    exit 1
fi
