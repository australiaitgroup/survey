# Jenkins SSH 自动化部署检查清单

## 📋 部署前检查清单

### ✅ 第一步：准备工作
- [ ] 确认有 Jenkins 管理员权限
- [ ] 确认有 Web 服务器 SSH 访问权限
- [ ] 确认服务器用户具有 sudo 权限
- [ ] 知道你的 Web 服务器地址（域名或 IP）

### ✅ 第二步：SSH 密钥配置
- [ ] 已生成 SSH 密钥对（或使用现有密钥）
```bash
ssh-keygen -t rsa -b 4096 -C "jenkins-super-admin"
```
- [ ] 已将公钥添加到服务器 `~/.ssh/authorized_keys`
```bash
ssh-copy-id your-username@your-web-server.com
```
- [ ] 测试 SSH 连接成功
```bash
ssh your-username@your-web-server.com "echo 'SSH OK'"
```

### ✅ 第三步：Jenkins 凭据配置
- [ ] 在 Jenkins 中添加 SSH 凭据
  - 路径：Manage Jenkins > Manage Credentials > Global > Add Credentials
  - Kind: SSH Username with private key
  - **ID**: `web-server-ssh` (⚠️ 必须精确匹配)
  - **Username**: 你的服务器用户名
  - **Private Key**: 粘贴完整私钥内容

### ✅ 第四步：服务器权限配置
- [ ] 配置 sudoers 权限
```bash
sudo visudo
# 添加：your-username ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp, /bin/sed, /usr/bin/sed
```
- [ ] 测试 nginx 权限
```bash
ssh your-username@your-web-server.com "sudo nginx -v"
```

## 🚀 执行部署

### ✅ 第五步：运行 Jenkins 任务
- [ ] 在 Jenkins 中找到 Super Admin 部署任务
- [ ] 点击 "Build with Parameters"
- [ ] 设置参数：
  - **UPDATE_NGINX**: ✅ 勾选
  - **WEB_SERVER_HOST**: 输入你的服务器地址
- [ ] 点击 "Build" 开始执行

### ✅ 第六步：监控执行过程
在控制台日志中确认看到：
- [ ] `🔧 Building Super Admin application...`
- [ ] `📦 Deploying to S3 bucket: jr-sigma-survey-prod`
- [ ] `🔗 SSH connecting to web server`
- [ ] `🔧 Updating Nginx configuration`
- [ ] `✅ Backup created: .backup.TIMESTAMP`
- [ ] `🧪 Testing Nginx configuration...`
- [ ] `✅ Nginx configuration test passed`
- [ ] `🔄 Reloading Nginx...`
- [ ] `✅ Nginx reloaded successfully`

## ✅ 验证部署结果

### 第七步：功能验证
- [ ] S3 直接访问正常
```bash
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/
```
- [ ] 域名访问正常
```bash
curl -I https://sigma.jiangren.com.au/super-admin/
```
- [ ] 浏览器访问：https://sigma.jiangren.com.au/super-admin/
- [ ] SPA 路由工作：任意子路径都能正确显示应用

### 第八步：技术验证
- [ ] Nginx 配置正确
```bash
ssh your-username@your-web-server.com "sudo nginx -t"
```
- [ ] 备份文件已创建
```bash
ssh your-username@your-web-server.com "ls -la /etc/nginx/sites-available/*.backup.*"
```

## 🚨 如果出现问题

### 常见问题快速修复

**SSH 连接失败**
```bash
# 检查连接
ssh your-username@your-web-server.com
# 如果提示 "Host key verification failed"，输入 'yes' 确认
```

**权限不足**
```bash
# 重新配置 sudoers
sudo visudo
# 确保添加了正确的权限行
```

**Nginx 配置错误**
```bash
# 查看具体错误
sudo nginx -t

# 如需回滚
sudo cp /etc/nginx/sites-available/sigma.jiangren.com.au.backup.TIMESTAMP /etc/nginx/sites-available/sigma.jiangren.com.au
sudo nginx -s reload
```

## 📝 记录信息

部署完成后，记录以下信息：

- **部署时间**: ________________
- **Jenkins 构建编号**: ________________
- **Web 服务器地址**: ________________
- **备份文件路径**: ________________
- **测试结果**:
  - S3 直接访问: [ ] 成功 [ ] 失败
  - 域名访问: [ ] 成功 [ ] 失败
  - SPA 路由: [ ] 成功 [ ] 失败

## 🎉 成功标志

如果以上步骤都完成且验证通过，恭喜你！Super Admin 应用已成功部署到 S3 并通过 Nginx 反向代理实现域名访问。

**访问地址**:
- 开发测试: http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/
- 生产域名: https://sigma.jiangren.com.au/super-admin/

---

💡 **提示**: 完成 Super Admin 部署后，你可以按照类似步骤部署主前端（sigma Q）到 S3，实现完整的静态托管架构。
