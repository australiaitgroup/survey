#!/bin/bash

# Super Admin Backend 部署测试脚本
# 用于验证部署流程和配置

set -e

echo "🚀 Super Admin Backend 部署测试开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
TARGET_ENV=${1:-"uat"}
if [ "$TARGET_ENV" = "prod" ]; then
    TARGET_SERVER="ubuntu@54.153.254.26"
    TARGET_PATH="/home/ubuntu/survey-backend"
    BASE_URL="https://sigma.jiangren.com.au"
elif [ "$TARGET_ENV" = "uat" ]; then
    TARGET_SERVER="ubuntu@13.211.147.113"
    TARGET_PATH="/home/ubuntu/survey-backend"
    BASE_URL="https://uat-sigma.jiangren.com.au"
else
    echo -e "${RED}❌ 无效环境: $TARGET_ENV (支持: uat, prod)${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 部署配置:${NC}"
echo -e "  环境: $TARGET_ENV"
echo -e "  服务器: $TARGET_SERVER"
echo -e "  路径: $TARGET_PATH"
echo -e "  访问地址: $BASE_URL/super-admin/"
echo ""

# 步骤 1: 构建 Super Admin
echo -e "${YELLOW}📦 步骤 1: 构建 Super Admin...${NC}"
cd super-admin

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 未找到 package.json${NC}"
    exit 1
fi

echo "安装依赖..."
npm ci

echo "构建项目..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 构建失败，未找到 dist 目录${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"
echo ""

# 步骤 2: 检查服务器连接
echo -e "${YELLOW}🔗 步骤 2: 检查服务器连接...${NC}"
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TARGET_SERVER 'echo "连接成功"' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务器连接正常${NC}"
else
    echo -e "${RED}❌ 无法连接到服务器 $TARGET_SERVER${NC}"
    exit 1
fi
echo ""

# 步骤 3: 检查远程目录
echo -e "${YELLOW}📁 步骤 3: 检查远程目录...${NC}"
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    if [ -d '$TARGET_PATH' ]; then
        echo '✅ 后端目录存在: $TARGET_PATH'
    else
        echo '❌ 后端目录不存在: $TARGET_PATH'
        exit 1
    fi
    
    mkdir -p $TARGET_PATH/super-admin/dist
    mkdir -p $TARGET_PATH/super-admin/public
    echo '✅ Super Admin 目录已创建'
"
echo ""

# 步骤 4: 部署文件
echo -e "${YELLOW}📤 步骤 4: 部署文件...${NC}"

echo "同步 dist 目录..."
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='src' \
    --exclude='*.md' \
    dist/ $TARGET_SERVER:$TARGET_PATH/super-admin/dist/

echo "同步 public 目录..."
rsync -avz public/ $TARGET_SERVER:$TARGET_PATH/super-admin/public/

echo -e "${GREEN}✅ 文件部署完成${NC}"
echo ""

# 步骤 5: 验证文件
echo -e "${YELLOW}🔍 步骤 5: 验证远程文件...${NC}"
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    echo '检查文件结构:'
    ls -la $TARGET_PATH/super-admin/
    echo ''
    echo '检查 dist 目录:'
    ls -la $TARGET_PATH/super-admin/dist/
    echo ''
    echo '检查 public/pages 目录:'
    ls -la $TARGET_PATH/super-admin/public/pages/
"
echo ""

# 步骤 6: 重启服务
echo -e "${YELLOW}🔄 步骤 6: 重启后端服务...${NC}"
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    cd $TARGET_PATH
    echo '当前目录内容:'
    ls -la
    echo ''
    
    # 尝试重启服务
    if sudo systemctl restart survey-backend 2>/dev/null; then
        echo '✅ 使用 systemctl 重启服务成功'
    else
        echo '⚠️  systemctl 不可用，尝试手动重启...'
        sudo pkill -f 'node.*server.js' || true
        sleep 2
        nohup node server.js > server.log 2>&1 &
        echo '✅ 手动重启完成'
    fi
"

echo -e "${GREEN}✅ 服务重启完成${NC}"
echo ""

# 步骤 7: 等待服务启动
echo -e "${YELLOW}⏰ 步骤 7: 等待服务启动...${NC}"
sleep 10

# 步骤 8: 验证部署
echo -e "${YELLOW}🧪 步骤 8: 验证部署...${NC}"

echo "测试主页重定向..."
if curl -f -s -o /dev/null $BASE_URL/super-admin/; then
    echo -e "${GREEN}✅ 主页访问正常${NC}"
else
    echo -e "${RED}❌ 主页访问失败${NC}"
fi

echo "测试登录页面..."
if curl -f -s -o /dev/null $BASE_URL/super-admin/login; then
    echo -e "${GREEN}✅ 登录页面访问正常${NC}"
else
    echo -e "${RED}❌ 登录页面访问失败${NC}"
fi

echo "测试静态资源..."
if curl -f -s -o /dev/null $BASE_URL/super-admin/assets/ 2>/dev/null || curl -f -s -o /dev/null $BASE_URL/super-admin/favicon.svg; then
    echo -e "${GREEN}✅ 静态资源访问正常${NC}"
else
    echo -e "${YELLOW}⚠️  静态资源测试无法确认${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Super Admin 部署测试完成！${NC}"
echo -e "${YELLOW}📱 访问地址: $BASE_URL/super-admin/${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "  - 首次访问可能需要清理浏览器缓存"
echo -e "  - 如有问题，检查服务器日志: $TARGET_SERVER:$TARGET_PATH/server.log"
echo -e "  - 确保所有路由都返回到 index.html 以支持 SPA"
