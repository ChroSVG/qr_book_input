# 🔧 Fix Summary - 502 Bad Gateway Issue

## Problem
Backend API returning **502 Bad Gateway** when accessing `https://input.arraayah.my.id/api/data/`

---

## Root Cause
Cloudflare Tunnel → Nginx Proxy Manager → Backend configuration mismatch:

1. **NPM Proxy** pointing to wrong port (`3000` instead of `8001`)
2. **Frontend dist** not mounted in backend container
3. Database configuration not synced with NPM

---

## What Was Fixed

### ✅ 1. Updated NPM Proxy Configuration
- **File**: `/home/sellgo/Dokumen/nginx-proxy-manager/data/nginx/proxy_host/2.conf`
- **Change**: Updated port from `3000` to `8001`
- **Host**: `100.109.2.99` (Tailscale IP)

### ✅ 2. Copied Frontend Dist to Backend
- **Source**: `/home/sellgo/Dokumen/input-qr-gpt/frontend/dist`
- **Destination**: `/home/sellgo/Dokumen/input-qr-gpt/backend/dist`
- **Container**: Copied to `qr-backend:/app/dist`

### ✅ 3. Updated Docker Compose
- **File**: `docker-compose.yml`
- **Added**: Volume mount for `./backend/dist:/app/dist`
- **Purpose**: Persist frontend dist across restarts

### ✅ 4. Updated NPM Database
- **Table**: `proxy_host`
- **Record**: ID 2 (`input.arraayah.my.id`)
- **Changed**: `forward_port` from `3000` to `8001`

---

## Architecture Flow (Fixed)

```
User Browser
     ↓
https://input.arraayah.my.id
     ↓
Cloudflare Tunnel (Quic)
     ↓
Nginx Proxy Manager (Port 80 → 443)
     ↓
http://100.109.2.99:8001 (Tailscale IP)
     ↓
┌────────────────────────────┐
│  Backend (FastAPI:8000)    │
│  ├─ API: /api/* ✅         │
│  ├─ Docs: /docs ✅         │
│  ├─ SPA: /* ✅             │
│  └─ Database: SQLite ✅    │
└────────────────────────────┘
```

---

## Verification

✅ **API Endpoint**:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  https://input.arraayah.my.id/api/data/?page=1&limit=10 \
  -H "X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw" -k
# Returns: 200
```

✅ **Frontend**:
```bash
curl -s https://input.arraayah.my.id/ -k | head -10
# Returns: HTML with <!doctype html>
```

✅ **Backend Local**:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/data/?page=1&limit=1
# Returns: 200
```

---

## Files Modified

| File | Change |
|------|--------|
| `docker-compose.yml` | Added `./backend/dist:/app/dist` volume mount |
| `nginx-proxy-manager/data/nginx/proxy_host/2.conf` | Changed port 3000 → 8001 |
| `nginx-proxy-manager/data/database.sqlite` | Updated proxy_host forward_port |
| `backend/dist/` | Copied from frontend/dist |

---

## Useful Commands

```bash
# Restart everything
podman compose --env-file .env.input down
podman compose --env-file .env.input up -d --build

# Restart NPM
podman restart nginx-proxy-manager_app_1

# Restart Cloudflare Tunnel
podman restart nginx-proxy-manager_cloudflare-tunnel_1

# Check logs
podman logs nginx-proxy-manager_app_1 -f
podman logs nginx-proxy-manager_cloudflare-tunnel_1 -f
podman logs qr-backend -f

# Test endpoints
curl https://input.arraayah.my.id/ -k
curl https://input.arraayah.my.id/api/data/?page=1&limit=10 \
  -H "X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw" -k
```

---

## Next Steps (To Prevent Future Issues)

1. **Automate dist copy**: Add dist build to Docker image instead of volume mount
2. **CI/CD Pipeline**: Auto-deploy on git push
3. **Health Checks**: Add monitoring for NPM proxy health
4. **Backup NPM Config**: Regular backup of NPM database and configs

---

**Status**: ✅ **FIXED**
**Date**: 11 April 2026
**Domain**: https://input.arraayah.my.id
