#!/bin/bash

echo "=== 修复 S3 静态网站托管配置 ==="
echo "Date: $(date)"
echo

BUCKET_NAME="uat-sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"

echo "1. 当前 S3 网站配置..."
aws s3api get-bucket-website --bucket $BUCKET_NAME --region $AWS_REGION 2>/dev/null || echo "未配置网站托管"

echo
echo "2. 配置 S3 静态网站托管（错误文档指向 index.html）..."
aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document index.html --region $AWS_REGION

echo
echo "3. 验证配置..."
aws s3api get-bucket-website --bucket $BUCKET_NAME --region $AWS_REGION

echo
echo "4. 测试 SPA 路由..."
echo "测试 /super-admin/login:"
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/login 2>/dev/null | head -2

echo
echo "测试 /super-admin/dashboard:"
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/dashboard 2>/dev/null | head -2

echo
echo "=== 修复完成 ==="
echo "现在尝试访问: https://uat-sigma.jiangren.com.au/super-admin/"
echo "如果还是不行，请清除浏览器缓存后重试"
