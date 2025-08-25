#!/bin/bash

# Super Admin 部署验证脚本
# 用于验证 Super Admin 应用的部署状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
S3_BUCKET_NAME="jr-sigma-survey-prod"
S3_REGION="ap-southeast-2"
DOMAIN_NAME="sigma.jiangren.com.au"
SUPER_ADMIN_PATH="/super-admin"

echo -e "${BLUE}🔍 Super Admin 部署验证检查${NC}"
echo "=================================="

# 1. 检查 S3 静态网站托管
echo -e "\n${YELLOW}1. 检查 S3 静态网站托管...${NC}"
S3_WEBSITE_URL="http://${S3_BUCKET_NAME}.s3-website-${S3_REGION}.amazonaws.com${SUPER_ADMIN_PATH}"

if curl -s --head "$S3_WEBSITE_URL" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ S3 静态网站托管正常${NC}"
    echo "   URL: $S3_WEBSITE_URL"
else
    echo -e "${RED}❌ S3 静态网站托管异常${NC}"
    echo "   URL: $S3_WEBSITE_URL"
fi

# 2. 检查 S3 文件存在性
echo -e "\n${YELLOW}2. 检查 S3 文件结构...${NC}"
aws s3 ls s3://${S3_BUCKET_NAME}${SUPER_ADMIN_PATH}/ --recursive --summarize > /tmp/s3_files.txt 2>/dev/null

if [ -s /tmp/s3_files.txt ]; then
    echo -e "${GREEN}✅ S3 文件结构正常${NC}"

    # 检查关键文件
    if aws s3 ls s3://${S3_BUCKET_NAME}${SUPER_ADMIN_PATH}/index.html > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ index.html 存在${NC}"
    else
        echo -e "${RED}  ❌ index.html 不存在${NC}"
    fi

    if aws s3 ls s3://${S3_BUCKET_NAME}${SUPER_ADMIN_PATH}/assets/ > /dev/null 2>&1; then
        echo -e "${GREEN}  ✅ assets 目录存在${NC}"
    else
        echo -e "${RED}  ❌ assets 目录不存在${NC}"
    fi

    # 显示文件统计
    echo "  文件统计:"
    tail -n 1 /tmp/s3_files.txt | awk '{print "    总文件数: " $1 "    总大小: " $3 " " $4}'
else
    echo -e "${RED}❌ S3 文件结构异常或为空${NC}"
fi

# 3. 检查域名代理
echo -e "\n${YELLOW}3. 检查域名代理...${NC}"
DOMAIN_URL="https://${DOMAIN_NAME}${SUPER_ADMIN_PATH}"

if curl -s --head "$DOMAIN_URL" | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ 域名代理正常${NC}"
    echo "   URL: $DOMAIN_URL"

    # 检查是否正确代理到 S3
    RESPONSE_HEADERS=$(curl -s -I "$DOMAIN_URL")
    if echo "$RESPONSE_HEADERS" | grep -q "x-amz\|amazon"; then
        echo -e "${GREEN}  ✅ 正确代理到 S3${NC}"
    else
        echo -e "${YELLOW}  ⚠️  可能未正确代理到 S3（检查 Nginx 配置）${NC}"
    fi
else
    echo -e "${RED}❌ 域名代理异常${NC}"
    echo "   URL: $DOMAIN_URL"
    echo "   请检查 Nginx 配置和 DNS 解析"
fi

# 4. 检查 SPA 路由
echo -e "\n${YELLOW}4. 检查 SPA 路由...${NC}"
SPA_TEST_URL="${DOMAIN_URL}/dashboard"

if curl -s --head "$SPA_TEST_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ SPA 路由正常${NC}"
    echo "   测试 URL: $SPA_TEST_URL"
else
    echo -e "${RED}❌ SPA 路由异常${NC}"
    echo "   测试 URL: $SPA_TEST_URL"
    echo "   请检查 Nginx 错误处理配置"
fi

# 5. 检查静态资源
echo -e "\n${YELLOW}5. 检查静态资源缓存...${NC}"

# 尝试获取一个 CSS 或 JS 文件
ASSET_URL=$(curl -s "$S3_WEBSITE_URL" | grep -o 'assets/[^"]*\.\(css\|js\)' | head -n 1)

if [ ! -z "$ASSET_URL" ]; then
    FULL_ASSET_URL="${DOMAIN_URL%/}/$ASSET_URL"
    CACHE_HEADERS=$(curl -s -I "$FULL_ASSET_URL" | grep -i cache-control)

    if [ ! -z "$CACHE_HEADERS" ]; then
        echo -e "${GREEN}✅ 静态资源缓存已配置${NC}"
        echo "   示例文件: $ASSET_URL"
        echo "   缓存头: $CACHE_HEADERS"
    else
        echo -e "${YELLOW}⚠️  静态资源缓存未配置${NC}"
        echo "   示例文件: $ASSET_URL"
    fi
else
    echo -e "${YELLOW}⚠️  无法检测到静态资源文件${NC}"
fi

# 6. 检查 Jenkins 任务状态（如果有）
echo -e "\n${YELLOW}6. 环境检查...${NC}"

if command -v aws &> /dev/null; then
    echo -e "${GREEN}✅ AWS CLI 已安装${NC}"
    AWS_PROFILE=$(aws configure list | grep profile | awk '{print $2}')
    echo "   当前配置: ${AWS_PROFILE:-default}"
else
    echo -e "${RED}❌ AWS CLI 未安装${NC}"
fi

if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d' ' -f3)
    echo "   版本: $NGINX_VERSION"

    # 检查 Nginx 配置
    if nginx -t &> /dev/null; then
        echo -e "${GREEN}  ✅ Nginx 配置语法正确${NC}"
    else
        echo -e "${RED}  ❌ Nginx 配置语法错误${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx 未安装或不在 PATH 中${NC}"
fi

# 7. 性能测试
echo -e "\n${YELLOW}7. 简单性能测试...${NC}"

LOAD_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DOMAIN_URL")
if (( $(echo "$LOAD_TIME < 3" | bc -l) )); then
    echo -e "${GREEN}✅ 页面加载时间正常: ${LOAD_TIME}s${NC}"
else
    echo -e "${YELLOW}⚠️  页面加载时间较慢: ${LOAD_TIME}s${NC}"
fi

# 清理临时文件
rm -f /tmp/s3_files.txt

echo -e "\n${BLUE}=================================="
echo -e "🏁 部署验证检查完成${NC}"
echo
echo "如果发现问题，请参考以下文档："
echo "  - 部署文档: docs/SUPER_ADMIN_S3_DEPLOYMENT.md"
echo "  - Nginx 配置: docs/nginx-super-admin.conf"
echo
echo "常用命令："
echo "  - 重新部署: ./deploy-super-admin.sh"
echo "  - 检查 Nginx: sudo nginx -t && sudo nginx -s reload"
echo "  - 查看 S3 文件: aws s3 ls s3://${S3_BUCKET_NAME}${SUPER_ADMIN_PATH}/ --recursive"
