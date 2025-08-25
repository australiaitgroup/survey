#!/bin/bash

# Jenkins Super Admin 部署任务触发脚本
# 使用方法: ./trigger-jenkins-deployment.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Jenkins Super Admin 部署任务触发器${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# 检查必要工具
if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}❌ 错误: curl 命令未找到，请先安装 curl${NC}"
    exit 1
fi

# 配置变量
echo -e "${YELLOW}请提供以下信息：${NC}"
echo ""

# Jenkins URL
read -p "Jenkins URL (例如: http://your-jenkins.com): " JENKINS_URL
if [[ -z "$JENKINS_URL" ]]; then
    echo -e "${RED}❌ Jenkins URL 不能为空${NC}"
    exit 1
fi

# Jenkins 用户名
read -p "Jenkins 用户名: " JENKINS_USER
if [[ -z "$JENKINS_USER" ]]; then
    echo -e "${RED}❌ Jenkins 用户名不能为空${NC}"
    exit 1
fi

# Jenkins API Token
echo -e "${YELLOW}Jenkins API Token (在 Jenkins > 用户设置 > API Token 中获取):${NC}"
read -s -p "API Token: " JENKINS_TOKEN
echo ""
if [[ -z "$JENKINS_TOKEN" ]]; then
    echo -e "${RED}❌ Jenkins API Token 不能为空${NC}"
    exit 1
fi

# 任务名称
read -p "Jenkins 任务名称 (例如: super-admin-deployment): " JOB_NAME
if [[ -z "$JOB_NAME" ]]; then
    JOB_NAME="super-admin-deployment"
    echo -e "${YELLOW}使用默认任务名称: $JOB_NAME${NC}"
fi

# Web 服务器地址
read -p "Web 服务器地址 (例如: sigma.jiangren.com.au): " WEB_SERVER_HOST
if [[ -z "$WEB_SERVER_HOST" ]]; then
    WEB_SERVER_HOST="sigma.jiangren.com.au"
    echo -e "${YELLOW}使用默认服务器地址: $WEB_SERVER_HOST${NC}"
fi

# 是否更新 Nginx
echo ""
echo -e "${YELLOW}是否需要更新 Nginx 配置？${NC}"
echo "1) 是 - 首次部署或需要更新 Nginx 配置"
echo "2) 否 - 仅更新 S3 部署"
read -p "请选择 (1 或 2): " UPDATE_NGINX_CHOICE

case $UPDATE_NGINX_CHOICE in
    1)
        UPDATE_NGINX="true"
        echo -e "${GREEN}✅ 将更新 Nginx 配置${NC}"
        ;;
    2)
        UPDATE_NGINX="false"
        echo -e "${YELLOW}⚠️  将跳过 Nginx 配置更新${NC}"
        ;;
    *)
        UPDATE_NGINX="false"
        echo -e "${YELLOW}无效选择，默认跳过 Nginx 配置更新${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}📋 部署配置确认${NC}"
echo "Jenkins URL: $JENKINS_URL"
echo "任务名称: $JOB_NAME"
echo "Web 服务器: $WEB_SERVER_HOST"
echo "更新 Nginx: $UPDATE_NGINX"
echo ""

read -p "确认以上配置并开始部署？(y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}部署已取消${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 开始触发 Jenkins 部署...${NC}"

# 构建 Jenkins API URL
BUILD_URL="$JENKINS_URL/job/$JOB_NAME/buildWithParameters"

# 构建参数
PARAMS="UPDATE_NGINX=$UPDATE_NGINX&WEB_SERVER_HOST=$WEB_SERVER_HOST"

# 发送请求
echo "发送请求到: $BUILD_URL"
echo "参数: $PARAMS"
echo ""

# 执行 Jenkins 任务触发
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BUILD_URL" \
    --user "$JENKINS_USER:$JENKINS_TOKEN" \
    --data "$PARAMS" \
    -o /tmp/jenkins_response.txt)

HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)

if [[ "$HTTP_CODE" == "201" ]] || [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}✅ Jenkins 任务已成功触发！${NC}"
    echo -e "${GREEN}HTTP 状态码: $HTTP_CODE${NC}"
    echo ""

    # 获取任务 URL
    QUEUE_URL=$(curl -s -X GET "$JENKINS_URL/job/$JOB_NAME/api/json" \
        --user "$JENKINS_USER:$JENKINS_TOKEN" | \
        grep -o '"url":"[^"]*"' | \
        head -1 | \
        sed 's/"url":"//g' | \
        sed 's/"//g')

    if [[ -n "$QUEUE_URL" ]]; then
        echo -e "${BLUE}📊 监控构建进度:${NC}"
        echo "$QUEUE_URL"
        echo ""
    fi

    echo -e "${YELLOW}📝 后续步骤:${NC}"
    echo "1. 在 Jenkins Web UI 中监控构建进度"
    echo "2. 查看构建日志确认各步骤执行状态"
    echo "3. 构建完成后验证部署结果："
    echo "   - S3 访问: http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/"
    echo "   - 域名访问: https://$WEB_SERVER_HOST/super-admin/"
    echo ""

    if [[ "$UPDATE_NGINX" == "true" ]]; then
        echo -e "${YELLOW}🔧 Nginx 配置更新说明:${NC}"
        echo "- Jenkins 会自动备份现有配置"
        echo "- 添加 Super Admin 代理配置"
        echo "- 测试配置语法并重新加载 Nginx"
        echo "- 如果失败会自动回滚到备份配置"
        echo ""
    fi

    echo -e "${GREEN}🎉 部署任务已启动！请在 Jenkins 中查看构建进度。${NC}"

else
    echo -e "${RED}❌ Jenkins 任务触发失败${NC}"
    echo -e "${RED}HTTP 状态码: $HTTP_CODE${NC}"
    echo ""

    if [[ -f "/tmp/jenkins_response.txt" ]]; then
        echo -e "${YELLOW}响应内容:${NC}"
        cat /tmp/jenkins_response.txt
        echo ""
    fi

    echo -e "${YELLOW}可能的原因:${NC}"
    echo "1. Jenkins URL 不正确"
    echo "2. 用户名或 API Token 错误"
    echo "3. 任务名称不存在"
    echo "4. 权限不足"
    echo "5. Jenkins 服务器不可达"
    echo ""

    echo -e "${YELLOW}故障排除步骤:${NC}"
    echo "1. 验证 Jenkins URL 是否正确"
    echo "2. 确认用户名和 API Token"
    echo "3. 检查任务是否存在: $JENKINS_URL/job/$JOB_NAME"
    echo "4. 尝试在浏览器中访问 Jenkins"

    exit 1
fi

# 清理临时文件
rm -f /tmp/jenkins_response.txt

echo ""
echo -e "${BLUE}💡 提示:${NC}"
echo "如果需要手动触发，也可以直接在 Jenkins Web UI 中："
echo "1. 访问: $JENKINS_URL/job/$JOB_NAME"
echo "2. 点击 'Build with Parameters'"
echo "3. 设置参数并点击 'Build'"
