# Simple Deployment Guide

This guide provides a simplified deployment process without nginx.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed (for building client)
- Port 5050 available

## Quick Start

1. **Clone and prepare**

    ```bash
    git clone <your-repo>
    cd survey
    ```

2. **Configure environment**

    ```bash
    cp .env.example .env
    # Edit .env file with your settings (especially ADMIN_USERNAME and ADMIN_PASSWORD)
    ```

3. **Deploy**
    ```bash
    ./deploy-simple.sh
    ```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Build client**

    ```bash
    cd client
    npm install
    npm run build
    cd ..
    ```

2. **Start services**

    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d
    ```

3. **Check status**
    ```bash
    docker-compose -f docker-compose.prod.yml ps
    ```

## Access Application

- Application URL: `http://your-server:5050`
- Admin panel: `http://your-server:5050/admin`

## Minimum Required Environment Variables

```env
MONGODB_URI=mongodb://mongodb:27017/survey
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

## Optional Features

### Enable Stripe Payments

Uncomment and set in `.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Change Port

```env
PORT=8080
```

## Troubleshooting

### View logs

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Restart services

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Check container health

```bash
docker ps
docker logs survey-app-1
```

## Cloud Deployment Tips

### For AWS/GCP/Azure:

1. Open port 5050 in security group/firewall
2. Use public IP or domain name
3. Consider using environment variables instead of .env file

### For Heroku/Railway:

1. Set environment variables in platform dashboard
2. MongoDB can use MongoDB Atlas (free tier available)
3. Remove Docker, use plain Node.js deployment

## Security Notes

1. Always change default admin credentials
2. Use strong passwords
3. Enable HTTPS in production (use reverse proxy like Caddy)
4. Keep MongoDB port (27017) closed to public

## Support

If deployment fails, check:

1. Docker daemon is running
2. Ports are not in use
3. Environment variables are set correctly
4. Logs for specific errors
