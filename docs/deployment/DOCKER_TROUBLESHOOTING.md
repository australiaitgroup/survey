# Docker 部署故障排除指南

## 🚀 快速启动

```bash
# 1. 确保Docker运行
docker --version

# 2. 启动服务
./docker-start.sh

# 3. 测试部署
./docker-test.sh
```

## 🔧 常见问题和解决方案

### 1. Docker构建失败

**问题**: `docker build` 失败
**解决方案**:

```bash
# 清理Docker缓存
docker system prune -a

# 重新构建（无缓存）
docker build --no-cache -f Dockerfile.backend -t survey-backend .
```

### 2. 服务启动失败

**问题**: `docker-compose up` 失败
**解决方案**:

```bash
# 查看详细错误
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs mongodb

# 重启服务
docker-compose restart backend
```

### 3. 数据库连接问题

**问题**: Backend无法连接MongoDB
**症状**: 日志显示 "MongoDB connection error"

**解决方案**:

```bash
# 检查MongoDB容器状态
docker-compose ps mongodb

# 检查网络连接
docker-compose exec backend ping mongodb

# 检查MongoDB日志
docker-compose logs mongodb

# 重启MongoDB
docker-compose restart mongodb
```

### 4. 端口冲突

**问题**: 端口已被占用
**症状**: "port already in use" 错误

**解决方案**:

```bash
# 查看端口占用
lsof -i :5050
lsof -i :27017

# 停止冲突服务或修改docker-compose.yml端口配置
```

### 5. 权限问题

**问题**: 文件权限错误
**解决方案**:

```bash
# 修复uploads目录权限
sudo chown -R $(id -u):$(id -g) uploads/

# 重新构建镜像
docker-compose build backend
```

### 6. 环境变量问题

**问题**: 环境变量未正确加载
**检查**:

```bash
# 检查容器内环境变量
docker-compose exec backend env | grep MONGODB_URI

# 验证.env.docker文件存在且格式正确
cat .env.docker
```

## 🔍 调试命令

### 进入容器调试

```bash
# 进入backend容器
docker-compose exec backend sh

# 进入MongoDB容器
docker-compose exec mongodb mongosh

# 检查backend进程
docker-compose exec backend ps aux
```

### 查看详细日志

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看最近的日志
docker-compose logs --tail=50 backend

# 查看特定时间段日志
docker-compose logs --since="2h" backend
```

### 网络诊断

```bash
# 检查Docker网络
docker network ls
docker network inspect survey_survey-network

# 测试容器间连接
docker-compose exec backend ping mongodb
docker-compose exec backend wget -O- http://mongodb:27017
```

## 🧪 测试API

### 在容器内测试

```bash
# 进入backend容器
docker-compose exec backend sh

# 测试本地API
wget -O- http://localhost:5050/api/surveys

# 测试健康检查
wget -O- http://localhost:5050/api/surveys
```

### 从主机测试

```bash
# 如果暴露了端口（需要在docker-compose.yml中配置）
curl http://localhost:5050/api/surveys
```

## 📊 性能监控

### 资源使用

```bash
# 查看容器资源使用
docker stats

# 查看特定容器资源使用
docker stats survey_backend_1
```

### 磁盘使用

```bash
# 查看Docker空间使用
docker system df

# 清理未使用资源
docker system prune
```

## 🛠 完全重置

如果遇到无法解决的问题，可以完全重置：

```bash
# 1. 停止所有服务
docker-compose down

# 2. 删除容器和网络
docker-compose down --remove-orphans

# 3. 删除镜像
docker rmi survey-backend

# 4. 清理系统
docker system prune -a

# 5. 删除数据卷（谨慎使用，会丢失数据）
docker-compose down -v

# 6. 重新开始
./docker-start.sh
```

## 📝 日志收集

收集诊断信息：

```bash
# 创建诊断报告
echo "=== Docker Info ===" > docker-diagnosis.log
docker info >> docker-diagnosis.log

echo "=== Compose Services ===" >> docker-diagnosis.log
docker-compose ps >> docker-diagnosis.log

echo "=== Backend Logs ===" >> docker-diagnosis.log
docker-compose logs backend >> docker-diagnosis.log

echo "=== MongoDB Logs ===" >> docker-diagnosis.log
docker-compose logs mongodb >> docker-diagnosis.log
```
