#!/bin/bash
# 服务器端脚本: /opt/scripts/update-nginx-super-admin.sh

set -e

echo "🔧 Updating Nginx configuration for Super Admin..."

# 备份现有配置
CONFIG_FILE="/etc/nginx/sites-available/sigma.jiangren.com.au"
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

sudo cp "$CONFIG_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# 检查是否已经包含 Super Admin 配置
if grep -q "Super Admin" "$CONFIG_FILE"; then
    echo "ℹ️  Super Admin configuration already exists"
    exit 0
fi

# 添加 Super Admin 配置（在最后一个 } 之前）
sudo sed -i '/^}$/i\
    # Super Admin 应用代理到 S3\
    location /super-admin/ {\
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;\
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        proxy_intercept_errors on;\
        error_page 404 = @super_admin_spa;\
    }\
    \
    location = /super-admin {\
        return 301 $scheme://$host/super-admin/;\
    }\
    \
    location @super_admin_spa {\
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html;\
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;\
    }' "$CONFIG_FILE"

# 测试配置
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# 重新加载
echo "🔄 Reloading Nginx..."
sudo nginx -s reload

echo "✅ Nginx configuration updated successfully!"
echo "🌐 Super Admin should now be available at: https://sigma.jiangren.com.au/super-admin"
