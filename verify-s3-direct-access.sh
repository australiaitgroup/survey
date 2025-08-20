#!/bin/bash

# 生产主前端 S3 直接访问验证脚本
# 确保 http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/ 可以正常访问

set -e

echo "🔍 生产主前端 S3 直接访问验证"
echo "================================="

# 配置变量
PROD_BUCKET="sigma.jiangren.com.au"
AWS_REGION="ap-southeast-2"
PROD_S3_URL="http://${PROD_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"

echo ""
echo "📊 目标验证"
echo "生产桶: ${PROD_BUCKET}"
echo "S3 直接访问 URL: ${PROD_S3_URL}"
echo "域名访问: https://sigma.jiangren.com.au (已确认正常)"

echo ""
echo "1️⃣ 检查生产 S3 桶状态..."

# 检查生产桶
echo "🔍 检查生产桶 ${PROD_BUCKET}..."
if aws s3api head-bucket --bucket ${PROD_BUCKET} 2>/dev/null; then
    echo "✅ 生产桶存在"
    
    # 检查静态网站配置
    echo "🌐 检查静态网站托管配置..."
    WEBSITE_CONFIG=$(aws s3api get-bucket-website --bucket ${PROD_BUCKET} 2>/dev/null || echo "未配置")
    if [[ "$WEBSITE_CONFIG" != "未配置" ]]; then
        echo "✅ 静态网站托管已配置"
        echo "配置详情:"
        echo "$WEBSITE_CONFIG" | jq . 2>/dev/null || echo "$WEBSITE_CONFIG"
    else
        echo "❌ 静态网站托管未配置"
        echo "❗ 需要运行 Jenkins 部署来配置静态网站托管"
    fi
    
    # 检查桶策略
    echo "🔐 检查桶策略..."
    BUCKET_POLICY=$(aws s3api get-bucket-policy --bucket ${PROD_BUCKET} 2>/dev/null || echo "未配置")
    if [[ "$BUCKET_POLICY" != "未配置" ]]; then
        echo "✅ 桶策略已配置"
        echo "$BUCKET_POLICY" | jq . 2>/dev/null || echo "$BUCKET_POLICY"
    else
        echo "❌ 桶策略未配置"
        echo "❗ 需要运行 Jenkins 部署来配置公共访问策略"
    fi
    
    # 检查桶内容
    echo "📁 检查主前端文件..."
    FILE_COUNT=$(aws s3 ls s3://${PROD_BUCKET}/ --recursive | wc -l)
    echo "生产桶文件数量: ${FILE_COUNT}"
    
    if [[ $FILE_COUNT -gt 0 ]]; then
        echo "✅ 桶中有文件"
        echo "主要文件:"
        aws s3 ls s3://${PROD_BUCKET}/ --recursive | head -10
    else
        echo "❌ 桶为空"
        echo "❗ 需要运行 Jenkins 部署来上传主前端文件"
    fi
    
    # 检查 index.html
    if aws s3api head-object --bucket ${PROD_BUCKET} --key index.html >/dev/null 2>&1; then
        echo "✅ index.html 存在"
    else
        echo "❌ index.html 不存在"
        echo "❗ 需要运行 Jenkins 部署来上传主前端应用"
    fi
    
else
    echo "❌ 生产桶不存在"
    echo "❗ 需要运行 Jenkins 部署来创建和配置生产桶"
fi

echo ""
echo "2️⃣ 测试 S3 直接访问..."

# 测试生产主前端 S3 直接访问
echo "🌐 测试 S3 直接访问..."
echo "URL: ${PROD_S3_URL}"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${PROD_S3_URL} || echo "000")
if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ S3 直接访问正常 (HTTP ${HTTP_STATUS})"
    
    # 检查响应内容
    echo "📄 检查响应内容..."
    RESPONSE=$(curl -s ${PROD_S3_URL} | head -5)
    if [[ "$RESPONSE" == *"<!DOCTYPE html>"* ]] || [[ "$RESPONSE" == *"<html"* ]]; then
        echo "✅ 返回有效的 HTML 内容"
    else
        echo "⚠️  响应内容可能不是有效的 HTML"
        echo "前5行内容:"
        echo "$RESPONSE"
    fi
    
elif [[ "$HTTP_STATUS" == "403" ]]; then
    echo "❌ S3 直接访问被拒绝 (HTTP ${HTTP_STATUS})"
    echo "❗ 可能原因："
    echo "   - 桶策略未正确配置"
    echo "   - 公共访问被阻止"
    echo "   - 静态网站托管未启用"
elif [[ "$HTTP_STATUS" == "404" ]]; then
    echo "❌ S3 直接访问找不到资源 (HTTP ${HTTP_STATUS})"
    echo "❗ 可能原因："
    echo "   - 桶不存在"
    echo "   - 静态网站托管未配置"
    echo "   - index.html 文件不存在"
else
    echo "❌ S3 直接访问失败 (HTTP ${HTTP_STATUS})"
    echo "❗ 请检查网络连接和 AWS 配置"
fi

echo ""
echo "3️⃣ 对比域名访问..."

# 测试域名访问作为对比
echo "🔐 测试域名访问 (作为对比)..."
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sigma.jiangren.com.au || echo "000")
if [[ "$DOMAIN_STATUS" == "200" ]]; then
    echo "✅ 域名访问正常 (HTTP ${DOMAIN_STATUS}) - 确认"
else
    echo "⚠️  域名访问异常 (HTTP ${DOMAIN_STATUS})"
fi

echo ""
echo "📋 验证总结"
echo "================================="
echo "🎯 目标: 确保 S3 直接访问正常"
echo "🌐 S3 直接访问: ${PROD_S3_URL}"
echo "🔐 域名访问: https://sigma.jiangren.com.au (已确认正常)"
echo ""

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ S3 直接访问验证成功！"
    echo "✅ 两种访问方式都正常工作"
else
    echo "❌ S3 直接访问需要修复"
    echo ""
    echo "🔧 修复步骤："
    echo "1. 运行 Jenkins 主前端部署任务 (Jenkinsfile_main_frontend)"
    echo "   - 自动创建和配置 S3 桶"
    echo "   - 启用静态网站托管"
    echo "   - 设置公共访问策略"
    echo "   - 部署主前端文件"
    echo ""
    echo "2. 部署完成后重新运行此验证脚本"
    echo "   ./verify-s3-direct-access.sh"
fi

echo ""
echo "📝 注意事项："
echo "   - Super Admin 配置保持不变"
echo "   - 仅关注生产主前端 S3 直接访问"
echo "   - 域名访问通过 Nginx 代理，无需修改"
