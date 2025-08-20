#!/bin/bash

# Super Admin 部署故障排除脚本
# 使用方法: ./troubleshoot-deployment.sh [your-server-address]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认服务器地址
DEFAULT_SERVER="sigma.jiangren.com.au"
SERVER_HOST=${1:-$DEFAULT_SERVER}

echo -e "${BLUE}🔍 Super Admin 部署故障排除工具${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "服务器地址: ${YELLOW}$SERVER_HOST${NC}"
echo ""

# 函数：检查项目
check_item() {
    local description="$1"
    local command="$2"
    local success_msg="$3"
    local error_msg="$4"

    echo -n "🔍 检查 $description... "

    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $success_msg${NC}"
        return 0
    else
        echo -e "${RED}❌ $error_msg${NC}"
        return 1
    fi
}

# 函数：执行命令并显示结果
run_check() {
    local description="$1"
    local command="$2"

    echo -e "${BLUE}📋 $description${NC}"
    echo "执行命令: $command"
    echo "结果:"

    if eval "$command"; then
        echo -e "${GREEN}✅ 成功${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
    fi
    echo ""
}

echo -e "${YELLOW}第一步：基础连通性检查${NC}"
echo "----------------------------------------"

# 检查网络连通性
check_item "网络连通性" "ping -c 1 $SERVER_HOST" "网络连接正常" "无法连接到服务器"

# 检查 SSH 端口
check_item "SSH 端口 (22)" "nc -z $SERVER_HOST 22" "SSH 端口开放" "SSH 端口不可达"

# 检查 HTTP 端口
check_item "HTTP 端口 (80)" "nc -z $SERVER_HOST 80" "HTTP 端口开放" "HTTP 端口不可达"

# 检查 HTTPS 端口
check_item "HTTPS 端口 (443)" "nc -z $SERVER_HOST 443" "HTTPS 端口开放" "HTTPS 端口不可达"

echo ""
echo -e "${YELLOW}第二步：S3 直接访问检查${NC}"
echo "----------------------------------------"

S3_ENDPOINT="http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com"

# 检查 S3 桶访问
run_check "S3 桶根目录访问" "curl -I $S3_ENDPOINT"

# 检查 Super Admin 目录
run_check "Super Admin 目录访问" "curl -I $S3_ENDPOINT/super-admin/"

# 检查 index.html
run_check "index.html 文件访问" "curl -I $S3_ENDPOINT/super-admin/index.html"

echo -e "${YELLOW}第三步：域名代理访问检查${NC}"
echo "----------------------------------------"

# 检查域名根目录
run_check "域名根目录访问" "curl -I https://$SERVER_HOST/"

# 检查 Super Admin 代理
run_check "Super Admin 代理访问" "curl -I https://$SERVER_HOST/super-admin/"

# 检查 SPA 路由
run_check "SPA 路由测试" "curl -I https://$SERVER_HOST/super-admin/test-route"

echo -e "${YELLOW}第四步：SSL 证书检查${NC}"
echo "----------------------------------------"

# 检查 SSL 证书
if command -v openssl >/dev/null 2>&1; then
    run_check "SSL 证书信息" "echo | openssl s_client -connect $SERVER_HOST:443 -servername $SERVER_HOST 2>/dev/null | openssl x509 -noout -dates"
else
    echo "⚠️  openssl 命令不可用，跳过 SSL 检查"
fi

echo -e "${YELLOW}第五步：响应时间测试${NC}"
echo "----------------------------------------"

# 测试响应时间
run_check "域名响应时间测试" "curl -o /dev/null -s -w 'Time: %{time_total}s\nStatus: %{http_code}\n' https://$SERVER_HOST/super-admin/"

echo -e "${YELLOW}第六步：DNS 解析检查${NC}"
echo "----------------------------------------"

# DNS 解析检查
run_check "DNS 解析测试" "nslookup $SERVER_HOST"

echo ""
echo -e "${BLUE}🔍 故障排除建议${NC}"
echo "================================"

echo -e "${YELLOW}如果 S3 访问失败：${NC}"
echo "1. 检查 S3 桶策略是否允许公开读取"
echo "2. 确认静态网站托管已启用"
echo "3. 验证文件是否正确上传到 S3"
echo ""

echo -e "${YELLOW}如果域名代理失败：${NC}"
echo "1. 检查 Nginx 配置是否正确"
echo "2. 验证 Jenkins SSH 凭据配置"
echo "3. 确认服务器用户有 sudo 权限"
echo ""

echo -e "${YELLOW}如果 SSL 证书问题：${NC}"
echo "1. 检查证书是否过期"
echo "2. 验证证书域名匹配"
echo "3. 确认 SSL 配置正确"
echo ""

echo -e "${YELLOW}手动 SSH 连接测试：${NC}"
echo "ssh your-username@$SERVER_HOST"
echo ""

echo -e "${YELLOW}手动 Nginx 配置检查：${NC}"
echo "sudo nginx -t"
echo "sudo systemctl status nginx"
echo ""

echo -e "${YELLOW}查看 Nginx 日志：${NC}"
echo "sudo tail -f /var/log/nginx/error.log"
echo "sudo tail -f /var/log/nginx/access.log"
echo ""

echo -e "${GREEN}故障排除完成！${NC}"
echo "如果问题仍然存在，请查看详细的部署文档或联系技术支持。"
