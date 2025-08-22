#!/bin/bash

# Nginx 配置更新脚本 - 修正 API 代理端口
# 此脚本修正了 UAT 和生产环境中 Nginx API 代理的端口配置

set -e

echo "🔧 Nginx 配置端口修正脚本"
echo "================================"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查是否以 root 权限运行
if [[ $EUID -ne 0 ]]; then
   print_error "此脚本需要 root 权限运行"
   echo "请使用: sudo $0"
   exit 1
fi

print_info "检查并更新 Nginx 配置文件..."

# 配置文件路径
UAT_CONFIG="/etc/nginx/sites-available/uat-sigma.jiangren.com.au"
PROD_CONFIG="/etc/nginx/sites-available/sigma.jiangren.com.au"

# 检查并更新 UAT 配置
if [ -f "$UAT_CONFIG" ]; then
    print_info "更新 UAT 配置: $UAT_CONFIG"
    
    # 备份原文件
    cp "$UAT_CONFIG" "${UAT_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 更新端口从 5051 到 5174
    sed -i 's/localhost:5051/localhost:5174/g' "$UAT_CONFIG"
    
    print_status "UAT 配置已更新 (5051 → 5174)"
else
    print_warning "UAT 配置文件不存在: $UAT_CONFIG"
fi

# 检查并更新生产配置
if [ -f "$PROD_CONFIG" ]; then
    print_info "更新生产配置: $PROD_CONFIG"
    
    # 备份原文件
    cp "$PROD_CONFIG" "${PROD_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # 更新端口从 5050 到 5173
    sed -i 's/localhost:5050/localhost:5173/g' "$PROD_CONFIG"
    
    print_status "生产配置已更新 (5050 → 5173)"
else
    print_warning "生产配置文件不存在: $PROD_CONFIG"
fi

# 测试 Nginx 配置
print_info "测试 Nginx 配置..."
if nginx -t; then
    print_status "Nginx 配置测试通过"
    
    print_info "重新加载 Nginx..."
    if systemctl reload nginx; then
        print_status "Nginx 已成功重新加载"
    else
        print_error "Nginx 重新加载失败"
        exit 1
    fi
else
    print_error "Nginx 配置测试失败"
    print_warning "请检查配置文件语法"
    exit 1
fi

echo
print_status "端口修正完成！"
echo
print_info "配置摘要:"
print_info "  UAT API:  localhost:5174 (uat-sigma.jiangren.com.au/api/)"
print_info "  生产 API: localhost:5173 (sigma.jiangren.com.au/api/)"
echo
print_warning "重要提示:"
print_warning "1. 确保后端服务运行在正确端口"
print_warning "2. 清除浏览器缓存测试 API 访问"
print_warning "3. 检查防火墙是否允许这些端口"
echo
print_info "测试命令:"
print_info "  UAT API:  curl -I https://uat-sigma.jiangren.com.au/api/admin/check-auth"
print_info "  生产 API: curl -I https://sigma.jiangren.com.au/api/admin/check-auth"
