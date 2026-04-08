# ⚡ Quick Deploy - arraayah.my.id

## 🚀 Deploy Sekarang (3 Langkah)

```bash
# 1. Setup config
cp backend/.env.arraayah backend/.env

# 2. Deploy
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d --build

# 3. Test
curl https://arraayah.my.id/api/data/?page=1&limit=1
```

**✅ Done! Aplikasi live di https://arraayah.my.id**

---

## 🔄 Update/Redeploy

```bash
git pull && ./deploy.sh production
```

---

## 📊 Monitoring

```bash
# Status
docker compose ps

# Logs
docker compose logs -f

# Health
curl https://arraayah.my.id/api/data/?page=1&limit=1
```

---

## 🗄️ Backup

```bash
docker cp qr-backend:/app/data/data.db ./backup-$(date +%Y%m%d).db
```

---

## 🆘 Emergency Commands

```bash
# Restart semua
docker compose restart

# Restart backend only
docker compose restart backend

# Stop semua
docker compose down

# Full redeploy
docker compose -f docker-compose.yml -f docker-compose.arraayah.yml up -d --build
```

---

## 📝 Access Points

| Service | URL |
|---------|-----|
| **Frontend** | https://arraayah.my.id |
| **API** | https://arraayah.my.id/api |
| **API Docs** | https://arraayah.my.id/docs |

---

## 🐳 Container Info

- **Backend:** `qr-backend` (port 8001 → 8000)
- **Frontend:** `qr-frontend` (port 3000 → 80)
- **Database:** `backend/data.db`

---

## 🔧 Config Files

- `backend/.env` - Backend configuration
- `docker-compose.arraayah.yml` - Production overrides
- `backend/.env.arraayah` - Template untuk domain Anda

---

**Untuk detail lengkap:** Lihat `DEPLOY_ARAAAYAH.md`
