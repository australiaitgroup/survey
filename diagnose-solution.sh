#!/bin/bash

# Sigma Survey Platform - 问题诊断和解决脚本
# 用于诊断和解决 /admin/register 访问问题

set -e

echo "🔍 Sigma Survey Platform - 问题诊断"
echo "================================="

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

# 配置
UAT_DOMAIN="uat-sigma.jiangren.com.au"
PROD_DOMAIN="sigma.jiangren.com.au"

echo
print_info "开始诊断 UAT 环境..."

# 1. 检查域名解析
print_info "1. 检查域名解析..."
if nslookup $UAT_DOMAIN > /dev/null 2>&1; then
    print_status "域名解析正常"
else
    print_error "域名解析失败"
fi

# 2. 检查主页面访问
print_info "2. 检查主页面访问..."
MAIN_RESPONSE=$(curl -s -I https://$UAT_DOMAIN/ | head -1)
if echo "$MAIN_RESPONSE" | grep -q "200\|301\|302"; then
    print_status "主页面可访问: $MAIN_RESPONSE"
else
    print_warning "主页面访问异常: $MAIN_RESPONSE"
fi

# 3. 检查 Super Admin 访问
print_info "3. 检查 Super Admin 访问..."
SA_RESPONSE=$(curl -s -I https://$UAT_DOMAIN/super-admin/ | head -1)
if echo "$SA_RESPONSE" | grep -q "200\|301\|302"; then
    print_status "Super Admin 可访问: $SA_RESPONSE"
else
    print_error "Super Admin 访问失败: $SA_RESPONSE"
fi

# 4. 检查问题路径 /admin/register
print_info "4. 检查问题路径 /admin/register..."
REGISTER_RESPONSE=$(curl -s -I https://$UAT_DOMAIN/admin/register | head -1)
if echo "$REGISTER_RESPONSE" | grep -q "200"; then
    print_status "注册页面可访问: $REGISTER_RESPONSE"
    PROBLEM_FOUND="false"
else
    print_error "注册页面访问失败: $REGISTER_RESPONSE"
    PROBLEM_FOUND="true"
fi

# 5. 检查 API 端点
print_info "5. 检查 API 端点..."
API_RESPONSE=$(curl -s -I https://$UAT_DOMAIN/api/admin/check-auth | head -1)
if echo "$API_RESPONSE" | grep -q "401\|200"; then
    print_status "API 端点可访问: $API_RESPONSE"
else
    print_warning "API 端点可能有问题: $API_RESPONSE"
fi

# 6. 检查 S3 桶内容
print_info "6. 检查 S3 桶直接访问..."
S3_DIRECT_RESPONSE=$(curl -s -I http://$UAT_DOMAIN.s3-website-ap-southeast-2.amazonaws.com/ | head -1)
if echo "$S3_DIRECT_RESPONSE" | grep -q "200"; then
    print_status "S3 桶直接访问正常: $S3_DIRECT_RESPONSE"
else
    print_warning "S3 桶直接访问异常: $S3_DIRECT_RESPONSE"
fi

echo
print_info "=== 诊断总结 ==="

if [ "$PROBLEM_FOUND" = "true" ]; then
    print_error "发现问题：/admin/register 路径无法访问"
    echo
    print_info "问题分析："
    print_warning "1. /admin/register 是主前端应用的路由"
    print_warning "2. 当前 UAT S3 桶中可能只有 Super Admin 应用"
    print_warning "3. 缺少主前端应用的部署"
    echo
    print_info "解决方案："
    print_status "方案1 (推荐): 部署主前端到 UAT"
    echo "  - 使用 Jenkins 运行 Jenkinsfile_main_frontend_uat"
    echo "  - 这会将主前端应用部署到 UAT S3 桶"
    echo "  - 主前端和 Super Admin 可以共存"
    echo
    print_status "方案2: 使用 Super Admin 进行管理"
    echo "  - 直接访问: https://$UAT_DOMAIN/super-admin/"
    echo "  - 使用 Super Admin 的用户和公司管理功能"
    echo
    print_status "方案3: 修改 Nginx 配置"
    echo "  - 将 /admin/* 路由代理到后端服务"
    echo "  - 需要修改服务器端 Nginx 配置"
else
    print_status "未发现问题，所有服务正常访问"
fi

echo
print_info "=== 验证命令 ==="
echo "手动验证命令："
echo "curl -I https://$UAT_DOMAIN/"
echo "curl -I https://$UAT_DOMAIN/super-admin/"
echo "curl -I https://$UAT_DOMAIN/admin/register"
echo "curl -I https://$UAT_DOMAIN/api/admin/check-auth"
echo
print_info "Jenkins 部署命令："
echo "使用 Jenkinsfile_main_frontend_uat 部署主前端到 UAT"
echo
print_info "如需帮助，请参考 DEPLOYMENT_GUIDE.md"
