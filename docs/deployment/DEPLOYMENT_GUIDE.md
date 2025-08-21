# 部署指南

## 已修复的问题

### 1. Frontend Dockerfile 问题

- **修复前**: 使用 `npm run dev` 开发模式
- **修复后**: 构建生产版本并使用 Nginx 服务静态文件

### 2. 环境变量问题

- **修复前**: `.env` 文件包含未解析的变量如 `${MONGO_URI}`
- **修复后**: 设置实际的环境变量值

### 3. 服务通信问题

- **修复前**: 前端和后端分别暴露端口，配置复杂
- **修复后**: 使用 Nginx 代理，统一通过80端口访问

### 4. 缺失文件问题

- **修复前**: 后端 Dockerfile 缺少 `questions.json` 等关键文件
- **修复后**: 添加所有必需文件和目录

## 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户请求       │    │   Nginx (80)    │    │  Backend (5050) │
│                │ ──→ │                │ ──→ │                │
│ localhost:80   │    │  - 静态文件      │    │  - API 服务     │
└─────────────────┘    │  - API 代理     │    │  - MongoDB 连接 │
                       └─────────────────┘    └─────────────────┘
```

## 部署文件说明

### 核心文件

1. **Dockerfile.frontend**: 构建前端生产镜像
    - 多阶段构建: deps → builder → nginx
    - 使用 Nginx 服务静态文件
    - 配置 API 代理到后端

2. **Dockerfile.backend**: 构建后端镜像
    - 安装生产依赖
    - 复制所有必需文件
    - 创建 uploads 目录

3. **docker-compose.yml**: 开发/测试环境
    - 使用本地 MongoDB
    - 简化配置

4. **docker-compose.prod.yml**: 生产环境
    - 包含 MongoDB 容器
    - 完整的环境变量配置
    - 数据持久化

5. **nginx.conf**: Nginx 配置
    - 处理客户端路由
    - API 代理到后端
    - 静态文件服务
    - 安全头设置

### 辅助脚本

1. **deploy.sh**: 本地部署脚本
    - 检查 Docker 状态
    - 清理旧容器
    - 构建并启动服务
    - 健康检查

2. **Jenkinsfile**: CI/CD 流水线
    - 自动化部署
    - 环境变量注入
    - 健康检查
    - 错误处理

## 使用方法

### 本地开发/测试

```bash
# 使用部署脚本（推荐）
./deploy.sh

# 或者手动执行
docker-compose up --build -d
```

### 生产环境

```bash
# 设置环境变量
export MONGO_ROOT_PASSWORD=your_secure_password
export ADMIN_USERNAME=your_admin
export ADMIN_PASSWORD=your_secure_admin_password

# 部署
docker-compose -f docker-compose.prod.yml up --build -d
```

### Jenkins CI/CD

Pipeline 会自动:

1. 从 Vault 获取环境变量
2. 生成 `.env` 文件
3. 构建并部署应用
4. 执行健康检查

## 访问地址

部署成功后访问:

- **应用首页**: http://localhost:80
- **管理后台**: http://localhost:80/admin
- **API 接口**: http://localhost:80/api

## 故障排除

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs frontend
```

### 重新部署

```bash
# 停止服务
docker-compose down

# 清理镜像
docker image prune -f

# 重新构建
docker-compose up --build -d
```

### 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 检查网络连接
docker network ls
docker network inspect survey_survey-network
```
