# 部署指南 - 多租户架构自动迁移

本文档描述了如何部署支持多租户架构的Survey系统，包括自动数据迁移。

## 📋 概述

系统现在支持多租户架构，允许不同公司拥有相同slug的surveys。部署过程包含自动数据迁移，确保现有数据平滑过渡到新架构。

## 🚀 自动部署流程

### 快速部署命令

```bash
# UAT环境部署
npm run deploy:uat

# 生产环境部署  
npm run deploy:prod
```

### 部署流程说明

#### 1. 部署前检查 (`scripts/pre-deploy.sh`)
- ✅ 验证环境配置
- ✅ 创建数据库备份
- ✅ 运行安全检查
- ✅ 分析迁移需求（干运行模式）

#### 2. 部署后迁移 (`scripts/post-deploy.sh`)
- ✅ 等待应用启动
- ✅ 执行数据库迁移
- ✅ 验证迁移结果
- ✅ 运行冒烟测试
- ✅ 发送部署通知

## 🔧 环境变量配置

### 必需环境变量
```bash
# 数据库连接
MONGODB_URI=mongodb://username:password@host:port/database

# 部署环境
DEPLOY_ENV=uat|prod|production
NODE_ENV=production
```

### 可选迁移配置
```bash
# 迁移控制
AUTO_MIGRATE_SURVEYS=true          # 是否自动迁移 (默认: true)
MIGRATION_DRY_RUN=false             # 干运行模式 (默认: false)
MIGRATION_BACKUP=true               # 是否创建备份 (默认: true)
MIGRATION_LOG_LEVEL=info            # 日志级别 (默认: info)

# 默认公司配置
DEFAULT_COMPANY_SLUG=default        # 默认公司slug (默认: default)

# 应用配置
APP_URL=http://localhost:5050       # 应用URL，用于健康检查
```

### 通知配置
```bash
# Webhook通知 (可选)
DEPLOYMENT_WEBHOOK_URL=https://hooks.slack.com/...
```

## 📊 迁移策略

### 自动迁移行为
1. **创建默认公司**: 如不存在，创建slug为`default`的公司
2. **迁移旧数据**: 将所有`companyId`为空的surveys分配给默认公司
3. **解决冲突**: 自动重命名冲突的slug（保持第一个不变，其他添加后缀）
4. **验证完整性**: 确保所有surveys都有`companyId`

### 数据隔离
- ✅ 不同公司可以有相同slug的surveys
- ✅ 多租户路由：`/:companySlug/assessment/:slug`
- ✅ 向后兼容：现有非多租户URL继续工作
- ✅ 遗留数据访问：多租户路由可以fallback到遗留数据

## 🛠️ 手动迁移选项

如果需要更精细的控制，可以使用交互式迁移工具：

```bash
# 交互式迁移 (需要手动输入)
npm run migrate

# 只分析，不执行更改
npm run migrate:analyze

# 干运行模式
npm run migrate:dry-run

# 自动迁移 (与部署中相同)
npm run migrate:auto
```

## 🔍 部署验证

### 健康检查端点
```bash
# 基础健康检查
GET /api/health

# 响应示例
{
  "uptime": 123.45,
  "message": "OK", 
  "timestamp": "2025-08-30T04:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "database": "connected"
}
```

### 功能验证
```bash
# 测试非多租户访问
curl http://localhost:5050/api/assessment/legacy-slug

# 测试多租户访问  
curl http://localhost:5050/company-slug/api/assessment/survey-slug

# 测试数据隔离
curl http://localhost:5050/company1/api/assessment/shared-slug
curl http://localhost:5050/company2/api/assessment/shared-slug
```

## 🏗️ CI/CD集成

### GitHub Actions示例

```yaml
name: Deploy to UAT
on:
  push:
    branches: [uat]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run pre-deployment checks
        env:
          MONGODB_URI: ${{ secrets.UAT_MONGODB_URI }}
          DEPLOY_ENV: uat
        run: npm run deploy:pre
      
      - name: Deploy application
        # 你的部署逻辑 (Docker, AWS, 等)
        run: |
          # 部署应用到UAT环境
          echo "Deploying application..."
      
      - name: Run post-deployment migration
        env:
          MONGODB_URI: ${{ secrets.UAT_MONGODB_URI }}
          DEPLOY_ENV: uat
          APP_URL: https://uat.sigmaq.co
        run: npm run deploy:post
```

### Docker部署示例

```dockerfile
# Dockerfile中的迁移步骤
FROM node:20-alpine

# ... 应用构建步骤 ...

# 添加部署脚本
COPY scripts/ ./scripts/
RUN chmod +x scripts/*.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/api/health || exit 1

# 启动命令可以包含迁移
CMD ["sh", "-c", "npm run deploy:post && npm start"]
```

## 📈 监控和警报

### 关键指标
- 迁移执行时间
- 失败率
- 数据完整性
- 应用响应时间

### 日志位置
- 应用日志: `stdout/stderr`
- 迁移日志: 控制台输出
- 备份位置: `./backups/YYYYMMDD_HHMMSS/`

## 🚨 故障排除

### 常见问题

1. **迁移失败**
   ```bash
   # 检查日志
   npm run migrate:analyze
   
   # 手动运行迁移
   npm run migrate
   ```

2. **数据库连接失败**
   ```bash
   # 验证环境变量
   echo $MONGODB_URI
   
   # 测试连接
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"
   ```

3. **索引冲突**
   - 检查是否有重复的slug
   - 手动解决slug冲突
   - 删除旧的全局唯一索引

### 回滚流程
1. 停止新版本应用
2. 从备份恢复数据库
3. 部署旧版本应用
4. 验证功能正常

## 📞 支持

如果遇到部署问题：
1. 检查环境变量配置
2. 查看迁移日志
3. 验证数据库连接
4. 联系开发团队