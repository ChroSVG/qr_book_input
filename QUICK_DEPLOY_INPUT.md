# ⚡ Quick Deploy - input.arraayah.my.id

## 🚀 Deploy Sekarang

```bash
# 1. Setup config
cp backend/.env.input backend/.env

# 2. Deploy
docker compose -f docker-compose.yml -f docker-compose.input.yml up -d --build

# 3. Setup Nginx Proxy Manager
#    - Add Proxy Host: input.arraayah.my.id
#    - Forward to: localhost:3000
#    - Enable SSL
#    - Add custom config untuk /api/ proxy (lihat DEPLOY_INPUT_ARAAAYAH.md)

# 4. Test
curl https://input.arraayah.my.id/api/data/?page=1&limit=1
```

---

## 📝 Nginx Proxy Manager Setup

### Proxy Host Configuration

**Details Tab:**
- Domain Names: `input.arraayah.my.id`
- Forward Host: `localhost` (atau IP server Anda)
- Forward Port: `3000`
- Scheme: `http`

**SSL Tab:**
- ✅ Request a new SSL Certificate
- ✅ Force SSL
- ✅ HTTP/2 Support

**Advanced Tab:**
```nginx
# Proxy API ke backend
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

location /openapi.json {
    proxy_pass http://localhost:8001/openapi.json;
    proxy_set_header Host $host;
}
```

---

## 📊 Access Points

| Service | URL |
|---------|-----|
| **Frontend** | https://input.arraayah.my.id |
| **API** | https://input.arraayah.my.id/api |
| **API Docs** | https://input.arraayah.my.id/docs |

---

## 🐳 Useful Commands

```bash
# Status
docker compose ps

# Logs
docker compose logs -f

# Restart
docker compose restart

# Update
git pull && docker compose -f docker-compose.yml -f docker-compose.input.yml up -d --build

# Backup DB
docker cp qr-backend:/app/data/data.db ./backup.db
```

---

**Full guide:** `DEPLOY_INPUT_ARAAAYAH.md`
