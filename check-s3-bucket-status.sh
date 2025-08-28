#!/bin/bash

# 检查现有 S3 桶状态脚本
# 用于分析 uat-sigma.jiangren.com.au 桶的当前状态

S3_BUCKET_NAME="uat-sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"

echo "🔍 检查 S3 桶: ${S3_BUCKET_NAME}"
echo "=================================="

# 1. 检查桶是否存在
echo "1. 桶存在性检查..."
if aws s3api head-bucket --bucket ${S3_BUCKET_NAME} 2>/dev/null; then
    echo "✅ 桶存在"
else
    echo "❌ 桶不存在或无访问权限"
    exit 1
fi

# 2. 检查桶内容
echo
echo "2. 桶内容检查..."
echo "当前文件列表:"
aws s3 ls s3://${S3_BUCKET_NAME}/ --recursive

# 3. 检查静态网站托管配置
echo
echo "3. 静态网站托管配置..."
if aws s3api get-bucket-website --bucket ${S3_BUCKET_NAME} 2>/dev/null; then
    echo "✅ 静态网站托管已启用"
else
    echo "⚠️  静态网站托管未启用"
fi

# 4. 检查桶策略
echo
echo "4. 桶策略检查..."
if aws s3api get-bucket-policy --bucket ${S3_BUCKET_NAME} 2>/dev/null; then
    echo "✅ 桶策略已设置"
else
    echo "⚠️  桶策略未设置"
fi

# 5. 检查公开访问配置
echo
echo "5. 公开访问块配置..."
aws s3api get-public-access-block --bucket ${S3_BUCKET_NAME} 2>/dev/null || echo "⚠️  无公开访问块配置"

# 6. 检查网站端点访问性
echo
echo "6. 网站端点测试..."
WEBSITE_URL="http://${S3_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
echo "测试 URL: ${WEBSITE_URL}"

if curl -s -I "${WEBSITE_URL}" | head -1 | grep -q "200\|403\|404"; then
    echo "✅ 网站端点可访问"
    echo "响应状态:"
    curl -s -I "${WEBSITE_URL}" | head -5
else
    echo "❌ 网站端点不可访问"
fi

echo
echo "=================================="
echo "📊 检查完成！"
echo
echo "📝 分析建议："
echo "1. 如果桶内有重要文件，请先备份"
echo "2. 确认桶策略是否需要扩展以支持根路径访问"
echo "3. 如果静态网站托管未启用，需要配置"
echo "4. 主前端部署到根路径(/)，Super Admin 部署到 /super-admin/"
