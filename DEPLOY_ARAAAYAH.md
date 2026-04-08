# 🚀 Panduan Deploy ke arraayah.my.id

Panduan lengkap untuk deploy aplikasi QR Input GPT ke Cloudflare Tunnel dengan domain **arraayah.my.id**.

---

## 📋 Checklist Sebelum Deploy

- [ ] Cloudflare Tunnel sudah aktif untuk `arraayah.my.id`
- [ ] Tunnel mengarah ke port yang benar (8001 untuk backend)
- [ ] Server sudah install Docker & Docker Compose
- [ ] Database backup sudah dibuat (jika update)
- [ ] Code sudah di-test di local

---

## 🚀 Quick Deploy (3 Langkah)

### Step 1: Setup Environment

```bash
cd /path/to/input-qr-gpt

# Copy environment file untuk domain Anda
cp backend/.env.arraayah backend/.env
```

### Step 2: Deploy dengan Docker

```bash
# Build dan deploy
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d --build

# Atau gunakan deploy script
./deploy.sh production
```

### Step 3: Verify

```bash
# Test backend API
curl https://arraayah.my.id/api/data/?page=1&limit=1

# Test frontend
curl https://arraayah.my.id

# Cek container status
docker compose ps
```

**✅ Selesai! Aplikasi sudah accessible di https://arraayah.my.id**

---

## 📖 Detailed Deployment Steps

### Option A: Deploy Backend + Frontend (Docker Compose)

Ini adalah cara recommended di mana backend dan frontend berjalan dalam Docker containers.

#### 1. Verify Cloudflare Tunnel

Pastikan tunnel sudah running dan mengarah ke backend:

```bash
# Cek apakah tunnel aktif
# Anda harus bisa akses ini dari browser:
curl https://arraayah.my.id/api/data/?page=1&limit=1
```

#### 2. Setup Environment Variables

```bash
cd /path/to/input-qr-gpt

# Backend config
cat > backend/.env << 'EOF'
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///data/data.db
DB_ECHO=false
CORS_ORIGINS=["https://arraayah.my.id"]
DIST_DIR=dist
EOF
```

#### 3. Build dan Deploy

```bash
# Build images
docker compose build

# Start services
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d

# Monitor startup
docker compose logs -f
```

#### 4. Health Check

```bash
# Cek containers running
docker compose ps

# Test API
curl -f https://arraayah.my.id/api/data/?page=1&limit=1

# Cek logs jika ada masalah
docker compose logs backend
docker compose logs frontend
```

---

### Option B: Deploy Backend Only + Cloudflare Tunnel

Gunakan ini jika Anda hanya ingin menjalankan backend dan Cloudflare Tunnel melayani semuanya.

#### 1. Setup Backend

```bash
cd /path/to/input-qr-gpt/backend

# Install dependencies (jika belum)
pip install -r requirements.txt

# Run backend
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### 2. Setup Cloudflare Tunnel

```bash
# Arahkan tunnel ke backend
cloudflared tunnel --url http://localhost:8001
```

Backend sekarang accessible di:
- API: `https://arraayah.my.id/api/...`
- Frontend: `https://arraayah.my.id/` (dilayani oleh backend SPA router)
- API Docs: `https://arraayah.my.id/docs`

---

### Option C: Development Mode dengan Tunnel

Untuk development dengan hot-reload tapi accessible via tunnel:

#### 1. Backend (Terminal 1)

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

#### 2. Cloudflare Tunnel (Terminal 2)

```bash
# Tunnel ke backend
cloudflared tunnel --url http://localhost:8001
```

#### 3. Frontend (Terminal 3)

```bash
cd frontend

# Buat .env dengan URL tunnel Anda
cat > .env << EOF
VITE_BACKEND_URL=https://arraayah.my.id
EOF

# Run frontend
npm run dev
```

---

## 🔧 Konfigurasi Cloudflare Tunnel

### Cek Tunnel Status

Login ke Cloudflare Dashboard:
1. Buka https://dash.cloudflare.com
2. Pilih domain `arraayah.my.id`
3. Menu **Zero Trust** → **Networks** → **Tunnels**
4. Cek status tunnel Anda

### Tunnel Configuration

Pastikan tunnel config mengarah ke port yang benar:

```yaml
# ~/.cloudflared/config.yml
tunnel: your-tunnel-name
credentials-file: /root/.cloudflared/your-tunnel.json

ingress:
  - hostname: arraayah.my.id
    service: http://localhost:8001  # Backend port
  - service: http_status:404
```

### Restart Tunnel (jika perlu)

```bash
# Jika pakai systemd
sudo systemctl restart cloudflared

# Jika manual
# Stop tunnel (Ctrl+C)
# Start lagi
cloudflared tunnel run your-tunnel-name
```

---

## 🗄️ Database Management

### Backup Database

```bash
# Backup dari Docker container
docker cp qr-backend:/app/data/data.db ./data-backup-$(date +%Y%m%d).db

# Compress
tar czf data-backup-$(date +%Y%m%d).tar.gz data-backup-*.db
rm data-backup-*.db
```

### Restore Database

