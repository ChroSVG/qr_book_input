# 🔐 API Authentication Setup

## Masalah Sebelumnya

API Anda **terbuka untuk umum** - siapa saja bisa:
- ❌ Melihat semua data
- ❌ Menambah data
- ❌ Mengedit data  
- ❌ Menghapus data
- ❌ Export data

Ini **berbahaya** karena sudah live di internet!

---

## ✅ Solusi: API Key Authentication

Saya sudah menambahkan **API Key authentication** untuk melindungi endpoint sensitif.

### Endpoints yang Dilindungi:

| Endpoint | Method | Auth Required | Deskripsi |
|----------|--------|---------------|-----------|
| `/api/data/` | POST | ✅ Yes | Create item |
| `/api/data/{id}` | PUT | ✅ Yes | Update item |
| `/api/data/{id}` | DELETE | ✅ Yes | Delete item |
| `/api/data/export/csv` | GET | ✅ Yes | Export CSV |
| `/api/data/export/excel` | GET | ✅ Yes | Export Excel |

### Endpoints yang Tetap Public:

| Endpoint | Method | Auth Required | Deskripsi |
|----------|--------|---------------|-----------|
| `/api/data/` | GET | ❌ No | List items (pagination) |
| `/api/data/{id}` | GET | ❌ No | Get item by ID |
| `/api/data/qr/{qr_code}` | GET | ❌ No | Get item by QR code |
| `/api/auth/info` | GET | ❌ No | Get API key info |
| `/docs` | GET | ❌ No | API documentation |

---

## 🔑 API Key Anda

**API Key yang sudah digenerate:**
```
1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw
```

⚠️ **SIMPAN INI RAHASIA!** Jangan commit ke Git!

---

## 📖 Cara Menggunakan

### 1. Test API dengan curl

**Tanpa API Key (akan ditolak untuk protected endpoints):**
```bash
# Ini akan error 403
curl -X POST https://input.arraayah.my.id/api/data/ \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"test123","name":"Test Item"}'

# Response: {"detail":"API key is missing"}
```

**Dengan API Key:**
```bash
# Ini akan berhasil
curl -X POST https://input.arraayah.my.id/api/data/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw" \
  -d '{"qr_code":"test123","name":"Test Item"}'
```

**Get endpoints (tetap public):**
```bash
# Ini tetap bisa tanpa API key
curl https://input.arraayah.my.id/api/data/?page=1&limit=10
```

### 2. Setup di Frontend

API key sudah otomatis disertakan di frontend melalui environment variable.

File `frontend/.env`:
```env
VITE_API_KEY=1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw
```

### 3. Setup di Mobile App / Third Party

Jika Anda menggunakan mobile app atau third party services, tambahkan header:

```
X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw
```

**Contoh di JavaScript:**
```javascript
fetch('https://input.arraayah.my.id/api/data/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw'
  },
  body: JSON.stringify({
    qr_code: 'test123',
    name: 'Test Item'
  })
})
```

**Contoh di Python:**
```python
import requests

headers = {
    'X-API-Key': '1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw'
}

response = requests.post(
    'https://input.arraayah.my.id/api/data/',
    headers=headers,
    json={'qr_code': 'test123', 'name': 'Test Item'}
)
```

---

## 🔄 Regenerate API Key

Jika API key Anda bocor atau ingin mengganti:

### 1. Generate Key Baru

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Update Environment

**Backend (.env):**
```env
API_KEY=key-baru-anda-disini
```

**docker-compose.input.yml:**
```yaml
backend:
  environment:
    - API_KEY=key-baru-anda-disini

frontend:
  build:
    args:
      VITE_API_KEY: "key-baru-anda-disini"
```

### 3. Redeploy

```bash
podman compose -f docker-compose.yml -f docker-compose.input.yml up -d --build
```

---

## 🚀 Deploy Authentication

### Step 1: Build & Deploy

```bash
# Build ulang dengan authentication
podman compose -f docker-compose.yml -f docker-compose.input.yml build --no-cache

# Deploy
podman compose -f docker-compose.yml -f docker-compose.input.yml up -d
```

### Step 2: Test Authentication

```bash
# Test tanpa API key (harus error)
curl -X POST https://input.arraayah.my.id/api/data/ \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"test","name":"Test"}'

# Expected: {"detail":"API key is missing"}

# Test dengan API key (harus berhasil)
curl -X POST https://input.arraayah.my.id/api/data/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw" \
  -d '{"qr_code":"test","name":"Test"}'

# Expected: {"id": 123, "qr_code": "test", ...}
```

### Step 3: Verify GET Endpoints Tetap Public

```bash
# Ini harus tetap bisa tanpa API key
curl https://input.arraayah.my.id/api/data/?page=1&limit=1

# Expected: {"data": [...], "total": 601, ...}
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Simpan API key dengan aman
- ✅ Gunakan environment variables
- ✅ Rotate key secara berkala
- ✅ Gunakan HTTPS (sudah ada via Cloudflare)
- ✅ Monitor logs untuk suspicious activity

### ❌ DON'T:
- ❌ Commit API key ke Git
- ❌ Share API key di public
- ❌ Hardcode API key di client-side code (kecuali frontend Anda sendiri)
- ❌ Gunakan API key yang sama untuk multiple apps

---

## 📊 Monitoring & Logs

### Cek Siapa yang Akses API

```bash
# View backend logs
podman logs qr-backend -f

# Filter error authentication
podman logs qr-backend | grep "403\|401"
```

### Blocked Requests

Jika ada yang coba akses tanpa API key:
```json
{
  "detail": "API key is missing"
}
```

Atau API key salah:
```json
{
  "detail": "Invalid API key"
}
```

---

## 🆘 Troubleshooting

### Problem: "API key is missing"

**Solution:**
Pastikan header `X-API-Key` dikirim:
```bash
-H "X-API-Key: 1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw"
```

### Problem: "Invalid API key"

**Solution:**
Cek apakah API key benar:
```bash
# Cek di backend
podman exec qr-backend env | grep API_KEY

# Harus match dengan yang Anda kirim
```

### Problem: Frontend Tidak Bisa Create/Update/Delete

**Solution:**
Pastikan `VITE_API_KEY` set di `docker-compose.input.yml`:
```yaml
frontend:
  build:
    args:
      VITE_API_KEY: "1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw"
```

Redeploy:
```bash
podman compose -f docker-compose.yml -f docker-compose.input.yml up -d --build
```

---

## 📝 Architecture

```
Request
   ↓
[GET /api/data/] → ✅ Public (no auth)
   ↓
[POST /api/data/] → ❌ Requires X-API-Key header
   ↓
Auth Middleware checks:
   ├─ No API key → 401 Unauthorized
   ├─ Invalid key → 403 Forbidden
   └─ Valid key → ✅ Proceed to endpoint
```

---

## ✅ Checklist After Enable Auth

- [ ] API key sudah digenerate dan disimpan dengan aman
- [ ] Backend .env sudah diupdate dengan API_KEY
- [ ] Frontend sudah di-rebuild dengan VITE_API_KEY
- [ ] Test POST endpoint tanpa API key → harus error 401
- [ ] Test POST endpoint dengan API key → harus berhasil
- [ ] Test GET endpoint tanpa API key → harus berhasil
- [ ] Export endpoints memerlukan API key → sudah test
- [ ] Dokumentasi API key sudah dibagikan ke tim

---

**API Key Anda:** `1YNgoj8u9MU5jl9Oe5RRT-P7ZfWmEESeeRB2vzgE5Zw`  
**Last Updated:** 8 April 2026
