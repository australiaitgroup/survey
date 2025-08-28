#!/bin/bash

echo "=== Checking Super Admin Deployment Status ==="
echo "Date: $(date)"
echo

echo "1. Testing UAT S3 website endpoint directly..."
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/ 2>/dev/null | head -3

echo
echo "2. Testing Production S3 website endpoint directly..."
curl -I http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/ 2>/dev/null | head -3

echo
echo "3. Testing domain access..."
echo "UAT domain:"
curl -I https://uat-sigma.jiangren.com.au/ 2>/dev/null | head -3

echo
echo "Production domain (via nginx proxy to UAT S3):"
curl -I https://sigma.jiangren.com.au/super-admin/ 2>/dev/null | head -3

echo
echo "4. Testing index.html files..."
echo "UAT S3 index.html:"
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html 2>/dev/null | head -3

echo
echo "Production S3 index.html:"
curl -I http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html 2>/dev/null | head -3

echo
echo "=== Analysis Complete ==="
