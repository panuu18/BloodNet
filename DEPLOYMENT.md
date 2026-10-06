# 🚀 BloodNet+ Deployment Guide

## 📋 Overview

This guide covers deploying BloodNet+ to various environments including development, staging, and production.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Database      │
│   (Nginx/HAProxy)│◄──►│   (Node.js)     │◄──►│  (MongoDB)      │
│   Port: 80/443   │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │  Socket.IO      │              │
         │              │  (WebSocket)    │              │
         │              └─────────────────┘              │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Static Files  │    │   File Storage  │    │   Cache/Session │
│   (React Build) │    │   (AWS S3)      │    │   (Redis)       │
│   Port: 3000     │    │                 │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### System Requirements
- **Node.js**: v14 or higher
- **MongoDB**: v4.4 or higher
- **Redis**: v6.0 or higher (optional, for caching)
- **Nginx**: v1.18 or higher (for production)
- **SSL Certificate**: For HTTPS

### Environment Variables
All environment variables must be set before deployment. See `.env.example` files for reference.

## 🌍 Deployment Options

### 1. Docker Deployment (Recommended)

#### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: bloodnet-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: bloodnet
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    ports:
      - "27017:27017"
    networks:
      - bloodnet-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: bloodnet-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - bloodnet-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bloodnet-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/bloodnet?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - redis
    networks:
      - bloodnet-network

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bloodnet-frontend
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
      REACT_APP_SOCKET_URL: http://localhost:5000
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - bloodnet-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: bloodnet-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/build:/usr/share/nginx/html:ro
    depends_on:
      - frontend
      - backend
    networks:
      - bloodnet-network

volumes:
  mongodb_data:
  redis_data:

networks:
  bloodnet-network:
    driver: bridge
```

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Socket.IO
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login rate limiting
        location /api/auth/login {
            limit_req zone=login burst=10 nodelay;
            proxy_pass http://backend;
        }

        # File uploads
        location /uploads/ {
            alias /app/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    }
}
```

#### Deployment Commands

```bash
# Create environment file
cp .env.example .env
# Edit .env with production values

# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Scale backend
docker-compose up -d --scale backend=3

# Update deployment
docker-compose pull
docker-compose up -d --build
```

### 2. Manual Deployment

#### Backend Deployment

```bash
# Clone repository
git clone https://github.com/your-username/bloodnet-plus.git
cd bloodnet-plus

# Backend setup
cd backend
npm ci --production

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=mongodb://localhost:27017/bloodnet
export JWT_SECRET=your_production_secret
export GOOGLE_MAPS_API_KEY=your_api_key

# Create directories
mkdir -p uploads logs

# Start with PM2
npm install -g pm2
pm2 start server.js --name bloodnet-backend
pm2 save
pm2 startup
```

#### Frontend Deployment

```bash
# Frontend setup
cd frontend
npm ci

# Build for production
export REACT_APP_API_URL=https://your-domain.com/api
export REACT_APP_SOCKET_URL=https://your-domain.com
npm run build

# Serve with Nginx
sudo cp -r build/* /var/www/html/
sudo systemctl reload nginx
```

#### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bloodnet-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

## ☁️ Cloud Deployment

### 1. AWS Deployment

#### EC2 Setup

```bash
# Create EC2 instance (Ubuntu 20.04)
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Clone and deploy
git clone https://github.com/your-username/bloodnet-plus.git
cd bloodnet-plus
docker-compose up -d --build
```

#### ECS Deployment

Create `task-definition.json`:

```json
{
  "family": "bloodnet",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "bloodnet-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/bloodnet-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bloodnet",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 2. Google Cloud Platform

#### Cloud Run Deployment

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/bloodnet-backend

# Deploy to Cloud Run
gcloud run deploy bloodnet-backend \
  --image gcr.io/PROJECT_ID/bloodnet-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=mongodb+srv://...
```

### 3. Heroku Deployment

#### Backend Procfile

Create `backend/Procfile`:

```
web: npm start
```

#### Deployment Commands

```bash
# Create Heroku app
heroku create bloodnet-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your_secret

# Deploy
git subtree push --prefix backend heroku main
```

## 🔒 Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall Configuration

```bash
# UFW setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 5000  # Block direct backend access
```

### Database Security

```bash
# MongoDB authentication
mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "secure_password",
    roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
  })

> use bloodnet
> db.createUser({
    user: "bloodnet_user",
    pwd: "secure_password",
    roles: ["readWrite"]
  })
```

## 📊 Monitoring & Logging

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Log aggregation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Checks

Create `healthcheck.js`:

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.4
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/bloodnet-plus
            git pull origin main
            docker-compose up -d --build
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   sudo netstat -tulpn | grep :5000
   sudo kill -9 PID
   ```

2. **MongoDB connection issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check logs
   sudo tail -f /var/log/mongodb/mongod.log
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check Node.js process memory
   ps aux | grep node
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
   ```

### Performance Optimization

1. **Database indexing**
   ```javascript
   // MongoDB indexes
   db.users.createIndex({ "location": "2dsphere" })
   db.requests.createIndex({ "bloodGroup": 1, "status": 1 })
   ```

2. **Caching strategy**
   ```javascript
   // Redis caching
   const redis = require('redis');
   const client = redis.createClient();
   
   // Cache API responses
   app.get('/api/stats', async (req, res) => {
     const cached = await client.get('stats');
     if (cached) return res.json(JSON.parse(cached));
     
     const stats = await getStats();
     await client.setex('stats', 300, JSON.stringify(stats));
     res.json(stats);
   });
   ```

## 📞 Support

For deployment support:
- Email: deploy-support@bloodnetplus.com
- Documentation: [Deploy Docs](https://docs.bloodnetplus.com/deploy)
- Issues: [GitHub Issues](https://github.com/your-username/bloodnet-plus/issues)

---

**Last Updated**: January 15, 2024
**Version**: v1.0.0
