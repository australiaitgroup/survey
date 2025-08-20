# Jenkins SSH 自动化配置指南

## 前提条件

在开始之前，请确保你有：
- Jenkins 管理员权限
- Web 服务器的 SSH 访问权限
- Web 服务器用户具有 sudo 权限

## 1. 准备 SSH 密钥对

### 1.1 生成 SSH 密钥对（如果没有）

```bash
# 在你的本地机器或 Jenkins 服务器上生成密钥对
ssh-keygen -t rsa -b 4096 -C "jenkins-super-admin@your-domain.com"

# 默认位置：~/.ssh/id_rsa (私钥) 和 ~/.ssh/id_rsa.pub (公钥)
# 或指定文件名：
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jenkins_super_admin_key -C "jenkins-super-admin"
```

### 1.2 配置服务器 SSH 访问

```bash
# 方法 1: 使用 ssh-copy-id (推荐)
ssh-copy-id -i ~/.ssh/id_rsa.pub your-username@your-web-server.com

# 方法 2: 手动复制公钥
cat ~/.ssh/id_rsa.pub | ssh your-username@your-web-server.com \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# 方法 3: 如果是 AWS EC2，可能需要使用现有的 .pem 文件
# 将公钥内容添加到 ~/.ssh/authorized_keys
```

### 1.3 测试 SSH 连接

```bash
# 测试 SSH 连接
ssh your-username@your-web-server.com "echo 'SSH connection successful'"

# 测试 sudo 权限
ssh your-username@your-web-server.com "sudo nginx -v"
```

## 2. 在 Jenkins 中添加 SSH 凭据

### 2.1 创建 SSH 凭据（详细步骤）

1. **登录 Jenkins 管理界面**
   - 打开浏览器访问你的 Jenkins URL
   - 使用管理员账户登录

2. **进入凭据管理**
   - 点击左侧菜单 "Manage Jenkins"
   - 点击 "Manage Credentials"
   - 选择 "Global credentials (unrestricted)" 域
   - 点击 "Add Credentials"

3. **配置 SSH 凭据**
   - **Kind**: 选择 "SSH Username with private key"
   - **Scope**: 保持 "Global"
   - **ID**: 输入 `web-server-ssh` (⚠️ 必须与 Jenkinsfile 中一致)
   - **Description**: 输入 `Web Server SSH Access for Super Admin Deployment`
   - **Username**: 输入服务器用户名 (例如: `ubuntu`, `ec2-user`, `admin` 等)
   - **Private Key**: 选择 "Enter directly"

4. **添加私钥内容**
   ```bash
   # 在本地复制私钥内容
   cat ~/.ssh/id_rsa
   ```

   将输出的完整私钥内容粘贴到 Jenkins，格式应该是：
   ```
   -----BEGIN RSA PRIVATE KEY-----
   [私钥内容行...]
   -----END RSA PRIVATE KEY-----
   ```

5. **保存凭据**
   - 点击 "OK" 保存凭据

## 3. 配置服务器权限

### 3.1 设置 sudo 权限

在 Web 服务器上为 Jenkins 用户配置必要的 sudo 权限：

```bash
# 编辑 sudoers 文件
sudo visudo

# 添加以下行（替换 your-username 为实际用户名）：
# 为 Super Admin 部署配置最小权限
your-username ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp, /bin/sed, /usr/bin/sed, /bin/rm, /usr/bin/systemctl

# 或者如果需要更广泛的权限（不推荐生产环境）：
# your-username ALL=(ALL) NOPASSWD: ALL
```

### 3.2 验证权限配置

```bash
# 测试 nginx 命令权限
ssh your-username@your-web-server.com "sudo nginx -v"

# 测试配置文件访问权限
ssh your-username@your-web-server.com "sudo nginx -t"

# 测试重载权限
ssh your-username@your-web-server.com "sudo nginx -s reload"
```

## 4. 运行 Jenkins 自动化部署

### 4.1 通过 Web UI 运行（推荐）

1. **找到 Super Admin 部署任务**
   - 在 Jenkins 首页找到对应的任务
   - 任务名称可能是："Super Admin S3 Deployment" 或类似名称