```bash
# Stop backend
docker compose stop backend

# Restore
docker cp data-backup-20260408.db qr-backend:/app/data/data.db

# Start backend
docker compose start backend
```

### Reset Database (Fresh Start)

```bash
# Stop semua containers
docker compose down

# Hapus database
rm backend/data.db

# Start ulang
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# Export logs
docker compose logs backend > backend-$(date +%Y%m%d).log
```

### Container Health

```bash
# Check status
docker compose ps

# Detailed health check
docker inspect --format='{{.State.Health.Status}}' qr-backend

# Resource usage
docker stats
```

### Application Monitoring

Akses endpoint untuk cek status:

```bash
# API health
curl https://arraayah.my.id/api/data/?page=1&limit=1

# API documentation
curl https://arraayah.my.id/docs
```

---

## 🔄 Update/Redeploy

### Quick Update

```bash
cd /path/to/input-qr-gpt

# Pull latest code
git pull

# Rebuild dan redeploy
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d --build

# Done!
```

### Update dengan Deploy Script

```bash
# Jalankan deploy script
./deploy.sh production
```

Script akan otomatis:
1. Backup database
2. Pull latest code
3. Build images
4. Deploy containers
5. Health check
6. Show logs

---

## 🐛 Troubleshooting

### Problem: "CORS Error" di Browser

**Solution:**
```bash
# Pastikan backend/.env berisi:
CORS_ORIGINS=["https://arraayah.my.id"]

# Restart backend
docker compose restart backend
```

### Problem: "502 Bad Gateway"

**Cause:** Tunnel tidak bisa connect ke backend

**Solution:**
```bash
# Cek backend running
docker compose ps

# Cek backend logs
docker compose logs backend

# Test local access
curl http://localhost:8001/api/data/?page=1&limit=1

# Restart jika perlu
docker compose restart backend
```

### Problem: "404 Not Found"

**Check:**
1. Pastikan tunnel mengarah ke port 8001
2. Cek apakah backend melayani frontend SPA
3. Verifikasi file `frontend/dist/index.html` ada

```bash
# Cek dist files
ls -la backend/dist/

# Rebuild frontend
cd frontend && npm run build
```

### Problem: "Database Locked" atau SQLite Error

**Solution:**
```bash
# Fix permissions
chmod 666 backend/data.db

# Restart
docker compose restart backend
```

### Problem: Tunnel Tidak Connect

**Check:**
1. Cloudflare dashboard → cek tunnel status
2. Verify config file
3. Restart tunnel

```bash
# Restart tunnel service
sudo systemctl restart cloudflared
sudo systemctl status cloudflared

# Cek logs
sudo journalctl -u cloudflared -f
```

---

## 🔒 Security Checklist

- [x] HTTPS enabled via Cloudflare Tunnel ✅
- [x] CORS configured untuk domain spesifik ✅
- [x] Database backups automated ✅
- [ ] Environment variables tidak di-commit ✅
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Rate limiting configured (future)

---

## 📝 Useful Commands Reference

```bash
# Start
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d

# Stop
docker compose down

# Restart
docker compose restart

# Rebuild & restart
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d --build

# Logs
docker compose logs -f
docker compose logs --tail=100 backend

# Backup
docker cp qr-backend:/app/data/data.db ./backup.db

# Exec into container
docker exec -it qr-backend bash

# Cleanup
docker compose down -v  # Remove volumes too
docker system prune -a  # Remove all unused resources
```

---

## 🎯 Architecture for arraayah.my.id

```
User Browser
     ↓
https://arraayah.my.id
     ↓
Cloudflare Tunnel (HTTPS termination)
     ↓
http://localhost:8001
     ↓
┌────────────────────────────┐
│  Backend (FastAPI:8000)    │
│  ├─ API: /api/*            │
│  ├─ Docs: /docs            │
│  └─ SPA: /* (frontend)     │
│                            │
│  SQLite: /app/data/data.db │
└────────────────────────────┘
```

**Flow:**
1. User akses `https://arraayah.my.id`
2. Cloudflare Tunnel handle HTTPS
3. Tunnel forward ke `http://localhost:8001`
4. Backend FastAPI melayani:
   - `/api/*` → API endpoints
   - `/docs` → API documentation
   - `/*` → Frontend SPA (index.html)

---

## 📞 Quick Help

| Issue | Command |
|-------|---------|
| App tidak accessible | `docker compose ps` |
| API error | `docker compose logs backend` |
| Frontend error | `docker compose logs frontend` |
| Need to restart | `docker compose restart` |
| Full redeploy | `./deploy.sh production` |
| Backup DB | `docker cp qr-backend:/app/data/data.db ./backup.db` |

---

## ✅ Post-Deploy Checklist

Setelah deploy, pastikan:

- [ ] https://arraayah.my.id bisa diakses dari browser
- [ ] Login/form berfungsi (jika ada)
- [ ] QR scanner bekerja
- [ ] Data bisa di-submit dan tersimpan
- [ ] API docs accessible di https://arraayah.my.id/docs
- [ ] No errors di browser console (F12)
- [ ] Container health status "healthy"
- [ ] Logs clean (no repeated errors)

---

**Domain:** https://arraayah.my.id  
**Last Updated:** 8 April 2026
