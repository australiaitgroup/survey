# Super Admin S3 部署指南

本指南将帮你将 Super Admin React 应用部署到 AWS S3，并通过子路径 `/super-admin` 访问。

> 注意：当前阶段未启用 CloudFront，相关配置已被注释。如需恢复，请移除 HTML 注释块。

## 前置条件

1. **AWS 账户和权限**
   - AWS CLI 已安装并配置
   - S3 存储桶访问权限

2. **工具安装**
   - Node.js (版本 16+)
   - AWS CLI v2

## 配置步骤

### 1. 设置环境变量

编辑 `.env.deploy` 文件，填入你的实际配置：
```bash
S3_BUCKET_NAME=jr-sigma-survey-prod
AWS_REGION=ap-southeast-2
```

### 2. S3 存储桶配置

确保你的 S3 存储桶配置正确：

#### 启用静态网站托管
1. 在 AWS 控制台打开你的 S3 存储桶
2. 进入 "Properties" 标签
3. 滚动到 "Static website hosting"
4. 启用静态网站托管
5. 设置 "Index document" 为 `index.html`
6. 设置 "Error document" 为 `index.html`（用于 SPA 路由）

#### 设置存储桶权限
若需公网直接访问，在取消阻断公共访问后添加以下策略：

最小权限（仅暴露 /super-admin 前缀）：
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadSuperAdmin",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jr-sigma-survey-prod/super-admin/*"
    }
  ]
}
```

（如果需要整个桶所有对象可读，可改 Resource 为 "arn:aws:s3:::jr-sigma-survey-prod/*"，不推荐除非确认安全需求）

<!--
### 3. CloudFront 配置（推荐）

如果使用 CloudFront：

1. **创建 CloudFront 分发**
   - Origin Domain: 你的 S3 存储桶网站端点
   - Origin Path: 留空或设置为 `/super-admin`

2. **配置行为**
   - Path Pattern: `/super-admin/*`
   - Origin and Origin Groups: 选择你的 S3 origin
   - Cache Policy: Managed-CachingOptimized

3. **设置错误页面**
   - HTTP Error Code: 404
   - Response Page Path: `/super-admin/index.html`
   - HTTP Response Code: 200
-->

### 3. Jenkins 配置

#### 添加 Jenkins 凭据
在 Jenkins 中添加以下凭据：

1. **AWS 凭据**
   - 类型: AWS Credentials
   - ID: `aws-credentials`
   - Access Key ID 和 Secret Access Key

2. **S3 存储桶名称**
   - 类型: Secret text
   - ID: `S3_BUCKET_NAME`
   - Secret: `jr-sigma-survey-prod`

3. **AWS 区域**
   - 类型: Secret text
   - ID: `AWS_REGION`
   - Secret: `ap-southeast-2`

#### 创建 Jenkins 任务
1. 创建新的 Pipeline 任务
2. 在 Pipeline 配置中，选择 "Pipeline script from SCM"
3. 设置 Git 仓库
4. Script Path: `Jenkinsfile_super_admin`

## 部署方法

### 方法 1: 使用 Jenkins Pipeline

1. 推送代码到你的代码仓库
2. 在 Jenkins 中运行 `super-admin-deployment` 任务
3. 等待部署完成

### 方法 2: 使用部署脚本

在本地运行部署脚本：

```bash
# 设置环境变量
export S3_BUCKET_NAME=jr-sigma-survey-prod
export AWS_REGION=ap-southeast-2

# 运行部署脚本
./deploy-super-admin.sh
```

### 方法 3: 手动部署

```bash
# 进入 super-admin 目录
cd super-admin

# 安装依赖
npm install

# 构建应用
NODE_ENV=production npm run build

# 上传到 S3
aws s3 sync dist/ s3://jr-sigma-survey-prod/super-admin/ --delete
```

## 验证部署

部署完成后，你可以通过以下方式验证：

1. **直接访问 S3**
   ```
   http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin
   ```

2. **通过自定义域名**（如果配置了）
   ```
   https://yourdomain.com/super-admin
   ```

## 故障排除

### 常见问题

1. **404 错误**
   - 检查 S3 存储桶是否配置了静态网站托管
   - 确认文件是否正确上传到 `/super-admin` 路径
   - （如启用 CloudFront）检查错误页面配置

2. **路由问题**
   - 确保静态网站托管 Error document 指向 index.html
   - 检查 `vite.config.ts` 中的 `base` 配置

3. **缓存问题**
   - （如启用 CloudFront）清除分发缓存
   - 检查浏览器缓存

4. **权限问题**
   - 检查 AWS 凭据配置
   - 验证 S3 存储桶策略
   - 确认 IAM 用户权限

### 日志调试

查看 Jenkins 构建日志：
```bash
# 在 Jenkins 任务页面查看 Console Output
```

（如启用 CloudFront）查看访问情况：
```bash
# 在 AWS 控制台查看 CloudFront 监控
```

## 环境变量参考

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `S3_BUCKET_NAME` | 是 | S3 存储桶名称 | `jr-sigma-survey-prod` |
| `AWS_REGION` | 是 | AWS 区域 | `ap-southeast-2` |
| `DOMAIN_NAME` | 否 | 自定义域名（若后续接入） | `example.com` |

## 更新和维护

### 更新应用
1. 修改代码
2. 提交到代码仓库
3. 运行 Jenkins 任务或部署脚本

### 监控
- （可选）接入 CloudWatch / CloudFront 监控
- 监控应用错误率

### 备份
- S3 提供高持久性
- 建议启用 S3 版本控制以便回滚