2. **启动参数化构建**
   - 点击任务名称进入任务详情页
   - 点击左侧 "Build with Parameters" 按钮

3. **设置关键参数**
   - **UPDATE_NGINX**: ✅ 勾选（启用 Nginx 自动配置）
   - **WEB_SERVER_HOST**: 输入你的服务器地址
     - 示例: `sigma.jiangren.com.au`
     - 示例: `123.456.789.10`
     - 示例: `ec2-xx-xxx-xxx-xxx.ap-southeast-2.compute.amazonaws.com`

4. **开始构建**
   - 检查参数设置无误后点击 "Build"
   - 可以点击构建编号查看实时日志

### 4.2 构建过程监控

在 Jenkins 控制台日志中，你将看到以下关键步骤：

```
🔧 Building Super Admin application...
✅ Build completed successfully

📦 Deploying to S3 bucket: jr-sigma-survey-prod
✅ S3 deployment completed

🔗 SSH connecting to web server: your-server.com
✅ SSH connection established

🔧 Updating Nginx configuration for Super Admin...
📤 Copying configuration files to web server...
✅ Backup created: /etc/nginx/sites-available/sigma.jiangren.com.au.backup.20240819_143022

🧪 Testing Nginx configuration...
nginx: configuration file /etc/nginx/nginx.conf test is successful
✅ Nginx configuration test passed

🔄 Reloading Nginx...
✅ Nginx reloaded successfully

🌐 Super Admin deployment completed!
🔗 Available at: https://sigma.jiangren.com.au/super-admin
```

### 4.3 通过 Jenkins API 触发（高级）

```bash
# 使用 Jenkins API 触发构建
curl -X POST "http://your-jenkins.com/job/super-admin-deployment/buildWithParameters" \
  --user "username:api-token" \
  --data "UPDATE_NGINX=true&WEB_SERVER_HOST=sigma.jiangren.com.au"

# 获取 API Token 的方法：
# Jenkins > 用户名(右上角) > Configure > API Token > Add new Token
```

## 5. 验证部署结果

### 5.1 自动验证

Jenkins Pipeline 会自动执行以下验证：

```bash
# 1. 测试 S3 直接访问
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/

# 2. 测试域名代理访问
curl -I https://sigma.jiangren.com.au/super-admin/

# 3. 检查 Nginx 配置语法
sudo nginx -t

# 4. 验证 Nginx 进程状态
sudo systemctl status nginx
```

### 5.2 手动验证

**浏览器测试：**
- 直接访问：http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/
- 域名访问：https://sigma.jiangren.com.au/super-admin/

**命令行测试：**
```bash
# 测试响应状态
curl -s -o /dev/null -w "%{http_code}" https://sigma.jiangren.com.au/super-admin/

# 测试重定向（应该返回 200）
curl -L https://sigma.jiangren.com.au/super-admin

# 检查 SPA 路由（应该返回 index.html）
curl https://sigma.jiangren.com.au/super-admin/some-path
```

## 6. 故障排除指南

### 6.1 SSH 连接问题

**问题：Jenkins 无法连接到服务器**
```bash
# 排查步骤：
1. 检查 SSH 凭据配置是否正确
2. 验证服务器网络可达性：
   ping your-web-server.com

3. 测试端口连通性：
   telnet your-web-server.com 22

4. 检查 SSH 服务状态：
   ssh your-username@your-web-server.com "sudo systemctl status ssh"

5. 查看 SSH 日志：
   sudo tail -f /var/log/auth.log
```

**解决方案：**
- 确保 SSH 密钥格式正确（包含完整的 BEGIN/END 标记）
- 检查服务器防火墙设置
- 验证用户名和密钥匹配

### 6.2 权限问题

**问题：sudo 权限不足**
```bash
# 排查：
sudo -l  # 查看当前用户 sudo 权限

# 解决：重新配置 sudoers
sudo visudo
# 添加：your-username ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp, /bin/sed, /usr/bin/sed
```

### 6.3 Nginx 配置问题

