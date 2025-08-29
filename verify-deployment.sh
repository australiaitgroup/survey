#!/bin/bash

# UAT部署验证脚本
# 用于验证super-admin部署是否成功

set -e

echo "=== UAT部署验证脚本 ==="
echo "检查时间: $(date)"
echo ""

# 配置变量
CLIENT_S3_BUCKET=${CLIENT_S3_BUCKET:-"uat.sigmaq.co"}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-"ap-southeast-2"}

echo "S3 Bucket: $CLIENT_S3_BUCKET"
echo "AWS Region: $AWS_DEFAULT_REGION"
echo ""

# 检查AWS CLI是否可用
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装或不在PATH中"
    exit 1
fi

# 检查AWS凭证
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS凭证未配置或已过期"
    exit 1
fi

echo "✅ AWS CLI和凭证检查通过"
echo ""

# 检查客户端部署
echo "=== 检查客户端部署 ==="
if aws s3 ls s3://${CLIENT_S3_BUCKET}/index.html &> /dev/null; then
    echo "✅ 客户端 index.html 存在"
    CLIENT_SIZE=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/index.html --human-readable | awk '{print $3 " " $4}')
    echo "   文件大小: $CLIENT_SIZE"
else
    echo "❌ 客户端 index.html 不存在"
fi

# 检查Super Admin部署
echo ""
echo "=== 检查Super Admin部署 ==="
if aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/index.html &> /dev/null; then
    echo "✅ Super Admin index.html 存在"
    ADMIN_SIZE=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/index.html --human-readable | awk '{print $3 " " $4}')
    echo "   文件大小: $ADMIN_SIZE"
    
    # 检查Super Admin资源文件
    echo ""
    echo "=== 检查Super Admin资源文件 ==="
    if aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/assets/ &> /dev/null; then
        echo "✅ Super Admin assets目录存在"
        ASSET_COUNT=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/assets/ | wc -l)
        echo "   资源文件数量: $ASSET_COUNT"
        
        # 列出主要资源文件
        echo "   主要资源文件:"
        aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/assets/ --human-readable | head -5 | while read line; do
            echo "     $line"
        done
    else
        echo "❌ Super Admin assets目录不存在"
    fi
    
else
    echo "❌ Super Admin index.html 不存在"
fi

# 检查备份文件
echo ""
echo "=== 检查备份文件 ==="
BACKUP_COUNT=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/ | grep -c "super-admin-backup-" || echo "0")
echo "Super Admin备份数量: $BACKUP_COUNT"

if [ $BACKUP_COUNT -gt 0 ]; then
    echo "最近的备份:"
    aws s3 ls s3://${CLIENT_S3_BUCKET}/ | grep "super-admin-backup-" | tail -3 | while read line; do
        echo "  $line"
    done
fi

# 生成访问URL
echo ""
echo "=== 访问URL ==="
echo "🌐 客户端URL: https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com"
echo "🔧 Super Admin URL: https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com/super-admin"
echo ""

# 测试URL连通性（如果有curl）
if command -v curl &> /dev/null; then
    echo "=== 连通性测试 ==="
    
    CLIENT_URL="https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com"
    ADMIN_URL="https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com/super-admin"
    
    echo -n "测试客户端URL... "
    if curl -f -s --max-time 10 "$CLIENT_URL" > /dev/null 2>&1; then
        echo "✅ 可访问"
    else
        echo "❌ 无法访问"
    fi
    
    echo -n "测试Super Admin URL... "
    if curl -f -s --max-time 10 "$ADMIN_URL" > /dev/null 2>&1; then
        echo "✅ 可访问"
    else
        echo "❌ 无法访问"
    fi
fi

echo ""
echo "=== 验证完成 ==="
echo "验证时间: $(date)"