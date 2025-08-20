#!/bin/bash

# 生产环境S3桶和CloudFront配置脚本
# 用于配置 https://sigma.jiangren.com.au 域名访问

set -e

# 配置变量
BUCKET_NAME="sigma.jiangren.com.au"
DOMAIN_NAME="sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"
CLOUDFRONT_PRICE_CLASS="PriceClass_All"

echo "🚀 开始配置生产环境域名访问..."

# 1. 创建S3桶（如果不存在）
echo "📦 检查S3桶..."
if aws s3api head-bucket --bucket ${BUCKET_NAME} 2>/dev/null; then
    echo "✅ S3桶已存在: ${BUCKET_NAME}"
else
    echo "🪣 创建S3桶: ${BUCKET_NAME}"
    aws s3api create-bucket \
        --bucket ${BUCKET_NAME} \
        --region ${AWS_REGION} \
        --create-bucket-configuration LocationConstraint=${AWS_REGION}
fi

# 2. 配置桶策略
echo "🔐 配置S3桶策略..."
POLICY_FILE=$(mktemp)
cat > $POLICY_FILE <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file://$POLICY_FILE
rm -f $POLICY_FILE

# 3. 配置静态网站托管
echo "🌐 配置静态网站托管..."
aws s3 website s3://${BUCKET_NAME}/ \
    --index-document index.html \
    --error-document index.html

# 4. 配置公共访问
echo "🔓 配置公共访问设置..."
aws s3api put-public-access-block --bucket ${BUCKET_NAME} \
    --public-access-block-configuration \
    BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

# 5. 创建SSL证书（手动步骤提示）
echo "🔒 SSL证书配置提示:"
echo "   请在AWS Certificate Manager中为域名 ${DOMAIN_NAME} 申请SSL证书"
echo "   证书必须在 us-east-1 区域创建（CloudFront要求）"
echo "   完成后记录证书ARN用于CloudFront配置"

# 6. CloudFront配置提示
echo "⚡ CloudFront配置提示:"
echo "   1. 创建CloudFront Distribution"
echo "   2. Origin域名: ${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
echo "   3. 替代域名(CNAME): ${DOMAIN_NAME}"
echo "   4. SSL证书: 使用上面创建的证书"
echo "   5. 默认根对象: index.html"

echo "✅ S3桶配置完成!"
echo "📄 S3网站地址: http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com/"
echo "🔗 最终域名地址: https://${DOMAIN_NAME} (需要完成CloudFront和DNS配置)"
