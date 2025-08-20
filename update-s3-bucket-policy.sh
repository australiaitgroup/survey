#!/bin/bash

# 更新 S3 桶策略脚本
# 扩展策略以支持主前端根路径访问

S3_BUCKET_NAME="uat-sigma.jiangren.com.au"

echo "🔧 更新 S3 桶策略以支持主前端和 Super Admin..."

# 创建扩展的桶策略
POLICY_FILE=$(mktemp)
cat > $POLICY_FILE <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadSuperAdmin",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}/super-admin/*"
    },
    {
      "Sid": "PublicReadMainApp",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}/*"
    }
  ]
}
EOF

echo "📝 应用新的桶策略..."
if aws s3api put-bucket-policy --bucket ${S3_BUCKET_NAME} --policy file://$POLICY_FILE; then
    echo "✅ 桶策略更新成功"
    echo "现在支持："
    echo "  - 根路径访问: arn:aws:s3:::${S3_BUCKET_NAME}/*"
    echo "  - Super Admin: arn:aws:s3:::${S3_BUCKET_NAME}/super-admin/*"
else
    echo "❌ 桶策略更新失败"
fi

# 清理临时文件
rm -f $POLICY_FILE

echo "🔍 验证当前桶策略："
aws s3api get-bucket-policy --bucket ${S3_BUCKET_NAME} --query Policy --output text | jq '.'
