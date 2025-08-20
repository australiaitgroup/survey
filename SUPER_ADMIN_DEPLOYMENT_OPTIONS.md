# 方案：同时部署 Super Admin 到生产和 UAT 桶

## 修改 Jenkinsfile_super_admin，在部署阶段添加：

```groovy
stage('Deploy to S3') {
    steps {
        echo 'Deploying Super Admin to both UAT and Production S3...'
        withVault(configuration: [timeout: 60, vaultCredentialId: 'Vault Credential', vaultUrl: 'https://vault.jiangren.com.au'], vaultSecrets: [[path: 'secret_aws/aws_prod', secretValues: [[vaultKey: 'AWS_ACCESS_KEY_ID'], [vaultKey: 'AWS_SECRET_ACCESS_KEY']]]]) {
            dir('super-admin') {
                sh '''
                    echo "🚀 Starting S3 deployment to both environments..."

                    # 部署到 UAT 桶 (原有逻辑)
                    echo "📁 Deploying to UAT bucket: ${S3_BUCKET_NAME}"
                    aws s3 sync dist/ s3://${S3_BUCKET_NAME}/super-admin/ \
                        --region ${AWS_REGION} \
                        --delete \
                        --cache-control "public, max-age=31536000" \
                        --exclude "*.html" \
                        --exclude "*.json"

                    aws s3 sync dist/ s3://${S3_BUCKET_NAME}/super-admin/ \
                        --region ${AWS_REGION} \
                        --include "*.html" \
                        --include "*.json" \
                        --cache-control "no-cache, no-store, must-revalidate"

                    # 部署到生产桶 (新增)
                    echo "📁 Deploying to Production bucket: sigma.jiangren.com.au"
                    aws s3 sync dist/ s3://sigma.jiangren.com.au/super-admin/ \
                        --region ${AWS_REGION} \
                        --delete \
                        --cache-control "public, max-age=31536000" \
                        --exclude "*.html" \
                        --exclude "*.json"

                    aws s3 sync dist/ s3://sigma.jiangren.com.au/super-admin/ \
                        --region ${AWS_REGION} \
                        --include "*.html" \
                        --include "*.json" \
                        --cache-control "no-cache, no-store, must-revalidate"

                    echo "✅ S3 deployment completed to both environments!"
                '''
            }
        }
    }
}
```

## 优缺点：
✅ 优点：
- Super Admin 直接存在于生产 S3 桶中
- 不依赖 Nginx 代理
- 访问速度更快

❌ 缺点：
- 需要维护两个副本
- 增加存储成本
- 部署时间稍长
