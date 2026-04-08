# 🚀 Panduan Staging & Deployment

Panduan lengkap untuk staging dan deployment aplikasi QR Input GPT ke berbagai environment.

## 📋 Table of Contents

- [Arsitektur](#arsitektur)
- [Environment Setup](#environment-setup)
  - [Development](#development)
  - [Staging](#staging)
  - [Production](#production)
- [Deployment Options](#deployment-options)
  - [Option 1: Docker Compose (VPS)](#option-1-docker-compose-vps)
  - [Option 2: Cloudflare Tunnel](#option-2-cloudflare-tunnel)
  - [Option 3: Nginx Reverse Proxy](#option-3-nginx-reverse-proxy)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Database Migration](#database-migration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [CI/CD Pipeline (Optional)](#cicd-pipeline-optional)

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                    User/Browser                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │   Cloudflare Tunnel     │  (Optional, untuk akses remote)
         │   atau Nginx Proxy      │
         └─────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │    Frontend (Nginx:80)       │  React SPA
    │    /api/ → Backend proxy     │
    └──────────┬───────────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │    Backend (FastAPI:8000)    │  REST API
    │    SQLite Database           │
    └──────────────────────────────┘
```

---

## 🌍 Environment Setup

### Development

**Lingkungan:** Lokal developer machine  
**Tujuan:** Development dan testing

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
npm install
npm run dev
```

**URL:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

### Staging

**Lingkungan:** Server testing/QA  
**Tujuan:** Testing sebelum production

```bash
# Deploy ke staging server
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

**URL Example:**
- Staging: https://staging.yourdomain.com
- Backend API: https://staging.yourdomain.com/api

### Production

**Lingkungan:** Production server  
**Tujuan:** Live untuk users

```bash
# Deploy ke production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**URL Example:**
- Production: https://app.yourdomain.com
- Backend API: https://app.yourdomain.com/api

---

## 🚀 Deployment Options

### Option 1: Docker Compose (VPS)

**Use Case:** Deploy ke VPS/server langsung

#### Kelebihan:
- ✅ Simple dan mudah
- ✅ Tidak perlu orchestration tools
- ✅ Cocok untuk single server

#### Kekurangan:
- ❌ Tidak auto-scale
- ❌ Manual deployment

#### Requirements:
- Docker & Docker Compose installed
- Minimum 1GB RAM
- Linux server (Ubuntu/Debian recommended)

---

### Option 2: Cloudflare Tunnel

**Use Case:** Akses dari internet tanpa public IP/port forwarding

#### Kelebihan:
- ✅ Tidak perlu public IP
- ✅ SSL otomatis dari Cloudflare
- ✅ Gratis
- ✅ Aman (tidak buka port)

#### Kekurangan:
- ❌ Depend on Cloudflare
- ❌ Slightly higher latency

#### Requirements:
- Cloudflare account (gratis)
- Domain di Cloudflare (optional)

---

### Option 3: Nginx Reverse Proxy

**Use Case:** Production dengan custom domain & SSL

#### Kelebihan:
- ✅ Full control
- ✅ Best performance
- ✅ Multiple apps di satu server

#### Kekurangan:
- ❌ Lebih kompleks setup
- ❌ Manage SSL certificates manual

#### Requirements:
- Nginx installed
- Domain & DNS configured
- SSL certificates (Let's Encrypt)

---

## 📦 Step-by-Step Deployment

### A. Persiapan Server

#### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group (optional, untuk run tanpa sudo)
sudo usermod -aG docker $USER
newgrp docker

# Test
docker --version
docker compose version
```

#### 2. Clone Repository

```bash
# Clone dari Git
git clone https://github.com/yourusername/input-qr-gpt.git
cd input-qr-gpt

# Atau copy manual via SCP
scp -r /path/to/local/input-qr-gpt user@server:/path/to/
```

#### 3. Setup Environment Variables

**Backend (.env):**
```bash
cd backend
cat > .env << 'EOF'
# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite+aiosqlite:///data/data.db
DB_ECHO=false

# CORS - GANTI DENGAN DOMAIN ANDA!
CORS_ORIGINS=["https://yourdomain.com"]

# SSL (optional, jika tidak pakai reverse proxy)
# SSL_KEYFILE=/path/to/key.pem
# SSL_CERTFILE=/path/to/cert.pem

# Frontend dist path
DIST_DIR=dist
EOF
```

**Frontend (.env):**
```bash
cd ../frontend
cat > .env << 'EOF'
# Untuk production build
# Kosongkan jika backend dan frontend di domain yang sama
# VITE_API_BASE=https://api.yourdomain.com
EOF
```

### B. Deploy dengan Docker Compose

#### 1. Build Images

```bash
cd /path/to/input-qr-gpt

# Build semua services
docker compose build

# Atau build terpisah
docker compose build backend
docker compose build frontend
```

#### 2. Run Services

```bash
# Start semua services
docker compose up -d

# Cek status
docker compose ps

# Cek logs
docker compose logs -f

# Cek logs service tertentu
docker compose logs -f backend
docker compose logs -f frontend
```

#### 3. Verify Deployment

```bash
# Test backend API
curl http://localhost:8001/api/data/?page=1&limit=1

# Test frontend
curl http://localhost:3000

# Cek container health
docker inspect --format='{{.State.Health.Status}}' qr-backend
```

### C. Setup Cloudflare Tunnel (Optional)

#### 1. Install Cloudflared

```bash
# Download binary
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Test
cloudflared --version
```

#### 2. Run Tunnel

```bash
# Quick tunnel (temporary, gratis)
cloudflared tunnel --url http://localhost:8001

# Anda akan dapat URL seperti:
# https://abc123-def456.trycloudflare.com
```

**Untuk permanent tunnel:**

```bash
# Login ke Cloudflare
cloudflared tunnel login

# Buat tunnel
cloudflared tunnel create qr-app

# Buat config
cat > ~/.cloudflared/config.yml << EOF
tunnel: qr-app
credentials-file: /root/.cloudflared/qr-app.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:8001
  - service: http_status:404
EOF

# Route ke DNS (jika pakai Cloudflare DNS)
cloudflared tunnel route dns qr-app yourdomain.com

# Run tunnel
cloudflared tunnel run qr-app
```

#### 3. Setup sebagai Service (systemd)

```bash
# Buat systemd service
sudo cat > /etc/systemd/system/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run qr-app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable dan start
sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Cek status
sudo systemctl status cloudflared
```

### D. Setup Nginx Reverse Proxy (Optional)

#### 1. Install Nginx

```bash
sudo apt install -y nginx
```

#### 2. Konfigurasi Nginx

```bash
sudo cat > /etc/nginx/sites-available/qr-app << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS (setelah SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (jika diperlukan)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend docs
    location /docs {
        proxy_pass http://localhost:8001/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File upload size limit (optional)
    client_max_body_size 50M;
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/qr-app /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### 3. Setup SSL dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (sudah otomatis, tapi bisa test)
sudo certbot renew --dry-run
```

---

## 🗄️ Database Migration

### Backup Database

```bash
# Backup SQLite database
docker exec qr-backend tar czf /tmp/data.db.backup.tar.gz -C /app/data data.db
docker cp qr-backend:/tmp/data.db.backup.tar.gz ./backup_$(date +%Y%m%d_%H%M%S).tar.gz

# Atau langsung copy
docker cp qr-backend:/app/data/data.db ./data.db.backup
```

### Restore Database

```bash
# Stop backend
docker compose stop backend

# Copy database file
docker cp data.db.backup qr-backend:/app/data/data.db

# Start backend
docker compose start backend
```

### Reset Database

```bash
# Delete database file
docker compose down

# Remove volume
docker volume rm input-qr-gpt_backend_data  # sesuaikan nama volume

# Recreate
docker compose up -d
```

---

## 🔒 SSL/HTTPS Setup

### Option 1: Cloudflare Tunnel (Easiest)

✅ **Otomatis HTTPS** - Tidak perlu setup SSL manual

```bash
cloudflared tunnel --url http://localhost:8001
# URL sudah HTTPS: https://abc123.trycloudflare.com
```

### Option 2: Let's Encrypt dengan Certbot

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Option 3: Self-Signed SSL (Development Only)

```bash
# Generate self-signed cert
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout /etc/ssl/private/qr-app.key \
  -out /etc/ssl/certs/qr-app.crt

# Update nginx config untuk SSL
# ... (tambahkan ssl_certificate dan ssl_certificate_key)
```

---

## 📊 Monitoring & Logs

### Docker Logs

```bash
# Lihat semua logs
docker compose logs -f

# Lihat logs backend saja
docker compose logs -f backend

# Lihat 100 baris terakhir
docker compose logs --tail=100 backend

# Export logs ke file
docker compose logs backend > backend_$(date +%Y%m%d).log
```

### Container Health

```bash
# Cek status containers
docker compose ps

# Cek health backend
docker inspect --format='{{.State.Health.Status}}' qr-backend

# Cek logs healthcheck
docker inspect qr-backend | grep -A 10 Health
```

### Resource Usage

```bash
# Cek CPU & Memory usage
docker stats

# Cek disk usage
docker system df

# Cleanup unused resources
docker system prune -a
```

### Application Logs

Backend logs akan menampilkan:
- API requests
- Database queries (jika DB_ECHO=true)
- Errors dan warnings

```bash
# Real-time monitoring
docker compose logs -f backend | grep -i error

# Filter specific logs
docker compose logs backend | grep "POST /api/data"
```

---

## 💾 Backup & Restore

### Automated Backup Script

```bash
# Buat backup script
cat > /path/to/input-qr-gpt/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="qr-app-backup-$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker cp qr-backend:/app/data/data.db $BACKUP_DIR/$BACKUP_NAME.db

# Compress
cd $BACKUP_DIR
tar czf $BACKUP_NAME.tar.gz $BACKUP_NAME.db
rm $BACKUP_NAME.db

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
EOF

chmod +x /path/to/input-qr-gpt/backup.sh
```

### Cron Job untuk Backup

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/input-qr-gpt/backup.sh >> /var/log/qr-app-backup.log 2>&1
```

### Restore from Backup

```bash
# Extract backup
tar xzf qr-app-backup-20260408_020000.tar.gz

# Stop backend
docker compose stop backend

# Restore database
docker cp qr-app-backup-20260408_020000.db qr-backend:/app/data/data.db

# Start backend
docker compose start backend
```

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run backend tests
        run: |
          cd backend
          pytest
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '22'
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/input-qr-gpt
            git pull
            docker compose down
            docker compose build
            docker compose up -d
```

### Manual Deployment Script

```bash
# Buat deploy script
cat > deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Pull latest code
git pull

# Build new images
echo "📦 Building Docker images..."
docker compose build

# Stop old containers
echo "🛑 Stopping old containers..."
docker compose down

# Start new containers
echo "✅ Starting new containers..."
docker compose up -d

# Health check
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Verify deployment
echo "🔍 Verifying deployment..."
curl -f http://localhost:8001/api/data/?page=1&limit=1 || {
  echo "❌ Health check failed!"
  exit 1
}

echo "✅ Deployment successful!"
EOF

chmod +x deploy.sh
```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Code sudah di-test di staging/development
- [ ] Semua tests passing (`pytest` dan `npm run build`)
- [ ] Environment variables sudah dikonfigurasi
- [ ] Database backup sudah dibuat
- [ ] SSL certificates ready (jika production)
- [ ] Domain DNS sudah pointing ke server

### Deployment

- [ ] Pull latest code dari Git
- [ ] Build Docker images
- [ ] Stop old containers
- [ ] Start new containers
- [ ] Health check passed
- [ ] API endpoints accessible
- [ ] Frontend loading correctly

### Post-Deployment

- [ ] Test semua fitur utama
- [ ] Cek logs untuk errors
- [ ] Verify database connection
- [ ] Test API endpoints
- [ ] Test from different browsers/devices
- [ ] Monitor performance (CPU, Memory)
- [ ] Update documentation jika perlu

---

## 🆘 Troubleshooting Deployment

### Container Tidak Start

```bash
# Cek logs
docker compose logs backend

# Cek port conflicts
sudo lsof -i :8001
sudo lsof -i :3000

# Cek Docker daemon
sudo systemctl status docker
```

### Database Error

```bash
# Cek file permissions
ls -la backend/data.db

# Fix permissions
chmod 666 backend/data.db
```

### CORS Error di Production

```bash
# Update CORS_ORIGINS di backend/.env
CORS_ORIGINS=["https://yourdomain.com"]

# Restart backend
docker compose restart backend
```

### Frontend Tidak Bisa Connect ke Backend

```bash
# Cek nginx config
docker exec qr-frontend cat /etc/nginx/conf.d/default.conf

# Test connectivity dari dalam container
docker exec qr-frontend curl http://backend:8000/api/data/?page=1&limit=1
```

---

## 📚 Quick Reference

### Useful Commands

```bash
# Start aplikasi
docker compose up -d

# Stop aplikasi
docker compose down

# Restart service
docker compose restart backend

# Rebuild dan restart
docker compose up -d --build

# Lihat logs
docker compose logs -f

# Exec into container
docker exec -it qr-backend bash

# Backup database
docker cp qr-backend:/app/data/data.db ./backup.db

# Cleanup
docker compose down -v  # Hapus volumes juga
docker system prune -a  # Hapus semua unused resources
```

### File Locations

```
Backend:
  - Config: /app/config.py
  - Database: /app/data/data.db
  - Logs: docker logs qr-backend

Frontend:
  - Build: /app/dist
  - Config: /app/vite.config.js
  - Nginx: /etc/nginx/conf.d/default.conf
```

---

## 🎯 Environment Comparison

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Server** | Local Machine | Test Server | Live Server |
| **Database** | SQLite (dev) | SQLite (test) | SQLite/PostgreSQL |
| **CORS** | `["*"]` | Specific domain | Specific domain |
| **SSL** | Optional | Recommended | Required |
| **Debug Mode** | ON | OFF | OFF |
| **Auto-reload** | ON | OFF | OFF |
| **Backup** | Manual | Automated | Automated + Offsite |
| **Monitoring** | Basic | Standard | Full Monitoring |

---

## 📞 Support

Jika ada masalah saat deployment:

1. Cek logs: `docker compose logs -f`
2. Cek health: `docker compose ps`
3. Test API: `curl http://localhost:8001/docs`
4. Lihat [TROUBLESHOOTING_TUNNEL.md](./TROUBLESHOOTING_TUNNEL.md)
5. Lihat [SOLUSI_TUNNEL.md](./SOLUSI_TUNNEL.md)

---

**Last Updated:** 8 April 2026
