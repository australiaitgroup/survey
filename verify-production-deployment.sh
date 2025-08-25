#!/bin/bash

# Sigma Q 生产环境部署验证脚本
# 确保主前端已正确部署到生产 S3 桶

set -e

echo "🔍 Sigma Q 生产环境部署验证"
echo "===================================="

# 配置变量
PROD_BUCKET="sigma.jiangren.com.au"
UAT_BUCKET="uat-sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"

# S3 静态网站 URL
PROD_S3_URL="http://${PROD_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"
UAT_S3_URL="http://${UAT_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"

echo ""
echo "📊 配置验证"
echo "生产桶: ${PROD_BUCKET}"
echo "UAT桶: ${UAT_BUCKET}"
echo "生产S3 URL: ${PROD_S3_URL}"
echo "UAT S3 URL: ${UAT_S3_URL}/super-admin/"

echo ""
echo "1️⃣ 检查 S3 桶状态..."

# 检查生产桶
echo "🔍 检查生产桶 ${PROD_BUCKET}..."
if aws s3api head-bucket --bucket ${PROD_BUCKET} 2>/dev/null; then
    echo "✅ 生产桶存在"

    # 检查静态网站配置
    echo "🌐 检查静态网站托管配置..."
    WEBSITE_CONFIG=$(aws s3api get-bucket-website --bucket ${PROD_BUCKET} 2>/dev/null || echo "未配置")
    if [[ "$WEBSITE_CONFIG" != "未配置" ]]; then
        echo "✅ 静态网站托管已配置"
    else
        echo "❌ 静态网站托管未配置"
    fi

    # 检查桶内容
    echo "📁 检查主前端文件..."
    FILE_COUNT=$(aws s3 ls s3://${PROD_BUCKET}/ --recursive | wc -l)
    echo "生产桶文件数量: ${FILE_COUNT}"

    # 检查 index.html
    if aws s3api head-object --bucket ${PROD_BUCKET} --key index.html >/dev/null 2>&1; then
        echo "✅ index.html 存在"
    else
        echo "❌ index.html 不存在"
    fi

else
    echo "❌ 生产桶不存在"
fi

# 检查 UAT 桶 Super Admin
echo ""
echo "🔍 检查 UAT 桶 Super Admin..."
if aws s3api head-bucket --bucket ${UAT_BUCKET} 2>/dev/null; then
    echo "✅ UAT桶存在"

    # 检查 Super Admin 文件
    SUPER_ADMIN_COUNT=$(aws s3 ls s3://${UAT_BUCKET}/super-admin/ --recursive | wc -l)
    echo "Super Admin 文件数量: ${SUPER_ADMIN_COUNT}"

    if aws s3api head-object --bucket ${UAT_BUCKET} --key super-admin/index.html >/dev/null 2>&1; then
        echo "✅ Super Admin index.html 存在"
    else
        echo "❌ Super Admin index.html 不存在"
    fi
else
    echo "❌ UAT桶不存在"
fi

echo ""
echo "2️⃣ 测试网站访问..."

# 测试生产主前端 S3 直接访问
echo "🌐 测试生产主前端 S3 直接访问..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_S3_URL} || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ 生产主前端 S3 直接访问正常 (HTTP ${HTTP_STATUS})"
    echo "   URL: ${PROD_S3_URL}"
else
    echo "❌ 生产主前端 S3 直接访问失败 (HTTP ${HTTP_STATUS})"
    echo "   URL: ${PROD_S3_URL}"
fi

# 测试 UAT Super Admin S3 直接访问
echo "🌐 测试 UAT Super Admin S3 直接访问..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${UAT_S3_URL}/super-admin/ || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ UAT Super Admin S3 直接访问正常 (HTTP ${HTTP_STATUS})"
    echo "   URL: ${UAT_S3_URL}/super-admin/"
else
    echo "❌ UAT Super Admin S3 直接访问失败 (HTTP ${HTTP_STATUS})"
    echo "   URL: ${UAT_S3_URL}/super-admin/"
fi

echo ""
echo "3️⃣ 验证域名配置..."

# 测试生产 HTTPS 域名
echo "🔐 测试生产 HTTPS 域名..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sigma.jiangren.com.au || echo "000")
if [[ "$DOMAIN_STATUS" == "200" ]]; then
    echo "✅ 生产 HTTPS 域名可访问 (HTTP ${DOMAIN_STATUS})"
    echo "   URL: https://sigma.jiangren.com.au"
else
    echo "❌ 生产 HTTPS 域名不可访问 (HTTP ${DOMAIN_STATUS})"
    echo "   URL: https://sigma.jiangren.com.au"
    echo "ℹ️  请检查 Nginx 配置和 SSL 证书"
fi

# 测试 UAT Super Admin HTTPS 域名
echo "🔐 测试 UAT Super Admin HTTPS 域名..."
UAT_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://uat-sigma.jiangren.com.au/super-admin || echo "000")
if [[ "$UAT_DOMAIN_STATUS" == "200" ]]; then
    echo "✅ UAT Super Admin HTTPS 域名可访问 (HTTP ${UAT_DOMAIN_STATUS})"
    echo "   URL: https://uat-sigma.jiangren.com.au/super-admin"
else
    echo "❌ UAT Super Admin HTTPS 域名不可访问 (HTTP ${UAT_DOMAIN_STATUS})"
    echo "   URL: https://uat-sigma.jiangren.com.au/super-admin"
    echo "ℹ️  请检查 UAT Nginx 配置和 SSL 证书"
fi

echo ""
echo "4️⃣ 检查 Nginx 配置..."

# 检查生产 Nginx 配置文件
if [[ -f "nginx-sigma-domain.conf" ]]; then
    echo "📄 找到生产 Nginx 配置文件"

    # 检查主前端代理配置
    if grep -q "sigma.jiangren.com.au.s3-website" nginx-sigma-domain.conf; then
        echo "✅ 生产 Nginx 已配置代理到生产 S3 桶"
    else
        echo "❌ 生产 Nginx 未正确配置生产 S3 代理"
    fi

    # 检查 Super Admin 代理配置
    if grep -q "uat-sigma.jiangren.com.au.s3-website.*super-admin" nginx-sigma-domain.conf; then
        echo "✅ 生产 Nginx 已配置 Super Admin 代理到 UAT"
    else
        echo "❌ 生产 Nginx 未正确配置 Super Admin UAT 代理"
    fi
else
    echo "❌ 未找到生产 Nginx 配置文件"
fi

# 检查 UAT Nginx 配置文件
if [[ -f "nginx-uat-domain.conf" ]]; then
    echo "📄 找到 UAT Nginx 配置文件"

    # 检查 UAT Super Admin 代理配置
    if grep -q "uat-sigma.jiangren.com.au.s3-website.*super-admin" nginx-uat-domain.conf; then
        echo "✅ UAT Nginx 已配置 Super Admin 代理到 UAT S3"
    else
        echo "❌ UAT Nginx 未正确配置 Super Admin 代理"
    fi
else
    echo "❌ 未找到 UAT Nginx 配置文件"
fi

echo ""
echo "📋 部署验证总结"
echo "===================================="
echo "🎯 生产主前端: 生产环境 (${PROD_BUCKET})"
echo "🔧 Super Admin: UAT环境 (${UAT_BUCKET})"
echo ""
echo "📍 关键访问地址:"
echo "   生产主前端 S3 直接访问: ${PROD_S3_URL}"
echo "   生产主前端域名访问: https://sigma.jiangren.com.au"
echo "   UAT Super Admin S3 直接访问: ${UAT_S3_URL}/super-admin/"
echo "   UAT Super Admin 域名访问: https://uat-sigma.jiangren.com.au/super-admin"
echo ""
echo "✅ 验证完成！"
echo ""
echo "📝 如果发现问题，请检查："
echo "   1. Jenkins 部署是否成功"
echo "   2. AWS 凭证是否正确"
echo "   3. S3 桶策略是否正确"
echo "   4. 生产和 UAT Nginx 配置是否正确"
echo "   5. SSL 证书是否有效"
echo "   6. DNS 解析是否指向正确服务器"