**问题：Nginx 配置测试失败**
```bash
# 排查：
sudo nginx -t  # 查看具体错误信息

# 常见问题和解决方案：
1. 语法错误：检查配置文件格式
2. 端口冲突：检查是否有重复的 listen 指令
3. 文件权限：确保配置文件可读

# 恢复备份：
sudo cp /etc/nginx/sites-available/sigma.jiangren.com.au.backup.TIMESTAMP \
        /etc/nginx/sites-available/sigma.jiangren.com.au
sudo nginx -s reload
```

### 6.4 S3 访问问题

**问题：S3 返回 403 或 404**
```bash
# 检查 S3 桶配置：
aws s3 ls s3://jr-sigma-survey-prod/super-admin/

# 测试 S3 网站端点：
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html

# 检查桶策略和权限
```

## 7. 配置详解

### 7.1 自动添加的 Nginx 配置

Jenkins 会自动在你的 Nginx 配置中添加：

```nginx
# Super Admin 应用代理到 S3
location /super-admin/ {
    proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
    proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 移除 S3 响应头中的敏感信息
    proxy_hide_header x-amz-id-2;
    proxy_hide_header x-amz-request-id;
    proxy_hide_header x-amz-meta-server-side-encryption;
    proxy_hide_header x-amz-server-side-encryption;

    # SPA 路由支持
    proxy_intercept_errors on;
    error_page 404 = @super_admin_spa;
}

# 处理没有尾部斜杠的请求
location = /super-admin {
    return 301 $scheme://$host/super-admin/;
}

# SPA 路由回退处理
location @super_admin_spa {
    proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/index.html;
    proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
}
```

### 7.2 智能配置逻辑

Pipeline 会：
1. **检查重复配置**：如果 Super Admin 配置已存在，跳过添加
2. **创建备份**：修改前自动创建带时间戳的备份文件
3. **语法验证**：使用 `nginx -t` 验证配置正确性
4. **优雅重载**：使用 `nginx -s reload` 实现无中断更新
5. **错误回滚**：如果出现错误，自动恢复原配置

## 8. 安全最佳实践

### 8.1 SSH 安全配置

```bash
# 1. 使用专用密钥对
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jenkins_super_admin_key

# 2. 限制 SSH 访问源 IP（在服务器上）
sudo nano /etc/ssh/sshd_config
# 添加：AllowUsers your-username@jenkins-server-ip

# 3. 禁用密码认证（仅使用密钥）
PasswordAuthentication no
PubkeyAuthentication yes

# 4. 重启 SSH 服务
sudo systemctl restart ssh
```

### 8.2 最小权限原则

```bash
# 推荐的 sudoers 配置（最小权限）
your-username ALL=(ALL) NOPASSWD: \
  /usr/sbin/nginx -t, \
  /usr/sbin/nginx -s reload, \
  /usr/sbin/nginx -s reopen, \
  /bin/cp /tmp/nginx-super-admin-*.conf /etc/nginx/sites-available/, \
  /bin/sed -i* /etc/nginx/sites-available/sigma.jiangren.com.au

# 避免使用（过于宽泛）：
# your-username ALL=(ALL) NOPASSWD: ALL
```

### 8.3 审计和监控

```bash
# 1. 启用 SSH 审计日志
sudo nano /etc/ssh/sshd_config
# 添加：LogLevel VERBOSE

# 2. 监控 Nginx 配置变更
sudo auditctl -w /etc/nginx/sites-available/ -p wa -k nginx_config_changes

# 3. 设置日志轮转
sudo logrotate -f /etc/logrotate.d/nginx
```

## 9. 部署后验证清单

### 9.1 功能验证
- [ ] S3 直接访问正常：http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/
- [ ] 域名访问正常：https://sigma.jiangren.com.au/super-admin/
- [ ] SPA 路由工作：https://sigma.jiangren.com.au/super-admin/any-path 返回应用首页
- [ ] 重定向正常：https://sigma.jiangren.com.au/super-admin 自动重定向到带斜杠版本
- [ ] HTTPS 证书有效（如果配置了 SSL）

