# Frontend S3 Migration Guide

## 🎯 目标
将主前端应用从 EC2 Docker 部署迁移到 S3 静态网站托管

## 📋 当前架构 vs 目标架构

### 当前架构
```
域名 → Nginx → Docker Container (EC2) → React App
域名/super-admin → Nginx → S3 → Super Admin App
```

### 目标架构
```
域名 → Nginx → S3 → Main React App
域名/super-admin → Nginx → S3 → Super Admin App
```

## ✅ 优势

1. **成本降低**: S3 静态托管比 EC2 实例便宜
2. **性能提升**: S3 + CloudFront 更快的内容分发
3. **可扩展性**: 自动处理流量高峰
4. **简化运维**: 无需管理服务器和 Docker 容器
5. **高可用性**: S3 提供 99.999999999% (11 9's) 持久性

## 🚀 迁移步骤

### 步骤 1: 测试本地部署
```bash
# 在项目根目录运行
chmod +x deploy-client-s3.sh
./deploy-client-s3.sh
```

### 步骤 2: 使用 Jenkins Pipeline
1. 创建新的 Jenkins 任务：`frontend-s3-migration`
2. Pipeline script from SCM
3. Script Path: `Jenkinsfile_client_s3`
4. 首次运行参数：
   - `UPDATE_NGINX`: ❌ (先测试 S3 部署)
   - `WEB_SERVER_HOST`: 你的服务器地址
   - `MIGRATE_FROM_DOCKER`: ✅ (标记这是迁移)

### 步骤 3: 验证 S3 部署
测试 S3 直接访问：
```bash
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com
```

### 步骤 4: 更新 Nginx 配置
再次运行 Jenkins 任务，设置：
- `UPDATE_NGINX`: ✅
- 其他参数保持不变

### 步骤 5: 验证域名访问
```bash
# 测试主应用
curl -I https://sigma.jiangren.com.au

# 测试 Super Admin
curl -I https://sigma.jiangren.com.au/super-admin
```

### 步骤 6: 停止 Docker 容器
确认一切正常后：
```bash
# 在 EC2 服务器上
docker-compose down
# 或
docker stop [container-name]
```

## ⚠️ 注意事项

### 1. API 调用
确保前端应用的 API 调用配置正确：
- 生产环境应该调用后端 API 服务器
- 检查 `.env.production` 配置

### 2. 路由配置
- SPA 路由需要正确配置
- S3 错误文档设置为 `index.html`
- Nginx 错误处理配置

### 3. 缓存策略
- 静态资源 (JS/CSS): 长期缓存 (1年)
- HTML 文件: 不缓存
- 确保更新时能正确加载新版本

### 4. Super Admin 保护
- 迁移过程中保护现有 Super Admin 文件
- 自动备份和恢复机制

## 🔙 回滚计划

如果迁移出现问题：

### 方法 1: 快速回滚 Nginx
```bash
# 在服务器上恢复备份配置
sudo cp /etc/nginx/sites-available/sigma.jiangren.com.au.backup.s3migration.* \
        /etc/nginx/sites-available/sigma.jiangren.com.au
sudo nginx -t && sudo nginx -s reload
```

### 方法 2: 重启 Docker 容器
```bash
# 在 EC2 服务器上
docker-compose up -d
# 或
docker start [container-name]
```

## 📊 监控检查点

### 部署后验证清单
- [ ] S3 网站可直接访问
- [ ] 主域名返回正确页面
- [ ] Super Admin 路径正常工作
- [ ] 前端 API 调用正常
- [ ] 用户登录流程正常
- [ ] 页面路由和刷新正常

### 性能监控
- [ ] 页面加载时间
- [ ] 静态资源加载速度
- [ ] API 响应时间
- [ ] 用户体验无异常

## 🛠️ 故障排除

### 常见问题

1. **404 错误**
   - 检查 S3 静态网站托管配置
   - 验证错误文档设置
   - 检查文件是否正确上传

2. **API 调用失败**
   - 检查 `.env.production` 配置
   - 验证 CORS 设置
   - 确认后端服务正常

3. **路由问题**
   - 检查 React Router 配置
   - 验证 S3 错误文档设置
   - 检查 Nginx 错误处理

4. **缓存问题**
   - 清除浏览器缓存
   - 检查 S3 缓存头设置
   - 验证文件版本更新

## 📞 紧急联系

如果迁移出现严重问题：
1. 立即执行回滚计划
2. 检查服务监控和日志
3. 联系技术负责人
4. 记录问题以供后续分析

## 🎉 迁移完成后

1. **清理工作**
   - 停止 EC2 Docker 容器
   - 备份 Docker 配置文件
   - 更新部署文档

2. **优化工作** (可选)
   - 配置 CloudFront CDN
   - 设置自动化监控
   - 优化构建流程

3. **成本监控**
   - 监控 S3 使用量
   - 比较 EC2 vs S3 成本
   - 优化资源配置
