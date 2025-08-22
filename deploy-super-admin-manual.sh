#!/bin/bash

# Super Admin 手动部署脚本
# 用于无 Nginx 权限时，直接部署到后端服务器

set -e

TARGET_ENV=${1:-"uat"}
FORCE_DEPLOY=${2:-"false"}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Super Admin 手动部署工具${NC}"
echo ""

# 环境配置
if [ "$TARGET_ENV" = "prod" ]; then
    TARGET_SERVER="ubuntu@54.153.254.26"
    TARGET_PATH="/home/ubuntu/survey-backend"
    BASE_URL="https://sigma.jiangren.com.au"
    ENV_NAME="生产环境"
elif [ "$TARGET_ENV" = "uat" ]; then
    TARGET_SERVER="ubuntu@13.211.147.113"
    TARGET_PATH="/home/ubuntu/survey-backend"
    BASE_URL="https://uat-sigma.jiangren.com.au"
    ENV_NAME="UAT环境"
else
    echo -e "${RED}❌ 无效环境: $TARGET_ENV${NC}"
    echo "用法: $0 [uat|prod] [force]"
    echo "  force: 跳过确认提示"
    exit 1
fi

echo -e "${YELLOW}📋 部署配置:${NC}"
echo -e "  环境: $ENV_NAME ($TARGET_ENV)"
echo -e "  服务器: $TARGET_SERVER"
echo -e "  路径: $TARGET_PATH"
echo -e "  访问地址: $BASE_URL/super-admin/"
echo ""

# 确认部署
if [ "$FORCE_DEPLOY" != "force" ]; then
    echo -e "${YELLOW}⚠️  确认要部署到 $ENV_NAME 吗？${NC}"
    echo "这将："
    echo "  1. 构建 Super Admin 前端"
    echo "  2. 上传文件到服务器"
    echo "  3. 重启后端服务"
    echo ""
    read -p "继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
fi

# 步骤 1: 构建前端
echo -e "${YELLOW}📦 步骤 1: 构建 Super Admin...${NC}"
cd super-admin

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 未找到 package.json，请在 super-admin 目录下运行${NC}"
    exit 1
fi

echo "🔧 安装依赖..."
npm ci --silent

echo "🏗️  构建项目..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ 构建失败，未找到 dist/index.html${NC}"
    exit 1
fi

echo "📊 构建结果:"
ls -la dist/
echo -e "${GREEN}✅ 构建完成${NC}"
echo ""

# 步骤 2: 检查服务器连接
echo -e "${YELLOW}🔗 步骤 2: 检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TARGET_SERVER 'echo "连接成功"' > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到服务器 $TARGET_SERVER${NC}"
    echo "请检查:"
    echo "  - SSH 密钥配置"
    echo "  - 服务器是否在线"
    echo "  - 网络连接"
    exit 1
fi
echo -e "${GREEN}✅ 服务器连接正常${NC}"
echo ""

# 步骤 3: 部署文件
echo -e "${YELLOW}📤 步骤 3: 部署文件...${NC}"

echo "🗂️  创建远程目录..."
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    mkdir -p $TARGET_PATH/super-admin/dist
    echo '目录创建完成'
"

echo "📁 同步构建文件..."
rsync -avz --progress --delete \
    --exclude='*.map' \
    dist/ $TARGET_SERVER:$TARGET_PATH/super-admin/dist/

echo "📋 验证上传文件..."
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    echo '远程文件结构:'
    ls -la $TARGET_PATH/super-admin/dist/
    echo ''
    echo '验证关键文件:'
    test -f $TARGET_PATH/super-admin/dist/index.html && echo '✅ index.html 存在' || echo '❌ index.html 缺失'
    test -d $TARGET_PATH/super-admin/dist/assets && echo '✅ assets 目录存在' || echo '❌ assets 目录缺失'
"

echo -e "${GREEN}✅ 文件部署完成${NC}"
echo ""

# 步骤 4: 更新 server.js (如果需要)
echo -e "${YELLOW}🔄 步骤 4: 检查 server.js 配置...${NC}"
cd ..  # 回到项目根目录

# 上传修正后的 server.js
echo "📤 更新 server.js..."
scp -o StrictHostKeyChecking=no server.js $TARGET_SERVER:$TARGET_PATH/

echo -e "${GREEN}✅ server.js 已更新${NC}"
echo ""

# 步骤 5: 重启服务
echo -e "${YELLOW}🔄 步骤 5: 重启后端服务...${NC}"
ssh -o StrictHostKeyChecking=no $TARGET_SERVER "
    cd $TARGET_PATH

    echo '当前进程:'
    ps aux | grep -E 'node.*server' | grep -v grep || echo '未找到运行中的 Node 进程'
    echo ''

    # 设置环境变量并重启
    export NODE_ENV=production

    echo '尝试重启服务...'
    if sudo systemctl restart survey-backend 2>/dev/null; then
        echo '✅ 使用 systemctl 重启成功'
    else
        echo '⚠️  systemctl 不可用，手动重启...'
        # 停止现有进程
        sudo pkill -f 'node.*server.js' || true
        sleep 3

        # 启动新进程
        echo '启动新的 Node 进程...'
        nohup node server.js > server.log 2>&1 &
        sleep 2

        # 检查进程是否启动成功
        if pgrep -f 'node.*server.js' > /dev/null; then
            echo '✅ 手动重启成功'
        else
            echo '❌ 服务启动失败，请检查日志'
            tail -10 server.log
            exit 1
        fi
    fi
"

echo -e "${GREEN}✅ 服务重启完成${NC}"
echo ""

# 步骤 6: 验证部署
echo -e "${YELLOW}🧪 步骤 6: 验证部署...${NC}"
echo "⏰ 等待服务启动..."
sleep 15

echo "🔍 测试访问..."

# 测试主页
echo -n "  主页 ($BASE_URL/super-admin/): "
if curl -f -s -o /dev/null $BASE_URL/super-admin/; then
    echo -e "${GREEN}✅ 正常${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

# 测试登录页面
echo -n "  登录页面 ($BASE_URL/super-admin/login): "
if curl -f -s -o /dev/null $BASE_URL/super-admin/login; then
    echo -e "${GREEN}✅ 正常${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

# 测试其他路由 (SPA)
echo -n "  SPA 路由 ($BASE_URL/super-admin/dashboard): "
if curl -f -s -o /dev/null $BASE_URL/super-admin/dashboard; then
    echo -e "${GREEN}✅ 正常${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
fi

# 测试静态资源
echo -n "  静态资源: "
if curl -f -s -o /dev/null $BASE_URL/super-admin/assets/ 2>/dev/null || curl -f -s -I $BASE_URL/super-admin/ | grep -q "200\|304"; then
    echo -e "${GREEN}✅ 正常${NC}"
else
    echo -e "${YELLOW}⚠️  无法确认${NC}"
fi

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${BLUE}📱 访问地址: $BASE_URL/super-admin/${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "  - 首次访问建议清理浏览器缓存"
echo -e "  - 如有问题，检查服务器日志: ssh $TARGET_SERVER 'tail -f $TARGET_PATH/server.log'"
echo -e "  - SPA 路由现在应该正常工作"
echo ""
echo -e "${BLUE}🔧 如需再次部署，运行:${NC}"
echo -e "  $0 $TARGET_ENV force  # 跳过确认"