### 9.2 技术验证
- [ ] Nginx 配置语法正确：`sudo nginx -t`
- [ ] Nginx 进程运行正常：`sudo systemctl status nginx`
- [ ] 备份文件已创建：`ls /etc/nginx/sites-available/*.backup.*`
- [ ] SSH 连接安全：仅允许密钥认证
- [ ] 日志记录正常：检查 `/var/log/nginx/access.log`

### 9.3 性能验证
```bash
# 响应时间测试
curl -o /dev/null -s -w "Time: %{time_total}s\nStatus: %{http_code}\n" \
  https://sigma.jiangren.com.au/super-admin/

# 负载测试（可选）
ab -n 100 -c 10 https://sigma.jiangren.com.au/super-admin/
```

## 10. 紧急回滚程序

### 10.1 自动回滚（如果 Jenkins 检测到问题）

Jenkins Pipeline 包含自动回滚机制：

```groovy
// 如果 Nginx 测试失败，自动恢复备份
if (nginxTestResult != 0) {
    sh "sudo cp /etc/nginx/sites-available/sigma.jiangren.com.au.backup.${timestamp} /etc/nginx/sites-available/sigma.jiangren.com.au"
    sh "sudo nginx -s reload"
    error "Nginx configuration failed, rolled back to previous version"
}
```

### 10.2 手动回滚步骤

**紧急情况下的快速回滚：**

```bash
# 1. SSH 登录到 Web 服务器
ssh your-username@your-web-server.com

# 2. 查看可用的备份文件
ls -la /etc/nginx/sites-available/sigma.jiangren.com.au.backup.*

# 3. 恢复最新的备份（替换时间戳）
sudo cp /etc/nginx/sites-available/sigma.jiangren.com.au.backup.20240819_143022 \
        /etc/nginx/sites-available/sigma.jiangren.com.au

# 4. 测试配置
sudo nginx -t

# 5. 如果测试通过，重新加载
sudo nginx -s reload

# 6. 验证网站访问
curl -I https://sigma.jiangren.com.au/super-admin/
```

## 11. 常见问题 FAQ

### Q1: Jenkins 显示 "Host key verification failed"
**A:** SSH 首次连接需要确认主机密钥。解决方法：
```bash
# 在 Jenkins 服务器上手动连接一次
ssh your-username@your-web-server.com
# 输入 'yes' 确认主机密钥
```

### Q2: Nginx 重载失败，提示 "Permission denied"
**A:** 检查 sudoers 配置，确保包含 nginx 重载权限：
```bash
sudo visudo
# 确保包含：your-username ALL=(ALL) NOPASSWD: /usr/sbin/nginx
```

### Q3: S3 返回 403 Forbidden
**A:** 检查 S3 桶策略和静态网站托管配置：
```bash
# 验证桶策略允许公开读取
aws s3api get-bucket-policy --bucket jr-sigma-survey-prod
```

### Q4: 域名访问返回 502 Bad Gateway
**A:** 通常是 S3 端点不可达，检查：
- S3 桶的静态网站托管是否启用
- DNS 解析是否正确
- 网络连接是否正常

### Q5: SPA 路由不工作，刷新页面显示 404
**A:** 检查 Nginx 配置中的 SPA 回退处理是否正确配置。

## 12. 下一步：主前端迁移

Super Admin 部署成功后，你可以考虑将主前端（sigma Q）也迁移到 S3：

- **相关文件**：`Jenkinsfile_client_s3`、`deploy-client-s3.sh`
- **文档**：`docs/FRONTEND_S3_MIGRATION.md`
- **配置**：根路径代理到 S3，保持 `/super-admin` 子路径

这样可以实现：
- `https://sigma.jiangren.com.au/` → 主前端（S3 托管）
- `https://sigma.jiangren.com.au/super-admin/` → Super Admin（S3 托管）

---

🎉 **恭喜！** 按照以上步骤，你的 Super Admin 应用将通过 Jenkins 自动化部署到 S3，并通过 Nginx 反向代理实现域名访问。
