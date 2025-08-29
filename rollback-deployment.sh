#!/bin/bash

# UAT部署回滚脚本
# 用于在部署失败时快速回滚到之前的版本

set -e

echo "=== UAT部署回滚脚本 ==="
echo "执行时间: $(date)"
echo ""

# 配置变量
CLIENT_S3_BUCKET=${CLIENT_S3_BUCKET:-"uat.sigmaq.co"}
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-"ap-southeast-2"}

echo "S3 Bucket: $CLIENT_S3_BUCKET"
echo "AWS Region: $AWS_DEFAULT_REGION"
echo ""

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 [backup-timestamp]"
    echo ""
    echo "可用的备份:"
    aws s3 ls s3://${CLIENT_S3_BUCKET}/ | grep "super-admin-backup-" | tail -10
    echo ""
    echo "示例: $0 20231201-143022"
    exit 1
fi

BACKUP_TIMESTAMP=$1
BACKUP_PREFIX="super-admin-backup-${BACKUP_TIMESTAMP}"

echo "准备回滚到备份: $BACKUP_PREFIX"
echo ""

# 检查备份是否存在
echo "=== 检查备份存在性 ==="
if aws s3 ls s3://${CLIENT_S3_BUCKET}/${BACKUP_PREFIX}/ &> /dev/null; then
    echo "✅ 找到备份: $BACKUP_PREFIX"
    
    # 显示备份内容
    echo ""
    echo "备份内容:"
    aws s3 ls s3://${CLIENT_S3_BUCKET}/${BACKUP_PREFIX}/ --recursive --human-readable | head -10
else
    echo "❌ 未找到备份: $BACKUP_PREFIX"
    echo ""
    echo "可用的备份:"
    aws s3 ls s3://${CLIENT_S3_BUCKET}/ | grep "super-admin-backup-"
    exit 1
fi

# 确认回滚操作
echo ""
read -p "确认要回滚到 $BACKUP_PREFIX 吗？这将覆盖当前的Super Admin部署 (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "回滚操作已取消"
    exit 0
fi

# 创建当前部署的紧急备份
echo ""
echo "=== 创建当前部署的紧急备份 ==="
EMERGENCY_BACKUP="super-admin-emergency-backup-$(date +%Y%m%d-%H%M%S)"
aws s3 sync s3://${CLIENT_S3_BUCKET}/super-admin/ s3://${CLIENT_S3_BUCKET}/${EMERGENCY_BACKUP}/ || echo "当前部署可能不存在，跳过紧急备份"
echo "紧急备份已创建: $EMERGENCY_BACKUP"

# 执行回滚
echo ""
echo "=== 执行回滚操作 ==="
echo "从 s3://${CLIENT_S3_BUCKET}/${BACKUP_PREFIX}/ 回滚到 s3://${CLIENT_S3_BUCKET}/super-admin/"

# 清空当前super-admin目录
aws s3 rm s3://${CLIENT_S3_BUCKET}/super-admin/ --recursive || echo "当前目录可能为空"

# 从备份恢复
aws s3 sync s3://${CLIENT_S3_BUCKET}/${BACKUP_PREFIX}/ s3://${CLIENT_S3_BUCKET}/super-admin/

echo "✅ 回滚完成"

# 验证回滚结果
echo ""
echo "=== 验证回滚结果 ==="
if aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/index.html &> /dev/null; then
    echo "✅ Super Admin index.html 已恢复"
    
    # 检查文件大小和时间戳
    FILE_INFO=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/index.html --human-readable)
    echo "   文件信息: $FILE_INFO"
else
    echo "❌ 回滚失败，index.html 不存在"
    exit 1
fi

# 检查资源文件
if aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/assets/ &> /dev/null; then
    ASSET_COUNT=$(aws s3 ls s3://${CLIENT_S3_BUCKET}/super-admin/assets/ | wc -l)
    echo "✅ 资源文件已恢复 (数量: $ASSET_COUNT)"
else
    echo "⚠️  资源文件目录不存在或为空"
fi

# 生成访问URL
echo ""
echo "=== 回滚完成信息 ==="
echo "🔧 Super Admin URL: https://${CLIENT_S3_BUCKET}.s3-website-${AWS_DEFAULT_REGION}.amazonaws.com/super-admin"
echo "📦 使用的备份: $BACKUP_PREFIX"
echo "🚨 紧急备份: $EMERGENCY_BACKUP (如需要可用于再次回滚)"
echo "⏰ 回滚时间: $(date)"
echo ""
echo "请测试Super Admin功能以确保回滚成功！"