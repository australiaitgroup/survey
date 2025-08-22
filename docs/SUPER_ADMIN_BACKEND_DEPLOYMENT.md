# Super Admin Backend 部署方案

## 概述

由于发现生产环境已经在 `server.js` 中配置了 Super Admin 路由，我们改用后端服务部署方案，无需修改 Nginx 配置。

## 现有后端路由配置

在 `server.js` 中已存在：

```javascript
if (process.env.NODE_ENV === 'production') {
    app.get('/super-admin', (req, res) => {
        res.redirect('/super-admin/login');
    });

    app.get('/super-admin/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'super-admin', 'public', 'pages', 'login.html'));
    });

    app.get('/super-admin/*', (req, res) => {
        res.sendFile(path.join(__dirname, 'super-admin', 'dist', 'index.html'));
    });

    app.use('/super-admin', express.static(path.join(__dirname, 'super-admin', 'dist')));
}
```

## 部署流程

### 1. 使用新的 Jenkinsfile

文件：`Jenkinsfile_super_admin_backend`

**特点：**
- 支持 UAT 和生产环境选择
- 构建后直接部署到后端服务器
- 自动重启后端服务
- 包含部署验证

### 2. 部署目标

- **UAT**: `ubuntu@13.211.147.113:/home/ubuntu/survey-backend/super-admin/`
- **生产**: `ubuntu@54.153.254.26:/home/ubuntu/survey-backend/super-admin/`

### 3. 访问地址

- **UAT**: https://uat-sigma.jiangren.com.au/super-admin/
- **生产**: https://sigma.jiangren.com.au/super-admin/

## 优势

1. **无需 Nginx 权限** - 利用现有后端路由
2. **统一服务** - Super Admin 与主应用共享同一后端服务
3. **简化部署** - 直接文件同步，无需 S3 配置
4. **SPA 路由支持** - 后端已配置 SPA fallback 到 index.html

## 执行步骤

1. 在 Jenkins 中创建新任务，使用 `Jenkinsfile_super_admin_backend`
2. 选择目标环境（UAT 或 生产）
3. 执行部署
4. 验证访问 URL

## 注意事项

- 部署会重启后端服务（可能短暂影响主应用）
- 确保后端服务器有足够权限访问目标目录
- 首次部署可能需要手动创建目录结构

## 与 S3 方案对比

| 方案 | 优势 | 劣势 |
|------|------|------|
| S3 | 独立服务，不影响后端 | 需要 Nginx 配置权限 |
| 后端服务 | 无需额外配置，利用现有路由 | 重启时短暂影响主应用 |

选择后端服务方案是当前最可行的解决方案。
