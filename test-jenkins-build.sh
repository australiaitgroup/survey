#!/bin/bash

# 用于在本地测试Jenkins构建兼容性的脚本
echo "🧪 Testing Jenkins build compatibility locally..."

cd client

# 备份原始配置
cp postcss.config.js postcss.config.js.backup

# 使用Jenkins配置
cp postcss.config.jenkins.js postcss.config.js

# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm ci --legacy-peer-deps --ignore-scripts --production=false

# 尝试构建
echo "🔨 Attempting build with Jenkins config..."
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful with Jenkins config!"
    ls -la dist/
else
    echo "❌ Build failed with Jenkins config"
fi

# 恢复原始配置
mv postcss.config.js.backup postcss.config.js

echo "🔄 Original PostCSS config restored"
