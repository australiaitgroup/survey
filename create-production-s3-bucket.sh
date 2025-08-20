#!/bin/bash

# 手动创建生产 S3 桶脚本
# 创建 sigma.jiangren.com.au 桶并配置静态网站托管

set -e

# 配置变量
S3_BUCKET_NAME="sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"

echo "🪣 创建生产 S3 桶: ${S3_BUCKET_NAME}"
echo "========================================"

echo "🔍 检查桶是否已存在..."
if aws s3api head-bucket --bucket ${S3_BUCKET_NAME} 2>/dev/null; then
    echo "✅ 桶已存在"
else
    echo "🪣 创建桶 ${S3_BUCKET_NAME} 在 ${AWS_REGION}..."
    aws s3api create-bucket --bucket ${S3_BUCKET_NAME} --region ${AWS_REGION} --create-bucket-configuration LocationConstraint=${AWS_REGION}
    echo "✅ 桶创建完成"
fi

echo "🔐 配置公共访问设置..."
aws s3api put-public-access-block --bucket ${S3_BUCKET_NAME} \
    --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo "🌐 配置静态网站托管..."
aws s3 website s3://${S3_BUCKET_NAME}/ --index-document index.html --error-document index.html

echo "📝 设置桶策略..."
POLICY_FILE=$(mktemp)
cat > $POLICY_FILE <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
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

aws s3api put-bucket-policy --bucket ${S3_BUCKET_NAME} --policy file://$POLICY_FILE
rm -f $POLICY_FILE

echo "✅ S3 桶配置完成！"
echo ""
echo "📄 桶信息："
echo "桶名: ${S3_BUCKET_NAME}"
echo "区域: ${AWS_REGION}"
echo "静态网站URL: http://${S3_BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com/"
echo ""
echo "🎯 现在可以运行 Jenkins 部署任务来上传主前端文件"
