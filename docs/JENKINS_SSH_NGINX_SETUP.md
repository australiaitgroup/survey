# Jenkins SSH Nginx 自动化设置指南

## 概述
本文档详细说明如何设置 Jenkins SSH 凭据，以便自动化配置 Nginx 反向代理，实现通过域名 `https://sigma.jiangren.com.au/super-admin/` 访问 S3 上的 Super Admin 应用。

## 前提条件

### 1. S3 部署已完成
- Super Admin 应用已成功部署到 S3
- S3 静态网站托管已配置
- 可通过 `http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/` 访问

### 2. 服务器信息
- 域名：`sigma.jiangren.com.au`
- 服务器 IP：需要提供
- 服务器用户：通常是 `ubuntu`
- 服务器必须安装 Nginx

## Jenkins 配置步骤

### 步骤 1：添加 SSH 私钥到 Jenkins

1. **获取 SSH 私钥**
   ```bash
   # 在你的本地机器上，如果还没有密钥对，生成一个
   ssh-keygen -t rsa -b 4096 -C "jenkins@yourdomain.com"

   # 复制私钥内容
   cat ~/.ssh/id_rsa
   ```

2. **在 Jenkins 中添加凭据**
   - 进入 Jenkins 管理界面
   - 导航到：Manage Jenkins → Manage Credentials
   - 选择适当的域（通常是 Global）
   - 点击 "Add Credentials"
   - 配置如下：
     ```
     Kind: SSH Username with private key
     ID: web-server-ssh
     Username: ubuntu
     Private Key: Enter directly (粘贴私钥内容)
     Passphrase: (如果有的话)
     ```

### 步骤 2：配置服务器 SSH 访问

1. **添加公钥到服务器**
   ```bash
   # 复制公钥到服务器
   ssh-copy-id ubuntu@YOUR_SERVER_IP

   # 或者手动添加
   cat ~/.ssh/id_rsa.pub | ssh ubuntu@YOUR_SERVER_IP 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
   ```

2. **确保服务器权限正确**
   ```bash
   ssh ubuntu@YOUR_SERVER_IP
   sudo chmod 700 ~/.ssh
   sudo chmod 600 ~/.ssh/authorized_keys
   ```

### 步骤 3：验证 SSH 连接

```bash
# 从 Jenkins 服务器测试连接
ssh -o StrictHostKeyChecking=no ubuntu@YOUR_SERVER_IP 'echo "SSH connection successful"'
```

### 步骤 4：确保 Sudo 权限

确保 Jenkins 可以通过 SSH 执行 sudo 命令：

```bash
# 在目标服务器上
sudo visudo

# 添加以下行（如果不存在）
ubuntu ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl, /bin/cp, /bin/sed, /usr/bin/tee
```

## 运行 Jenkins 任务

### 基本部署（仅 S3）
```
参数：
UPDATE_NGINX: false
WEB_SERVER_HOST: (留空)
```

### 完整部署（S3 + Nginx）
```
参数：
UPDATE_NGINX: true
WEB_SERVER_HOST: YOUR_SERVER_IP_OR_HOSTNAME
```

## 预期结果

### 成功部署后：
1. **S3 直接访问**：`http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/`
2. **域名访问**：`https://sigma.jiangren.com.au/super-admin/`

### Nginx 配置会自动添加：
```nginx
# Super Admin S3 Reverse Proxy
location /super-admin/ {
    proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
    proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Handle S3 redirects
    proxy_redirect http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/ /super-admin/;
    proxy_redirect http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/ /super-admin/;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/;
        proxy_set_header Host jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 故障排查

### 常见问题：

1. **SSH 连接失败**
   - 检查 SSH 私钥是否正确添加到 Jenkins
   - 验证公钥是否在服务器 `~/.ssh/authorized_keys` 中
   - 检查服务器防火墙设置

2. **Nginx 配置失败**
   - 检查 sudo 权限配置
   - 验证 Nginx 是否已安装
   - 检查 `/etc/nginx/sites-available/default` 文件权限

3. **域名访问失败**
   - 确认 DNS 解析正确指向服务器
   - 检查 SSL 证书配置
   - 验证 Nginx 是否正常重新加载

### 手动验证命令：

```bash
# 测试 S3 访问
curl -I http://jr-sigma-survey-prod.s3-website-ap-southeast-2.amazonaws.com/super-admin/

# 测试域名代理
curl -I https://sigma.jiangren.com.au/super-admin/

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 下一步

1. 配置 Jenkins SSH 凭据 (`web-server-ssh`)
2. 提供服务器 IP 地址
3. 运行 Jenkins 任务，参数设置：
   - `UPDATE_NGINX=true`
   - `WEB_SERVER_HOST=YOUR_SERVER_IP`
4. 验证 `https://sigma.jiangren.com.au/super-admin/` 访问

---

**注意**：首次运行时建议先测试 `UPDATE_NGINX=false`，确保 S3 部署正常，然后再运行完整的 `UPDATE_NGINX=true` 版本。
