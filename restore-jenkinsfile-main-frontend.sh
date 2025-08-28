#!/bin/bash

# 恢复 Jenkinsfile_main_frontend 的 S3 部署命令
# 用于测试完成后启用实际部署

JENKINSFILE="Jenkinsfile_main_frontend"

echo "🔄 恢复 $JENKINSFILE 中的 S3 部署命令..."

# 恢复第一个 aws s3 sync 命令
sed -i '' 's|# aws s3 sync dist/ s3://${S3_BUCKET_NAME}/ \\|aws s3 sync dist/ s3://${S3_BUCKET_NAME}/ \\|g' "$JENKINSFILE"
sed -i '' 's|#     --region ${AWS_REGION} \\|                                --region ${AWS_REGION} \\|g' "$JENKINSFILE"
sed -i '' 's|#     --delete \\|                                --delete \\|g' "$JENKINSFILE"
sed -i '' 's|#     --cache-control "public, max-age=31536000" \\|                                --cache-control "public, max-age=31536000" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --exclude "\*.html" \\|                                --exclude "*.html" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --exclude "\*.json" \\|                                --exclude "*.json" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --exclude "super-admin/\*"|                                --exclude "super-admin/*"|g' "$JENKINSFILE"

# 恢复第二个 aws s3 sync 命令
sed -i '' 's|#     --include "\*.html" \\|                                --include "*.html" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --include "\*.json" \\|                                --include "*.json" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --cache-control "no-cache, no-store, must-revalidate" \\|                                --cache-control "no-cache, no-store, must-revalidate" \\|g' "$JENKINSFILE"

# 恢复 aws s3 cp 命令
sed -i '' 's|# aws s3 cp s3://${S3_BUCKET_NAME}/index.html \\|aws s3 cp s3://${S3_BUCKET_NAME}/index.html \\|g' "$JENKINSFILE"
sed -i '' 's|#     s3://${S3_BUCKET_NAME}/index.html \\|                                s3://${S3_BUCKET_NAME}/index.html \\|g' "$JENKINSFILE"
sed -i '' 's|#     --content-type "text/html" \\|                                --content-type "text/html" \\|g' "$JENKINSFILE"
sed -i '' 's|#     --metadata-directive REPLACE|                                --metadata-directive REPLACE|g' "$JENKINSFILE"

# 删除测试提示信息
sed -i '' '/echo "🚨 S3 sync skipped for safety testing"/d' "$JENKINSFILE"
sed -i '' '/echo "🚨 S3 operations skipped for safety testing"/d' "$JENKINSFILE"

# 删除注释行
sed -i '' '/# SAFETY: Commented out for testing - uncomment after verification/d' "$JENKINSFILE"

echo "✅ 恢复完成！"
echo "📋 请检查 $JENKINSFILE 确认修改正确"
