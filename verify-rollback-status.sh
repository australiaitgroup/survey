#!/bin/bash

echo "=== 验证 Jenkinsfile_super_admin 回滚状态 ==="
echo "Date: $(date)"
echo

echo "1. 检查环境变量配置..."
grep -A 5 "environment {" Jenkinsfile_super_admin

echo
echo "2. 检查当前 UAT S3 桶访问状态..."
echo "直接 S3 访问:"
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/ 2>/dev/null | head -2

echo
echo "UAT 域名访问:"
curl -I https://uat-sigma.jiangren.com.au/super-admin/ 2>/dev/null | head -2

echo
echo "3. 检查 S3 桶内容..."
curl -s http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html | grep -E "(DOCTYPE|title)" | head -2

echo
echo "=== 回滚验证完成 ==="
echo "配置已回滚到使用单一 S3_BUCKET_NAME = 'uat-sigma.jiangren.com.au'"
