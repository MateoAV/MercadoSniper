# MercadoSniper Deployment Guide 🚀

This guide covers different deployment strategies for MercadoSniper, from local development to production deployment.

## Table of Contents
- [Quick Start with Docker](#quick-start-with-docker)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Quick Start with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM recommended
- 10GB+ free disk space

### 1. Clone and Setup
```bash
git clone https://github.com/yourusername/mercadosniper.git
cd mercadosniper
```

### 2. Start the Application
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Development Deployment

### Development Environment
```bash
# Use development override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or use the development-specific compose file
docker-compose -f docker-compose.dev.yml up -d
```

### Development Features
- **Hot Reloading**: Code changes automatically restart services
- **Debug Logging**: Verbose logging for development
- **Volume Mounts**: Source code mounted for live editing
- **Development Database**: Separate dev database instance

### Manual Development Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:socket_app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Production Deployment

### 1. Environment Configuration

Create production environment files:

```bash
# Backend environment
cat > backend/.env.prod << EOF
DATABASE_URL=mongodb://admin:SECURE_PASSWORD@mongo:27017/mercadosniper?authSource=admin
DATABASE_NAME=mercadosniper
REDIS_URL=redis://:SECURE_REDIS_PASSWORD@redis:6379
DEBUG=false
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
SECRET_KEY=GENERATE_A_SECURE_SECRET_KEY_HERE
LOG_LEVEL=INFO
SCRAPING_DELAY_MIN=2.0
SCRAPING_DELAY_MAX=5.0
EOF

# Frontend environment
cat > frontend/.env.prod << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=MercadoSniper
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
```

### 2. Production Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.yml --profile production up -d
```

### 3. SSL/HTTPS Setup

Create nginx configuration:
```bash
mkdir -p nginx
cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }
    
    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
```

### 4. Database Backup Strategy

```bash
# Create backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
docker exec mercadosniper-mongo mongodump --authenticationDatabase admin -u admin -p password123 --out /backup/\$DATE
docker exec mercadosniper-mongo tar -czf /backup/backup_\$DATE.tar.gz /backup/\$DATE
EOF

chmod +x backup.sh

# Schedule daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## Cloud Deployment

### AWS ECS Deployment

1. **Build and Push Images**
```bash
# Build images
docker build -t mercadosniper-backend ./backend
docker build -t mercadosniper-frontend ./frontend

# Tag for ECR
docker tag mercadosniper-backend:latest 123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-backend:latest
docker tag mercadosniper-frontend:latest 123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-frontend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-backend:latest
docker push 123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-frontend:latest
```

2. **ECS Task Definition**
```json
{
  "family": "mercadosniper",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-backend:latest",
      "portMappings": [{"containerPort": 8000}],
      "environment": [
        {"name": "DATABASE_URL", "value": "mongodb://your-atlas-cluster"},
        {"name": "REDIS_URL", "value": "redis://your-elasticache-cluster"}
      ]
    },
    {
      "name": "frontend", 
      "image": "123456789012.dkr.ecr.region.amazonaws.com/mercadosniper-frontend:latest",
      "portMappings": [{"containerPort": 3000}]
    }
  ]
}
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: mercadosniper
services:
- name: backend
  source_dir: /backend
  github:
    repo: yourusername/mercadosniper
    branch: main
  run_command: uvicorn main:socket_app --host 0.0.0.0 --port 8080
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${DATABASE_URL}
  - key: REDIS_URL
    value: ${REDIS_URL}
  http_port: 8080

- name: frontend
  source_dir: /frontend
  github:
    repo: yourusername/mercadosniper
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: ${backend.RENDERED_URL}
  http_port: 3000

databases:
- name: mercadosniper-db
  engine: MONGODB
  version: "5"
  size: db-s-1vcpu-1gb
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://user:pass@host:27017/db` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379` |
| `SECRET_KEY` | Application secret key | `your-secret-key-here` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["https://yourdomain.com"]` |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `https://api.yourdomain.com` |

### Security Configuration

```bash
# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate strong passwords
openssl rand -base64 32
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps

# Check individual service health
curl http://localhost:8000/health
curl http://localhost:3000

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongo
```

### Monitoring Setup

```yaml
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Monitor application metrics
curl http://localhost:8000/metrics
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
docker-compose logs mongo

# Test connection
docker exec -it mercadosniper-mongo mongosh --host localhost --port 27017 -u admin -p password123
```

**Frontend Build Failed**
```bash
# Clear Next.js cache
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

**Backend Import Errors**
```bash
# Check Python path
docker-compose exec backend python -c "import sys; print(sys.path)"

# Reinstall dependencies
docker-compose exec backend pip install -r requirements.txt
```

**WebSocket Connection Issues**
```bash
# Check CORS settings
docker-compose logs backend | grep CORS

# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8000/ws/test
```

### Performance Issues

**Slow Scraping**
```bash
# Adjust scraping delays
export SCRAPING_DELAY_MIN=0.5
export SCRAPING_DELAY_MAX=2.0
docker-compose restart backend
```

**High Memory Usage**
```bash
# Monitor memory usage
docker stats

# Restart services if needed
docker-compose restart
```

### Logs and Debugging

```bash
# Follow all logs
docker-compose logs -f

# Debug specific service
docker-compose logs -f backend

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Scaling and Load Balancing

### Horizontal Scaling

```yaml
# Scale services
services:
  backend:
    deploy:
      replicas: 3
  
  frontend:
    deploy:
      replicas: 2
```

### Load Balancer Configuration

```nginx
upstream backend_servers {
    server backend-1:8000;
    server backend-2:8000;
    server backend-3:8000;
}

upstream frontend_servers {
    server frontend-1:3000;
    server frontend-2:3000;
}
```

---

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review logs: `docker-compose logs`
3. Create an issue on GitHub with deployment details
4. Check the [GitHub Discussions](https://github.com/yourusername/mercadosniper/discussions) for community help

**Happy Deploying! 🚀** 