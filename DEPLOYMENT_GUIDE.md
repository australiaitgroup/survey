# Sigma Survey Platform - 部署指南

## 重要问题诊断 ⚠️

### 真正的问题：路由配置错误
经过深入分析，发现问题不是端口配置，而是路由和应用部署问题：

**实际问题**:
1. 你访问的是主前端应用的注册页面 (`/admin/register`)，不是 Super Admin 应用
2. Nginx 将所有非 `/super-admin/*` 和非 `/api/*` 的请求都代理到 S3
3. **但 UAT S3 桶中只部署了 Super Admin 应用，没有主前端应用**
4. 所以访问 `/admin/register` 时找不到对应的页面和 API

**错误的解决方案** ❌:
- ~~修正 API 端口~~ （API 端口配置实际上可能是正确的）

**正确的解决方案** ✅:

### 方案一：部署主前端到 UAT S3 桶 (推荐)
1. **运行主前端 UAT 部署**:
   ```bash
   # 使用 Jenkinsfile_main_frontend_uat 将主前端部署到 UAT S3 桶
   # 这将把主前端应用（包含 /admin/register 路由）部署到 uat-sigma.jiangren.com.au 桶
   ```

2. **确保部署时不覆盖 Super Admin**:
   - Jenkinsfile_main_frontend_uat 已配置排除 `super-admin/*` 目录
   - 主前端和 Super Admin 可以共存在同一个 S3 桶中

3. **验证部署**:
   ```bash
   # 检查主前端首页
   curl -I https://uat-sigma.jiangren.com.au/
   
   # 检查注册页面
   curl -I https://uat-sigma.jiangren.com.au/admin/register
   
   # 检查 Super Admin 仍然可用
   curl -I https://uat-sigma.jiangren.com.au/super-admin/
   ```

4. **测试 API 端点**:
   ```bash
   # 测试注册 API
   curl -X POST https://uat-sigma.jiangren.com.au/api/admin/register \
     -H "Content-Type: application/json" \
     -d '{"name":"test","email":"test@example.com","password":"testpass123","companyName":"TestCorp"}'
   ```

### 方案二：修改 Nginx 配置代理到后端
如果你不想在 UAT 部署主前端，可以修改 Nginx 配置：
```nginx
# 将主前端的管理路由代理到后端
location /admin/ {
    proxy_pass http://localhost:5174/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 方案三：使用 Super Admin 进行管理 (最简单)
如果你只需要管理功能：
1. 直接访问 Super Admin：`https://uat-sigma.jiangren.com.au/super-admin/`
2. 使用 Super Admin 的现有功能进行用户和公司管理
3. 不需要单独的注册页面

## 部署环境概览

### UAT 环境
- **域名**: https://uat-sigma.jiangren.com.au
- **S3 桶**: uat-sigma.jiangren.com.au
- **主前端**: https://uat-sigma.jiangren.com.au/
- **Super Admin**: https://uat-sigma.jiangren.com.au/super-admin/

### 生产环境
- **域名**: https://sigma.jiangren.com.au
- **S3 桶**: sigma.jiangren.com.au
- **主前端**: https://sigma.jiangren.com.au/
- **Super Admin**: https://sigma.jiangren.com.au/super-admin/

## 可用的 Jenkins 文件

### 主前端部署
- `Jenkinsfile_main_frontend_uat` - UAT 环境主前端部署
- `Jenkinsfile_main_frontend_prod` - 生产环境主前端部署

### Super Admin 部署
- `Jenkinsfile_super_admin` - UAT 环境 Super Admin 部署  
- `Jenkinsfile_super_admin_prod` - 生产环境 Super Admin 部署

### 后端部署
- `Jenkinsfile` - 主后端部署
- `Jenkinsfile_uat` - UAT 环境后端部署
- `Jenkinsfile_super_admin_backend` - Super Admin 后端部署

## 部署流程

### 1. UAT 环境部署
```bash
# 部署主前端到 UAT
# 使用 Jenkinsfile_main_frontend_uat

# 部署 Super Admin 到 UAT  
# 使用 Jenkinsfile_super_admin
```

### 2. 生产环境部署
```bash
# 部署主前端到生产
# 使用 Jenkinsfile_main_frontend_prod

# 部署 Super Admin 到生产
# 使用 Jenkinsfile_super_admin_prod
```

## 重要注意事项

### S3 桶配置
- ✅ S3 桶已存在，无需重复创建
- ✅ 静态网站托管已配置
- ✅ 桶策略支持主前端和 Super Admin 共存

### 路由优先级
Nginx 配置需确保以下路由优先级：
1. `/api/*` → 后端服务器 (UAT: `localhost:5174`, 生产: `localhost:5173`)
2. `/super-admin/*` → S3 静态资源
3. `/*` → S3 静态资源（主前端）

**重要**: 确保 Nginx 配置中的端口与后端服务实际运行端口一致

### 部署安全
- 主前端部署时会排除 `super-admin/*` 目录，确保不会覆盖 Super Admin 文件
- Super Admin 部署时只更新 `super-admin/*` 目录，不影响主前端

### S3 桶配置
S3 桶名直接在各 Jenkinsfile 中硬编码：
- 生产环境: `sigma.jiangren.com.au`
- UAT 环境: `uat-sigma.jiangren.com.au`

## 故障排除

### 访问问题
1. 清除浏览器缓存（Ctrl+F5）
2. 清除 DNS 缓存
3. 检查浏览器控制台是否有 JavaScript 错误

### 路由问题
1. 验证 Nginx 配置的路由优先级
2. 确认 S3 静态网站托管配置正确
3. 检查 SPA 路由配置（index.html 作为错误页面）

### 部署验证
```bash
# 检查主前端
curl -I https://sigma.jiangren.com.au/

# 检查 Super Admin
curl -I https://sigma.jiangren.com.au/super-admin/

# 检查 API
curl -I https://sigma.jiangren.com.au/api/health
```

## 已清理的文件

以下文件已被清理或归档：
- ❌ `deploy-client-s3.sh` - 已删除（功能已被 Jenkins 文件替代）
- ❌ `diagnose-blank-page.sh` - 已删除（一次性诊断脚本）
- ❌ `diagnose-access-issue.sh` - 已删除（一次性诊断脚本）
- ❌ `diagnose-super-admin.sh` - 已删除（一次性诊断脚本）
- ❌ `Jenkinsfile_client_s3` - 已删除（桶名错误且功能重复）
- ❌ `.env.deploy` - 已删除（未被使用，桶名已在 Jenkinsfile 中硬编码）
- ❌ `.env.deploy.example` - 已删除（未被使用，桶名已在 Jenkinsfile 中硬编码）
- 📁 `Jenkinsfile_main_frontend` → `Jenkinsfile_main_frontend.backup` - 已归档（被专用文件替代）

## 新增文件

- ✅ `DEPLOYMENT_GUIDE.md` - 完整部署指南
- ✅ `update-nginx-ports.sh` - Nginx 端口配置修正脚本
- ✅ `diagnose-solution.sh` - 问题诊断和解决方案脚本

## 快速诊断

运行诊断脚本来快速识别问题：
```bash
./diagnose-solution.sh
```

该脚本会自动检查：
- 域名解析状态
- 主页面访问
- Super Admin 访问 
- /admin/register 路径访问
- API 端点状态
- S3 桶直接访问

并提供针对性的解决建议。

## 联系信息

如有部署问题，请参考：
- 技术文档: `/docs/` 目录
- Nginx 配置: `nginx-sigma-domain-prod.conf`
- Jenkins 配置: 各 Jenkinsfile 中的环境变量设置
