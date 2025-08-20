#!/bin/bash

# Super Admin 双环境访问验证脚本
# 验证 UAT 和生产环境的 Super Admin 访问

set -e

echo "🔍 Super Admin 双环境访问验证"
echo "================================="

# 配置变量
S3_BUCKET_UAT="uat-sigma.jiangren.com.au"
S3_BUCKET_PROD="sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"

# S3 URL
UAT_S3_URL="http://${S3_BUCKET_UAT}.s3-website-${AWS_REGION}.amazonaws.com/super-admin"
PROD_S3_URL="http://${S3_BUCKET_PROD}.s3-website-${AWS_REGION}.amazonaws.com/super-admin"

echo ""
echo "📊 目标验证"
echo "UAT S3 直接访问: ${UAT_S3_URL}"
echo "生产 S3 直接访问: ${PROD_S3_URL}"
echo "UAT 域名访问: https://uat-sigma.jiangren.com.au/super-admin"
echo "生产域名访问: https://sigma.jiangren.com.au/super-admin"

echo ""
echo "1️⃣ 检查 S3 桶中的 Super Admin 文件..."

# 检查 UAT 桶
echo "🔍 检查 UAT 桶 Super Admin..."
if aws s3api head-bucket --bucket ${S3_BUCKET_UAT} 2>/dev/null; then
    echo "✅ UAT 桶存在"
    UAT_SUPER_ADMIN_COUNT=$(aws s3 ls s3://${S3_BUCKET_UAT}/super-admin/ --recursive 2>/dev/null | wc -l || echo "0")
    if [[ $UAT_SUPER_ADMIN_COUNT -gt 0 ]]; then
        echo "✅ UAT Super Admin 文件存在 (${UAT_SUPER_ADMIN_COUNT} 个文件)"
        aws s3 ls s3://${S3_BUCKET_UAT}/super-admin/ | head -5
    else
        echo "❌ UAT Super Admin 文件不存在"
    fi
else
    echo "❌ UAT 桶不存在"
fi

# 检查生产桶
echo ""
echo "🔍 检查生产桶 Super Admin..."
if aws s3api head-bucket --bucket ${S3_BUCKET_PROD} 2>/dev/null; then
    echo "✅ 生产桶存在"
    PROD_SUPER_ADMIN_COUNT=$(aws s3 ls s3://${S3_BUCKET_PROD}/super-admin/ --recursive 2>/dev/null | wc -l || echo "0")
    if [[ $PROD_SUPER_ADMIN_COUNT -gt 0 ]]; then
        echo "✅ 生产 Super Admin 文件存在 (${PROD_SUPER_ADMIN_COUNT} 个文件)"
        aws s3 ls s3://${S3_BUCKET_PROD}/super-admin/ | head -5
    else
        echo "❌ 生产 Super Admin 文件不存在"
        echo "❗ 需要运行 Jenkins Super Admin 部署任务"
    fi
else
    echo "❌ 生产桶不存在"
fi

echo ""
echo "2️⃣ 测试 S3 直接访问..."

# 测试 UAT S3 直接访问
echo "🌐 测试 UAT S3 直接访问..."
UAT_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${UAT_S3_URL} || echo "000")
if [[ "$UAT_HTTP_STATUS" == "200" ]]; then
    echo "✅ UAT S3 直接访问正常 (HTTP ${UAT_HTTP_STATUS})"
else
    echo "❌ UAT S3 直接访问失败 (HTTP ${UAT_HTTP_STATUS})"
fi

# 测试生产 S3 直接访问
echo "🌐 测试生产 S3 直接访问..."
PROD_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_S3_URL} || echo "000")
if [[ "$PROD_HTTP_STATUS" == "200" ]]; then
    echo "✅ 生产 S3 直接访问正常 (HTTP ${PROD_HTTP_STATUS})"
else
    echo "❌ 生产 S3 直接访问失败 (HTTP ${PROD_HTTP_STATUS})"
fi

echo ""
echo "3️⃣ 测试域名访问..."

# 测试 UAT 域名访问
echo "🔐 测试 UAT 域名访问..."
UAT_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://uat-sigma.jiangren.com.au/super-admin || echo "000")
if [[ "$UAT_DOMAIN_STATUS" == "200" ]]; then
    echo "✅ UAT 域名访问正常 (HTTP ${UAT_DOMAIN_STATUS})"
else
    echo "❌ UAT 域名访问失败 (HTTP ${UAT_DOMAIN_STATUS})"
fi

# 测试生产域名访问
echo "🔐 测试生产域名访问..."
PROD_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sigma.jiangren.com.au/super-admin || echo "000")
if [[ "$PROD_DOMAIN_STATUS" == "200" ]]; then
    echo "✅ 生产域名访问正常 (HTTP ${PROD_DOMAIN_STATUS})"
else
    echo "❌ 生产域名访问失败 (HTTP ${PROD_DOMAIN_STATUS})"
    echo "ℹ️  可能原因："
    echo "   - Super Admin 文件未部署到生产桶"
    echo "   - 生产 Nginx 未配置 /super-admin/ 代理"
fi

echo ""
echo "📋 验证总结"
echo "================================="
echo "🎯 目标: 确保两个环境的 Super Admin 都能访问"
echo ""
echo "✅ 访问地址："
echo "   UAT S3: ${UAT_S3_URL}"
echo "   生产 S3: ${PROD_S3_URL}"
echo "   UAT 域名: https://uat-sigma.jiangren.com.au/super-admin"
echo "   生产域名: https://sigma.jiangren.com.au/super-admin"
echo ""

# 最终状态
if [[ "$PROD_HTTP_STATUS" == "200" || "$PROD_DOMAIN_STATUS" == "200" ]]; then
    echo "✅ 生产 Super Admin 访问验证成功！"
else
    echo "❌ 生产 Super Admin 需要部署"
    echo ""
    echo "🔧 解决方案："
    echo "1. 运行 Jenkins Super Admin 部署任务 (Jenkinsfile_super_admin)"
    echo "   - 现在会同时部署到 UAT 和生产桶"
    echo "2. 部署完成后重新运行此验证脚本"
    echo "   ./verify-super-admin-access.sh"
fi

echo ""
echo "📝 注意事项："
echo "   - 生产域名访问依赖 Nginx 配置"
echo "   - S3 直接访问不依赖 Nginx"
echo "   - 如果生产域名访问失败但 S3 直接访问成功，说明 Nginx 需要配置"
