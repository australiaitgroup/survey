# Super Admin S3 + Nginx 部署检查清单

## ✅ 准备工作检查

### S3 配置
- [ ] S3 桶 `jr-sigma-survey-prod` 已创建
- [ ] 静态网站托管已启用
- [ ] 桶策略允许公开读取 `/super-admin/*`
- [ ] 可访问：`http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/`

### Jenkins 配置
- [ ] Jenkins 有 Vault 凭据访问 AWS
- [ ] SSH 凭据 `web-server-ssh` 已配置
- [ ] 可 SSH 到目标服务器：`ssh ubuntu@YOUR_SERVER_IP`

### 服务器配置
- [ ] 服务器安装了 Nginx
- [ ] Ubuntu 用户有 sudo 权限
- [ ] 域名 `sigma.jiangren.com.au` 解析到服务器
- [ ] SSL 证书已配置

## ✅ 代码检查

### Super Admin 应用
- [ ] `super-admin/vite.config.ts` 中 `base: '/super-admin/'` ✅
- [ ] `super-admin/index.html` 使用相对路径 `./src/index.tsx` ✅
- [ ] 可本地构建：`cd super-admin && npm run build`

### Jenkins Pipeline
- [ ] `Jenkinsfile_super_admin` 包含参数 `UPDATE_NGINX`, `WEB_SERVER_HOST` ✅
- [ ] 包含 "Configure Nginx Reverse Proxy" 阶段 ✅
- [ ] SSH 凭据 ID 正确：`web-server-ssh` ✅

## ✅ 部署步骤

### 第一次运行（测试 S3）
```bash
Jenkins 参数：
UPDATE_NGINX: false
WEB_SERVER_HOST: (留空)
```
- [ ] Jenkins 任务成功完成
- [ ] S3 URL 可访问
- [ ] 文件正确上传到 `/super-admin/` 路径

### 第二次运行（完整部署）
```bash
Jenkins 参数：
UPDATE_NGINX: true
WEB_SERVER_HOST: YOUR_SERVER_IP
```
- [ ] SSH 连接成功
- [ ] Nginx 配置添加成功
- [ ] Nginx 重新加载成功
- [ ] 域名 URL 可访问

## ✅ 验证结果

### S3 直接访问
- [ ] `http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/`
- [ ] 页面正常加载
- [ ] 静态资源（CSS/JS）正常加载

### 域名代理访问
- [ ] `https://sigma.jiangren.com.au/super-admin/`
- [ ] 页面正常加载
- [ ] 静态资源正常加载
- [ ] HTTPS 证书有效

## ✅ 故障排查

如果遇到问题，检查：

### Jenkins 日志
- [ ] AWS 凭据获取成功
- [ ] S3 上传成功
- [ ] SSH 连接成功
- [ ] Nginx 配置测试通过

### 服务器日志
```bash
# Nginx 配置测试
sudo nginx -t

# Nginx 错误日志
sudo tail -20 /var/log/nginx/error.log

# Nginx 访问日志
sudo tail -20 /var/log/nginx/access.log
```

### 网络测试
```bash
# 测试 S3 响应
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/

# 测试域名响应
curl -I https://sigma.jiangren.com.au/super-admin/

# 测试代理转发
curl -v https://sigma.jiangren.com.au/super-admin/
```

## ✅ 下一步

完成此检查清单后：
1. 提供服务器 IP 地址
2. 运行 Jenkins 任务
3. 验证域名访问
4. 确认部署成功

---

**快速启动命令**：
```bash
# 检查应用构建
cd super-admin && npm run build

# 提交代码更改
git add . && git commit -m "Add Jenkins Nginx automation"

# 推送到远程分支
git push origin feature/super-admin-s3-deployment
```
