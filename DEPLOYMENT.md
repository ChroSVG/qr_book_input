# 🚀 Unified Docker Compose Deployment

This project uses a **single docker-compose.yml** file with multiple environment configurations.

---

## 📋 Available Environments

| Environment | Domain | Description | Command |
|-------------|--------|-------------|---------|
| **Development** | `localhost:3000` | Local development with open CORS | `docker compose up -d --build` |
| **Staging** | `localhost:3000` | Staging with permissive CORS | `ENV=staging docker compose up -d --build` |
| **Input** | `input.arraayah.my.id` | Production for input service | `ENV=input docker compose up -d --build` |
| **Arraayah** | `arraayah.my.id` | Production for main domain | `ENV=arraayah docker compose up -d --build` |

---

## 🎯 Quick Start

### Deploy to Development (Default)
```bash
docker compose up -d --build
```

### Deploy to Production (input.arraayah.my.id)
```bash
ENV=input docker compose up -d --build
```

### Using Deploy Script
```bash
./deploy-env.sh input      # Deploy to input.arraayah.my.id
./deploy-env.sh arraayah   # Deploy to arraayah.my.id
./deploy-env.sh staging    # Deploy to staging
```

---

## 🔧 Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Default development configuration |
| `.env.input` | Production configuration for input.arraayah.my.id |
| `.env.arraayah` | Production configuration for arraayah.my.id |
| `.env.staging` | Staging environment configuration |

---

## 🌐 Access Points

After deployment:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

---

## 📝 Environment Variables

### Backend Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite+aiosqlite:///data/data.db` |
| `DB_ECHO` | Enable SQL query logging | `true` / `false` |
| `CORS_ORIGINS` | Allowed origins | `["https://input.arraayah.my.id"]` |
| `API_KEY` | API key for authentication | `your-secret-key` |
| `DIST_DIR` | Frontend dist directory | `dist` |

### Frontend Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API URL | `` (empty for same origin) |
| `VITE_API_KEY` | API key for frontend | `your-secret-key` |
| `VITE_PDF_API_BASE` | PDF service URL | `https://pdf.arraayah.my.id` |

### Health Check Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `HEALTH_INTERVAL` | Health check interval | `10s` / `30s` (prod) |
| `HEALTH_TIMEOUT` | Health check timeout | `5s` / `10s` (prod) |
| `HEALTH_RETRIES` | Number of retries | `3` / `5` (prod) |
| `HEALTH_START_PERIOD` | Startup grace period | `10s` / `15s` (prod) |

### Resource Limits

| Variable | Description | Default |
|----------|-------------|---------|
| `CPU_LIMIT` | Backend CPU limit | `4` / `2` (prod) |
| `MEMORY_LIMIT` | Backend memory limit | `2G` / `1G` (prod) |
| `FRONTEND_CPU_LIMIT` | Frontend CPU limit | `2` / `1` (prod) |
| `FRONTEND_MEMORY_LIMIT` | Frontend memory limit | `1G` / `512M` (prod) |

---

## 🛠️ Useful Commands

```bash
# View container status
podman compose ps

# View logs
podman compose logs -f

# Backend logs only
podman logs qr-backend -f

# Frontend logs only
podman logs qr-frontend -f

# Restart services
podman compose restart

# Stop services
podman compose down

# Rebuild and restart
podman compose --env-file .env.input up -d --build

# Backup database
podman cp qr-backend:/app/data/data.db ./backup.db

# View resource usage
podman stats
```

---

## 🏗️ Architecture

```
User Browser
     ↓
https://input.arraayah.my.id (Cloudflare Tunnel)
     ↓
http://localhost:8001
     ↓
┌────────────────────────────┐
│  Backend (FastAPI:8000)    │
│  ├─ API: /api/*            │
│  ├─ Docs: /docs            │
│  └─ Database: SQLite       │
│                            │
│  Frontend (Nginx:80)       │
│  └─ SPA: /*                │
└────────────────────────────┘
```

---

## 🔄 Migration from Old Setup

### Before (Multiple Compose Files)
```bash
docker compose -f docker-compose.yml -f docker-compose.input.yml up -d
```

### After (Single Compose File)
```bash
ENV=input docker compose up -d --build
```

---

## 🐛 Troubleshooting

### CORS Error
**Solution:** Ensure `CORS_ORIGINS` in your `.env.*` file matches your domain.

### 502 Bad Gateway
**Solution:** 
1. Check container status: `podman compose ps`
2. Check backend logs: `podman logs qr-backend -f`
3. Verify Cloudflare Tunnel is pointing to `localhost:8001`

### PDF Service Not Working
**Solution:** 
1. Verify `VITE_PDF_API_BASE` is set correctly in `.env.input`
2. Check if PDF service (`pdf.arraayah.my.id`) is online
3. Ensure PDF service has CORS headers configured

### Database Issues
**Solution:**
```bash
# Backup
podman cp qr-backend:/app/data/data.db ./backup.db

# Restart
podman compose down && podman compose up -d --build
```

---

## 📚 Files Structure

```
input-qr-gpt/
├── docker-compose.yml          # Single unified compose file
├── .env.example                # Development configuration
├── .env.input                  # Production: input.arraayah.my.id
├── .env.arraayah              # Production: arraayah.my.id
├── .env.staging               # Staging configuration
├── deploy-env.sh              # Deployment helper script
├── backend/
│   ├── Dockerfile
│   └── ...
└── frontend/
    ├── Dockerfile
    └── ...
```

---

## ✅ Post-Deploy Checklist

After deployment, verify:

- [ ] Containers are running: `podman compose ps`
- [ ] Backend is healthy: Check status shows `(healthy)`
- [ ] Frontend accessible: http://localhost:3000
- [ ] API accessible: http://localhost:8001/api/data/?page=1&limit=1
- [ ] API docs accessible: http://localhost:8001/docs
- [ ] No CORS errors in browser console
- [ ] Database persists across restarts

---

**Last Updated:** 11 April 2026
