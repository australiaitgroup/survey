# 主前端 S3 迁移 - 最终验证清单

## 📋 部署前验证

### 1. 配置文件检查
- [ ] `client/postcss.config.js` - 主配置使用 `@tailwindcss/postcss`
- [ ] `client/postcss.config.jenkins.js` - Jenkins 配置存在且语法正确
- [ ] `client/.env.production` - 包含构建优化参数
- [ ] `Jenkinsfile_main_frontend` - 包含错误处理和兼容性修复
- [ ] `nginx-s3-proxy.conf` - Nginx 代理配置正确

### 2. 本地构建测试
```bash
# 运行兼容性测试脚本
./test-jenkins-build.sh

# 预期结果:
# ✅ Build successful with Jenkins config!
# ✅ dist/ 目录包含完整的前端资源
```

### 3. S3 桶状态检查
```bash
# 检查 S3 桶状态
./check-s3-bucket-status.sh

# 预期结果:
# ✅ S3 桶存在且可访问
# ✅ 桶策略支持根路径和 /super-admin/ 访问
```

## 🚀 部署执行

### 1. Jenkins 主前端部署
- [ ] 触发 Jenkins 任务: `deploy-main-frontend`
- [ ] 监控构建日志，确认无错误
- [ ] 验证 S3 桶策略自动更新
- [ ] 确认前端文件成功上传到根路径

### 2. 构建日志检查点
```text
预期看到的关键日志:
✅ Environment Information (Node.js, NPM 版本)
✅ Using Jenkins-specific PostCSS config
✅ Dependencies installed successfully
✅ Build completed successfully
✅ Bucket policy updated successfully
✅ Main frontend deployed to S3 successfully
```

### 3. S3 部署验证
```bash
# 检查 S3 部署结果
aws s3 ls s3://uat-sigma.jiangren.com.au/ --recursive | head -20

# 预期结果:
# - index.html 在根路径
# - assets/ 目录包含 CSS、JS 文件
# - super-admin/ 目录保持不变
```

## 🌐 Nginx 代理配置

### 1. 应用 Nginx 配置
- [ ] 将 `nginx-s3-proxy.conf` 部署到生产服务器
- [ ] 重新加载 Nginx 配置
- [ ] 验证配置语法正确

### 2. 代理路径测试
- [ ] `/` - 应代理到 S3 主前端
- [ ] `/super-admin/` - 应代理到 S3 super-admin 子路径
- [ ] `/api/` - 应代理到 EC2 后端服务器

## ✅ 功能验证

### 1. 主前端访问测试
- [ ] 访问 `https://uat-sigma.jiangren.com.au/`
- [ ] 页面正常加载，CSS 样式正确
- [ ] JavaScript 功能正常工作
- [ ] API 调用成功（检查网络面板）

### 2. Super Admin 访问测试
- [ ] 访问 `https://uat-sigma.jiangren.com.au/super-admin/`
- [ ] Super Admin 应用正常加载
- [ ] 与主前端相互独立，无冲突

### 3. API 代理测试
- [ ] 主前端 API 调用正常工作
- [ ] 响应时间正常
- [ ] 错误处理正确

### 4. 移动端和响应式测试
- [ ] 移动设备访问正常
- [ ] 响应式布局工作正确
- [ ] 触摸交互正常

## 🔧 故障排除

### 如果构建失败:
1. 检查 Node.js 版本是否兼容
2. 清理 `node_modules` 重新安装
3. 检查 PostCSS 配置是否正确
4. 查看详细构建日志

### 如果部署失败:
1. 检查 AWS 凭证和权限
2. 验证 S3 桶策略
3. 检查网络连接和区域设置

### 如果代理失败:
1. 检查 Nginx 配置语法
2. 验证 upstream 服务器状态
3. 检查 DNS 解析
4. 查看 Nginx 错误日志

## 📊 性能监控

### 部署后监控项目:
- [ ] 页面加载时间
- [ ] 静态资源缓存效果
- [ ] API 响应时间
- [ ] 错误率监控

### 优化建议:
- 启用 CloudFront CDN (可选)
- 优化图片和资源压缩
- 实施更精细的缓存策略

## 📝 部署完成确认

- [ ] 主前端成功迁移到 S3 静态托管
- [ ] Super Admin 应用保持在 /super-admin/ 子路径
- [ ] Nginx 反向代理正确配置
- [ ] 所有功能测试通过
- [ ] 性能表现符合预期

**部署完成时间**: _____________
**执行人员**: _____________
**验证人员**: _____________

---

## 🔄 后续维护

1. **监控和警报**: 设置 S3 和 API 的监控警报
2. **备份策略**: 确保关键配置文件的版本控制
3. **更新流程**: 建立前端更新的标准化流程
4. **文档维护**: 更新运维文档和故障排除指南
