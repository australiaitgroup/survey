# 主前端 S3 迁移执行清单

## 📋 前置检查

### 1. 确认现有桶状态
```bash
./check-s3-bucket-status.sh
```

### 2. 备份现有 Nginx 配置
```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. 确认 client 构建正常
```bash
cd client
npm install
npm run build
ls -la dist/
```

## 🚀 执行步骤

### 步骤1：部署主前端到 S3
```bash
# 在 Jenkins 中创建新任务：deploy-main-frontend
# 使用 Jenkinsfile_main_frontend
# 这会：
# ✅ 更新桶策略（支持根路径访问）
# ✅ 构建主前端
# ✅ 部署到 S3 根路径
# ✅ 排除 super-admin 目录，避免覆盖
```

### 步骤2：部署 Super Admin
```bash
# 运行现有的 Super Admin 任务
# 使用 Jenkinsfile_super_admin
# 这会：
# ✅ 构建 Super Admin
# ✅ 部署到 S3 /super-admin/ 路径
```

### 步骤3：更新 Nginx 配置
```bash
# 手动编辑 Nginx 配置
sudo nano /etc/nginx/sites-available/default

# 添加 nginx-full-s3-proxy.conf 中的配置
# 确保顺序：API -> Super Admin -> 主前端（根路径）

# 测试配置
sudo nginx -t

# 重新加载
sudo systemctl reload nginx
```

## 🔍 验证步骤

### 1. 测试 S3 直接访问
```bash
# 主前端
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/

# Super Admin
curl -I http://uat-sigma.jiangren.com.au.s3-website-ap-southeast-2.amazonaws.com/super-admin/
```

### 2. 测试域名代理访问
```bash
# 主前端
curl -I https://uat-sigma.jiangren.com.au/

# Super Admin
curl -I https://uat-sigma.jiangren.com.au/super-admin/

# API
curl -I https://uat-sigma.jiangren.com.au/api/health
```

### 3. 浏览器测试
- [ ] https://uat-sigma.jiangren.com.au/ → 主前端正常加载
- [ ] https://uat-sigma.jiangren.com.au/super-admin/ → Super Admin 正常加载
- [ ] https://uat-sigma.jiangren.com.au/api/ → API 正常响应
- [ ] 主前端的 API 调用正常工作
- [ ] Super Admin 的 API 调用正常工作

## 📊 最终架构

```
域名访问流程：
https://uat-sigma.jiangren.com.au/
    ↓ (Nginx 反向代理)
    ↓
    ├── /api/* → EC2 后端 (localhost:5050)
    ├── /super-admin/* → S3 (uat-sigma.jiangren.com.au/super-admin/)
    └── /* → S3 (uat-sigma.jiangren.com.au/)

S3 桶结构：
uat-sigma.jiangren.com.au/
├── index.html (主前端)
├── assets/ (主前端资源)
├── favicon.ico
├── ...
└── super-admin/
    ├── index.html (Super Admin)
    ├── assets/ (Super Admin 资源)
    └── ...
```

## ⚠️ 注意事项

### 1. 部署顺序很重要
- **先部署主前端**（设置桶策略）
- **再部署 Super Admin**（或者重新部署确保不受影响）
- **最后更新 Nginx**（确保路由正确）

### 2. 文件冲突预防
- 主前端部署时会排除 `super-admin/*`
- Super Admin 只更新 `/super-admin/` 路径
- 使用 `--exclude` 和明确的路径避免冲突

### 3. 缓存策略
- HTML/JSON 文件：`no-cache`
- 静态资源：`1年缓存`
- Nginx 层面也有缓存配置

### 4. 回滚计划
- 保留 Nginx 配置备份
- 可以快速恢复到 EC2 Docker 部署
- S3 文件可以通过版本控制恢复

## 🎯 成功标准

部署成功的标志：
- ✅ 主前端从 S3 提供，速度更快
- ✅ Super Admin 继续正常工作
- ✅ API 调用通过 Nginx 正确代理到后端
- ✅ React Router 路由正常工作
- ✅ 静态资源正确缓存
- ✅ SSL 证书正常工作

## 📞 故障排查

如果遇到问题：
1. 检查 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`
2. 检查 S3 访问权限和桶策略
3. 验证 DNS 解析和 SSL 配置
4. 确认文件路径和代理配置正确
