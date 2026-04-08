# 🚀 Deploy ke input.arraayah.my.id

Setup Anda:
- **arraayah.my.id** → Nginx Proxy Manager
- **input.arraayah.my.id** → Frontend & Backend QR App

---

## 🏗️ Arsitektur

```
User Browser
     ↓
https://input.arraayah.my.id
     ↓
Nginx Proxy Manager (HTTPS termination)
     ↓
http://localhost:3000 (Frontend)
     ↓
http://localhost:8001 (Backend API)
```

---

## 🚀 Quick Deploy

### Step 1: Setup Environment

```bash
cd /path/to/input-qr-gpt

# Backend config
cat > backend/.env << 'EOF'
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///data/data.db
DB_ECHO=false
CORS_ORIGINS=["https://input.arraayah.my.id"]
DIST_DIR=dist
EOF
```

### Step 2: Deploy

```bash
# Build dan run
docker compose -f docker-compose.yml -f docker-compose.input.yml up -d --build
```

### Step 3: Setup Nginx Proxy Manager

Login ke Nginx Proxy Manager (https://arraayah.my.id):

**Tambahkan Proxy Host:**

1. Klik **Add Proxy Host**
2. **Domain Names:** `input.arraayah.my.id`
3. **Forward Hostname/IP:** `localhost` atau IP server Anda
4. **Forward Port:** `3000`
5. **Enable:**
   - ✅ Block Common Exploits
   - ✅ Websockets Support
6. **SSL Tab:**
   - ✅ Request a new SSL Certificate
   - ✅ Force SSL
   - ✅ HTTP/2 Support
7. **Advanced Tab** (jika perlu custom config):

```nginx
# Frontend
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Backend API - penting!
location /api/ {
    proxy_pass http://localhost:8001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# API Docs
location /docs {
    proxy_pass http://localhost:8001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

8. Klik **Save**

### Step 4: Test

```bash
# Test frontend
curl https://input.arraayah.my.id

# Test API
curl https://input.arraayah.my.id/api/data/?page=1&limit=1

# Test API docs
curl https://input.arraayah.my.id/docs
```

---

## 📋 Detailed Setup

### Option 1: Nginx Proxy Manager (Recommended)

Karena Anda sudah punya NPM di `arraayah.my.id`, ini cara termudah.

#### Konfigurasi Nginx Proxy Manager

**Proxy Host 1: Frontend**

| Setting | Value |
|---------|-------|
| Domain Names | `input.arraayah.my.id` |
| Forward Host | `localhost` |
| Forward Port | `3000` |
| Scheme | `http` |

**SSL Settings:**
- ✅ Request SSL Certificate
- ✅ Force SSL
- ✅ HTTP/2

**Custom Nginx Configuration (Advanced tab):**

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;

# Proxy API ke backend
location /api/ {
    proxy_pass http://localhost:8001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # File upload size
    client_max_body_size 50M;
}

# API Documentation
location /docs {
    proxy_pass http://localhost:8001/docs;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /openapi.json {
    proxy_pass http://localhost:8001/openapi.json;
    proxy_set_header Host $host;
}
```

---

### Option 2: Docker dengan Nginx di Container

Jika Anda ingin frontend container melayani API juga (via nginx proxy di container):

#### 1. Update docker-compose.input.yml

File ini sudah dibuat untuk Anda dengan konfigurasi yang tepat.

#### 2. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.input.yml up -d
```

#### 3. Point NPM ke Port 3000

Di Nginx Proxy Manager, forward ke port `3000`.

---

## 🔧 Troubleshooting

### Problem: CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

Pastikan `backend/.env` berisi:
```env
CORS_ORIGINS=["https://input.arraayah.my.id"]
```

Restart backend:
```bash
docker compose restart backend
```

---

### Problem: API 404 Not Found

**Cause:** Nginx Proxy Manager tidak forward `/api/` ke backend

**Solution:**

Di Nginx Proxy Manager → Advanced Tab, pastikan ada:

```nginx
location /api/ {
    proxy_pass http://localhost:8001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Atau test langsung ke backend:
```bash
curl http://localhost:8001/api/data/?page=1&limit=1
```

Jika ini bekerja tapi via NPM tidak, berarti masalah di konfigurasi NPM.

---

### Problem: Mixed Content Warning

**Cause:** Frontend HTTPS tapi API HTTP

**Solution:**

Pastikan semua akses via HTTPS:
- Frontend: `https://input.arraayah.my.id`
- API: `https://input.arraayah.my.id/api/...`

API client sudah otomatis menggunakan origin yang sama, jadi tidak perlu konfigurasi tambahan.

---

### Problem: WebSocket Error (jika pakai hot reload)

**Solution:**

Di Nginx Proxy Manager → Advanced:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## 📊 Monitoring

```bash
# Status
docker compose ps

# Logs
docker compose logs -f

# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend

# Test endpoints
curl https://input.arraayah.my.id
curl https://input.arraayah.my.id/api/data/?page=1&limit=1
curl https://input.arraayah.my.id/docs
```

---

## 🗄️ Database Backup

```bash
# Backup
docker cp qr-backend:/app/data/data.db ./backup-$(date +%Y%m%d).db

# Restore
docker compose stop backend
docker cp backup-20260408.db qr-backend:/app/data/data.db
docker compose start backend
```

---

## 🔄 Update/Redeploy

```bash
# Pull latest
git pull

# Rebuild & redeploy
docker compose -f docker-compose.yml -f docker-compose.input.yml up -d --build

# Done!
```

---

## ✅ Checklist After Deploy

- [ ] https://input.arraayah.my.id loads
- [ ] https://input.arraayah.my.id/api/data/?page=1&limit=1 returns data
- [ ] https://input.arraayah.my.id/docs accessible
- [ ] No CORS errors di browser console (F12)
- [ ] QR scanner works
- [ ] Data bisa di-submit
- [ ] SSL certificate valid (green padlock)

---

## 🎯 Quick Reference

| Service | URL |
|---------|-----|
| Frontend | https://input.arraayah.my.id |
| API | https://input.arraayah.my.id/api |
| API Docs | https://input.arraayah.my.id/docs |

| Container | Port |
|-----------|------|
| Backend | 8001 → 8000 |
| Frontend | 3000 → 80 |

---

**Domain:** https://input.arraayah.my.id  
**Last Updated:** 8 April 2026
