# 🚀 Sigma Q 生产环境部署最终检查清单

## 📋 部署前检查

### ✅ 已完成配置
- [x] **Jenkinsfile_main_frontend** - 配置为生产环境 `sigma.jiangren.com.au`
- [x] **Jenkinsfile_super_admin** - 保持UAT环境 `uat-sigma.jiangren.com.au`
- [x] **AWS凭证** - 统一使用 `secret_aws/aws_prod`
- [x] **S3桶策略** - 支持主前端和Super Admin访问
- [x] **Nginx配置** - 正确代理到不同S3桶
- [x] **PostCSS配置** - Jenkins兼容版本已准备

### 📁 关键文件状态
```
✅ Jenkinsfile_main_frontend        (生产环境 - sigma.jiangren.com.au)
✅ Jenkinsfile_main_frontend_uat    (UAT测试 - uat-sigma.jiangren.com.au)  
✅ Jenkinsfile_super_admin          (UAT环境 - uat-sigma.jiangren.com.au)
✅ nginx-sigma-domain.conf          (域名代理配置)
✅ client/postcss.config.simple.js  (Jenkins兼容配置)
✅ verify-production-deployment.sh  (部署验证脚本)
```

## 🎯 部署执行步骤

### 第一步：部署主前端到生产环境
```bash
# Jenkins 任务: Jenkinsfile_main_frontend
# 这将自动：
# 1. 创建生产S3桶 sigma.jiangren.com.au
# 2. 配置静态网站托管
# 3. 设置桶策略允许公共读取
# 4. 构建主前端应用
# 5. 部署到S3桶根路径
```

**预期结果:**
- ✅ S3桶 `sigma.jiangren.com.au` 创建并配置
- ✅ 主前端可通过 http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/ 访问
- ✅ Super Admin 在 UAT 环境不受影响

### 第二步：验证部署结果
```bash
# 运行验证脚本
./verify-production-deployment.sh
```

**验证项目:**
- [ ] 生产S3桶存在且配置正确
- [ ] 主前端文件已上传到生产桶
- [ ] S3静态网站URL可访问
- [ ] Super Admin在UAT环境仍可访问
- [ ] Nginx配置正确代理到相应桶

### 第三步：更新Nginx配置 (如需要)
如果 Nginx 未正确配置，应用 `nginx-sigma-domain.conf` 配置：

```nginx
# 主前端 - 代理到生产S3
location / {
    proxy_pass http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/;
}

# Super Admin - 代理到UAT S3  
location /super-admin/ {
    proxy_pass http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
}
```

### 第四步：最终功能测试
- [ ] 主前端通过域名访问: https://sigma.jiangren.com.au
- [ ] Super Admin通过域名访问: https://sigma.jiangren.com.au/super-admin
- [ ] API调用正常工作
- [ ] 登录功能正常
- [ ] 页面样式和资源加载正常

## 🌐 访问地址总结

### 生产环境 (主前端)
- **S3直接访问**: http://sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/
- **域名访问**: https://sigma.jiangren.com.au
- **桶名**: `sigma.jiangren.com.au`
- **路径**: `/` (根路径)

### UAT环境 (Super Admin)
- **S3直接访问**: http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/
- **域名访问**: https://sigma.jiangren.com.au/super-admin
- **桶名**: `uat-sigma.jiangren.com.au`
- **路径**: `/super-admin/`

## ⚠️ 重要提醒

### 访问层级
1. **API请求** → EC2后端 (localhost:5050)
2. **Super Admin** → UAT S3桶 (/super-admin/)  
3. **主前端** → 生产S3桶 (/)

### 缓存策略
- **静态资源** (CSS/JS): 1年缓存
- **HTML文件**: 无缓存，确保实时更新
- **API响应**: 根据后端配置

### 环境隔离
- 主前端和Super Admin使用不同的S3桶
- 两者都使用相同的生产AWS凭证
- Super Admin保持在UAT环境，便于独立测试

## 🔄 回滚方案

如果生产部署出现问题：

1. **紧急回滚到UAT**:
   ```bash
   # 修改 Nginx 主前端代理指向UAT
   proxy_pass http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/;
   ```

2. **重新部署**:
   ```bash
   # 修复问题后重新运行主前端Jenkins任务
   # Jenkins -> Jenkinsfile_main_frontend
   ```

## 📞 问题排查

### 如果主前端不可访问
1. 检查S3桶是否存在且配置正确
2. 验证桶策略允许公共读取
3. 确认静态网站托管已启用
4. 检查文件是否正确上传

### 如果域名不可访问  
1. 检查Nginx配置是否正确
2. 验证SSL证书是否有效
3. 确认DNS解析指向正确IP
4. 检查防火墙和端口配置

### 如果Super Admin出现问题
1. 确认UAT桶未被修改
2. 检查/super-admin/路径文件完整性
3. 验证Nginx代理配置正确

---

**最后更新**: $(date)  
**状态**: 准备部署  
**配置**: 生产环境就绪  
**验证**: 脚本已准备
