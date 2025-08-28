#!/bin/bash

echo "=== Testing Super Admin Final Deployment ==="
echo "Date: $(date)"
echo

# 测试构建
echo "1. Building Super Admin..."
cd /Users/miro/JR/survey/super-admin
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo
echo "2. Checking build output..."
ls -la dist/

echo
echo "3. Testing production URLs..."

# 测试生产环境主前端
echo "Testing main frontend..."
curl -I https://sigma.jiangren.com.au/ 2>/dev/null | head -1

# 测试生产环境 Super Admin
echo "Testing Super Admin on production domain..."
curl -I https://sigma.jiangren.com.au/super-admin/ 2>/dev/null | head -1

# 测试 UAT 环境 Super Admin
echo "Testing Super Admin on UAT domain..."
curl -I https://uat-sigma.jiangren.com.au/ 2>/dev/null | head -1

echo
echo "4. S3 bucket status..."
aws s3 ls s3://sigma.jiangren.com.au/super-admin/ --region ap-southeast-2 | head -5
aws s3 ls s3://uat-sigma.jiangren.com.au/ --region ap-southeast-2 | head -5

echo
echo "=== Test Complete ==="
