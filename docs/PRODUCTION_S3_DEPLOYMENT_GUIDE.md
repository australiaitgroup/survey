# 主前端生产环境 S3 部署指南

## 📋 部署概览

### 🎯 目标架构
- **生产S3桶**: `sigma.jiangren.com.au` (仅主前端)
- **UAT S3桶**: `uat-sigma.jiangren.com.au` (Super Admin保持不变)
- **主前端**: 部署到生产桶根路径 `/`
- **Super Admin**: 继续在UAT环境的 `/super-admin/` 路径
- **访问地址**:
  - 主前端: `http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/`
  - Super Admin: `http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/`

### 🔐 AWS凭证
- **Vault路径**: `secret_aws/aws_prod`
- **环境**: 生产环境凭证，但Super Admin仍部署到UAT桶
- **权限**: S3桶创建、策略管理、文件上传

## 🚀 部署步骤

### 1. 部署主前端到生产环境
```bash
# Jenkins任务: deploy-main-frontend
# 这将自动：
# 1. 创建生产S3桶 sigma.jiangren.com.au
# 2. 配置桶策略支持主前端访问
# 3. 设置静态网站托管
# 4. 构建并部署主前端到根路径
```

### 2. Super Admin保持在UAT (无需变更)
```bash
# Jenkins任务: deploy-super-admin
# 这将继续：
# 1. 使用UAT桶 uat-sigma.jiangren.com.au
# 2. 部署到/super-admin/路径
# 3. 使用生产凭证但访问UAT桶
```

## 📊 配置变更总结

### Jenkinsfile_main_frontend
- ✅ S3桶名改为: `sigma.jiangren.com.au`
- ✅ 应用名改为: `sigma-main-frontend-prod`
- ✅ 新增桶创建和配置阶段
- ✅ 保持使用 `secret_aws/aws_prod` 凭证

### Jenkinsfile_super_admin
- ✅ S3桶名保持: `uat-sigma.jiangren.com.au` (无变更)
- ✅ 继续部署到UAT环境的 `/super-admin/` 子路径
- ✅ 保持使用 `secret_aws/aws_prod` 凭证
- ✅ 添加工作空间清理

## ⚠️ 重要注意事项

### 环境分离
- **主前端**: 生产环境 (`sigma.jiangren.com.au`)
- **Super Admin**: UAT环境 (`uat-sigma.jiangren.com.au`)
- **凭证**: 两个应用都使用生产凭证，但访问不同的桶

### 桶策略
主前端部署会为生产桶设置策略：
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadMainApp",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::sigma.jiangren.com.au/*"
    }
  ]
}
```

Super Admin的UAT桶策略保持不变：
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadSuperAdmin",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::uat-sigma.jiangren.com.au/super-admin/*"
    }
  ]
}
```

### 缓存策略
- **静态资源** (JS/CSS): 1年缓存
- **HTML/JSON**: 无缓存，即时更新

## 🔍 验证步骤

### 1. S3桶验证
```bash
# 生产桶 - 主前端
aws s3 ls s3://sigma.jiangren.com.au/
# 应该看到主前端文件

# UAT桶 - Super Admin
aws s3 ls s3://uat-sigma.jiangren.com.au/super-admin/
# 应该看到Super Admin文件
```

### 2. 网站访问验证
- 主前端: http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/
- Super Admin: http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/

### 3. 功能验证
- [ ] 主前端页面正常加载
- [ ] CSS样式正确显示
- [ ] Super Admin继续在UAT环境正常工作
- [ ] API调用正常工作(需要Nginx代理)

## 🔄 回滚计划

如果需要回滚主前端到UAT环境：
1. 将主前端S3桶名改回 `uat-sigma.jiangren.com.au`
2. 重新部署主前端
3. 更新Nginx代理配置

## 📝 后续步骤

1. **Nginx配置**: 更新反向代理
   - 主前端指向: `sigma.jiangren.com.au`
   - Super Admin继续指向: `uat-sigma.jiangren.com.au/super-admin/`
2. **域名设置**: 配置 sigma.jiangren.com.au 指向Nginx
3. **监控设置**: 为生产环境设置监控和警报
4. **备份策略**: 为生产桶设置定期备份

---

**创建时间**: $(date)
**主前端**: 生产环境 (sigma.jiangren.com.au)
**Super Admin**: UAT环境 (uat-sigma.jiangren.com.au)
**AWS凭证**: secret_aws/aws_prod
