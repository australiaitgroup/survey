# Survey AI - Docker Setup

This project uses a **multi-container Docker setup** with separate frontend and backend services.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   Container     │    │   Container     │
│   Port: 5173    │◄──►│   Port: 5050    │
│   (Vite Dev)    │    │   (Express API) │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                    │
         ┌─────────────────┐
         │   Browser       │
         │   Port: 5173    │
         └─────────────────┘
```

## Quick Start

### 1. Build and Run All Services

```bash
# Build and start both frontend and backend
docker-compose up --build -d
```

### 2. Access the Application

- **Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5173/admin
- **Backend API**: http://localhost:5050/api

### 3. Stop All Services

```bash
docker-compose down
```

## Individual Services

### Backend Service

- **Port**: 5050
- **Dockerfile**: `Dockerfile.backend`
- **Purpose**: Express.js API server
- **Database**: MongoDB Atlas

```bash
# Build backend only
docker build -f Dockerfile.backend -t survey-backend .

# Run backend only
docker run -p 5050:5050 survey-backend
```

### Frontend Service

- **Port**: 5173
- **Dockerfile**: `Dockerfile.frontend`
- **Purpose**: React + Vite development server
- **Features**: Hot reload, API proxy

```bash
# Build frontend only
docker build -f Dockerfile.frontend -t survey-frontend .

# Run frontend only
docker run -p 5173:5173 survey-frontend
```

## Docker Compose Configuration

### Services

- **backend**: Express.js API server
- **frontend**: React development server
- **survey-network**: Internal Docker network

### Environment Variables

```yaml
backend:
    - MONGODB_URI: MongoDB connection string
    - ADMIN_USERNAME: admin
    - ADMIN_PASSWORD: password
    - PORT: 5050
    - NODE_ENV: production

frontend:
    - VITE_BASE_URL: http://localhost:5050
```

## Development Workflow

### 1. Start Development Environment

```bash
docker-compose up -d
```

### 2. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Access Containers

```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh
```

### 4. Rebuild After Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and restart
docker-compose up --build -d
```

## API Testing

### Public Endpoints

```bash
# List surveys
curl http://localhost:5050/api/surveys

# Get survey by slug
curl http://localhost:5050/api/survey/test-survey

# Submit response
curl -X POST http://localhost:5050/api/surveys/{id}/responses \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","surveyId":"{id}","answers":["answer1","answer2"]}'
```

### Admin Endpoints

```bash
# Login
curl -X POST http://localhost:5050/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get token from response and use it
TOKEN="your-jwt-token"

# List all surveys (admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:5050/api/admin/surveys

# Create survey
curl -X POST http://localhost:5050/api/admin/surveys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Survey","description":"Test Description"}'
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :5050
lsof -i :5173

# Stop conflicting services
docker-compose down
```

#### 2. Frontend Can't Connect to Backend

- Check if backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify Vite proxy configuration in `client/vite.config.ts`

#### 3. MongoDB Connection Issues

- Verify `MONGODB_URI` environment variable
- Check network connectivity
- Review backend logs for connection errors

#### 4. Build Failures

```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up --build -d
```

### Debug Commands

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# View real-time logs
docker-compose logs -f --tail=100

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check container resources
docker stats
```

## Production Deployment

### For Production, consider:

1. **Build frontend for production** (not dev server)
2. **Use Nginx** to serve static files
3. **Add SSL/TLS** certificates
4. **Set up monitoring** and logging
5. **Use environment-specific** configurations

### Production Dockerfile Example

```dockerfile
# Build frontend for production
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production nginx server
FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## File Structure

```
survey/
├── Dockerfile.backend          # Backend container
├── Dockerfile.frontend         # Frontend container
├── docker-compose.yml          # Multi-service orchestration
├── .dockerignore              # Docker build exclusions
├── DOCKER_README.md           # This file
├── test-docker.md             # Testing guide
├── server.js                  # Express backend
├── client/                    # React frontend
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
└── ...
```

## Environment Variables

Create a `.env` file for local development:

```env
MONGODB_URI=mongodb+srv://...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
PORT=5050
NODE_ENV=development
```

## Security Notes

1. **Never commit** `.env` files with sensitive data
2. **Use secrets management** in production
3. **Regular security updates** for base images
4. **Network isolation** between containers
5. **Non-root users** in containers
