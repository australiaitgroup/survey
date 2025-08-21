# Docker测试环境要求

## 🔧 基础环境要求

### 1. Docker Engine

**最低版本**: Docker 20.10+

```bash
# 检查Docker版本
docker --version
docker version

# 检查Docker运行状态
docker info
```

### 2. Docker Compose

**最低版本**: Docker Compose 2.0+

```bash
# 检查Compose版本
docker-compose --version
# 或新版本语法
docker compose version
```

### 3. 系统资源

- **内存**: 至少 4GB 可用内存
- **磁盘**: 至少 10GB 可用空间
- **CPU**: 至少 2核心

```bash
# 检查系统资源
free -h          # Linux内存
df -h            # 磁盘空间
top              # CPU使用率
```

## 📦 必要组件清单

### 1. Docker守护进程

```bash
# 启动Docker服务 (Linux)
sudo systemctl start docker
sudo systemctl enable docker

# macOS - 启动Docker Desktop
open /Applications/Docker.app
```

### 2. 网络端口

确保以下端口可用：

- **80**: Frontend (Nginx)
- **5050**: Backend API
- **27017**: MongoDB (如使用本地)

```bash
# 检查端口占用
netstat -tulpn | grep -E ':80|:5050|:27017'
lsof -i :80
lsof -i :5050
```

### 3. 环境文件

```bash
# 必需的环境文件
.env                    # 环境变量
docker-compose.yml      # 服务配置
Dockerfile.frontend     # 前端镜像
Dockerfile.backend      # 后端镜像
nginx.conf             # Nginx配置
```

## 🧪 Docker测试步骤

### 步骤1: 环境检查

```bash
# 运行环境检查脚本
./check_docker_env.sh
```

### 步骤2: 基础Docker测试

```bash
# 测试Docker基本功能
docker run hello-world

# 测试镜像拉取
docker pull alpine:latest
docker run alpine:latest echo "Docker正常工作"
```

### 步骤3: 网络测试

```bash
# 创建测试网络
docker network create test-network

# 测试容器通信
docker run -d --name test1 --network test-network alpine sleep 3600
docker run --rm --network test-network alpine ping -c 3 test1

# 清理测试
docker stop test1 && docker rm test1
docker network rm test-network
```

### 步骤4: 存储测试

```bash
# 测试卷挂载
docker run -v $(pwd):/test alpine ls /test

# 测试权限
docker run -v $(pwd):/test alpine touch /test/docker-test.txt
ls -la docker-test.txt
rm docker-test.txt
```

## 🚨 常见问题排查

### 1. Docker守护进程未运行

```bash
# 错误信息: "Cannot connect to the Docker daemon"
# 解决方案:
sudo systemctl start docker        # Linux
# 或启动Docker Desktop             # macOS/Windows
```

### 2. 权限问题

```bash
# Linux用户权限
sudo usermod -aG docker $USER
newgrp docker
```

### 3. 端口被占用

```bash
# 查找占用进程
sudo lsof -i :80
sudo kill -9 <PID>
```

### 4. 磁盘空间不足

```bash
# 清理Docker资源
docker system prune -af --volumes
docker image prune -af
```

## 📋 快速检查清单

- [ ] Docker Engine >= 20.10
- [ ] Docker Compose >= 2.0
- [ ] 至少4GB可用内存
- [ ] 至少10GB可用磁盘
- [ ] 端口80, 5050, 27017可用
- [ ] Docker守护进程运行中
- [ ] 用户有Docker权限
- [ ] 网络连接正常
- [ ] 环境文件存在且格式正确

## 🛠️ 故障排除工具

### 自动检查脚本

```bash
# 全面环境检查
./check_docker_env.sh

# Docker专项测试
./test_docker_functionality.sh

# 应用部署测试
./test_backend.sh
```

### 手动检查命令

```bash
# Docker状态
docker info
docker version
docker-compose version

# 系统资源
free -h && df -h && uptime

# 网络端口
netstat -tulpn | head -20

# 进程状态
ps aux | grep docker
```
