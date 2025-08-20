# Super Admin 生产环境部署方案

## 文件结构

### Jenkinsfile 文件
- `Jenkinsfile_super_admin` - UAT 环境部署（保持不变）
  - 部署到：`uat-sigma.jiangren.com.au` S3 bucket
  - 访问地址：`https://uat-sigma.jiangren.com.au/super-admin/`

- `Jenkinsfile_super_admin_prod` - 生产环境部署（新建）
  - 部署到：`sigma.jiangren.com.au` S3 bucket
  - 访问地址：`https://sigma.jiangren.com.au/super-admin/`

### Nginx 配置文件
- `nginx-sigma-domain.conf` - 原配置（Super Admin 指向 UAT）
- `nginx-sigma-domain-prod.conf` - 新配置（Super Admin 指向生产）

## 实现方案

### 方案 1：使用生产 S3 bucket + Nginx 代理（推荐）

**优点：**
- 不需要 CloudFront
- 利用现有的 `sigma.jiangren.com.au` S3 bucket
- 通过 Nginx 代理提供 HTTPS 支持

**配置步骤：**

1. **部署 Super Admin 到生产 S3**
   ```bash
   # 在 Jenkins 中运行新的 pipeline
   Jenkinsfile_super_admin_prod
   ```

2. **更新 Nginx 配置**
   ```bash
   # 替换当前的 nginx 配置为新配置
   cp nginx-sigma-domain-prod.conf /etc/nginx/sites-available/sigma.jiangren.com.au
   nginx -t && systemctl reload nginx
   ```

3. **验证部署**
   - UAT: `https://uat-sigma.jiangren.com.au/super-admin/`
   - 生产: `https://sigma.jiangren.com.au/super-admin/`

### 方案 2：直接 S3 网站托管（无 Nginx）

**如果不使用 Nginx 代理，需要：**

1. **配置 DNS CNAME**
   ```
   sigma.jiangren.com.au CNAME sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com
   ```

2. **配置 SSL 证书**
   - 需要在 S3 前加 CloudFront 或 Load Balancer
   - 或者使用 AWS Certificate Manager + CloudFront

## 关键配置差异

### UAT 环境 (Jenkinsfile_super_admin)
```groovy
S3_BUCKET_NAME = 'uat-sigma.jiangren.com.au'
```

### 生产环境 (Jenkinsfile_super_admin_prod)
```groovy
S3_BUCKET_NAME = 'sigma.jiangren.com.au'
```

### Nginx 配置差异
```nginx
# UAT 指向
proxy_pass http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/;

# 生产指向
proxy_pass http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
```

## 部署流程

1. **提交新文件到 Git**
   ```bash
   git add Jenkinsfile_super_admin_prod nginx-sigma-domain-prod.conf
   git commit -m "Add production Super Admin deployment"
   git push origin feature/super-admin-s3-deployment
   ```

2. **在 Jenkins 中创建新的 Pipeline**
   - Pipeline Name: `super-admin-prod-deployment`
   - Jenkinsfile Path: `Jenkinsfile_super_admin_prod`

3. **运行生产部署**
   - 触发 `super-admin-prod-deployment` pipeline

4. **更新 Nginx 配置**（如果使用 Nginx 代理）
   - 应用新的 nginx 配置文件
   - 重启/重载 nginx

5. **验证访问**
   - 测试 `https://sigma.jiangren.com.au/super-admin/`

## 注意事项

1. **S3 Bucket 权限**
   - 确保 `sigma.jiangren.com.au` bucket 有正确的静态网站托管配置
   - 确保 bucket policy 允许公开读取

2. **缓存清理**
   - 部署后清除浏览器缓存
   - 如果使用 CloudFront，需要创建 invalidation

3. **SSL 证书**
   - 确保 nginx 配置中的 SSL 证书路径正确
   - 证书需要包含 `sigma.jiangren.com.au` 域名

4. **API 后端**
   - Super Admin 的 API 调用仍然指向同一个后端 (localhost:5050)
   - 确保生产环境的 API 服务正常运行
