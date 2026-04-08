# Panduan Mengatasi Masalah Akses via Cloudflare Tunnel

## Masalah
Ketika mengakses frontend dari komputer lain melalui Cloudflare Tunnel, data/server tidak bisa diakses karena:

1. **Vite Dev Server Proxy** menggunakan `localhost` yang tidak bisa diakses dari jaringan luar
2. **Frontend Production** tidak mengetahui URL backend yang benar
3. **CORS** mungkin perlu dikonfigurasi ulang

## Solusi

### A. Development Mode (npm run dev)

1. **Buat file `.env` di folder `frontend/`:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit `frontend/.env`:**
   
   **Untuk akses lokal (di komputer yang sama):**
   ```env
   VITE_BACKEND_URL=http://localhost:8001
   ```

   **Untuk akses dari komputer lain (via IP lokal):**
   ```env
   VITE_BACKEND_URL=http://192.168.1.100:8001
   ```
   Ganti `192.168.1.100` dengan IP lokal server Anda.

   **Untuk akses via Cloudflare Tunnel:**
   ```env
   VITE_BACKEND_URL=https://your-tunnel-domain.trycloudflare.com
   ```

3. **Jalankan backend:**
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

4. **Jalankan frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### B. Production Mode (Docker Compose)

Untuk production dengan Cloudflare Tunnel, Anda punya 2 opsi:

#### Opsi 1: Frontend dan Backend di Domain yang Sama (Recommended)

Jika Cloudflare Tunnel mengarah ke backend (port 8001) dan backend melayani frontend:

1. **Setup Cloudflare Tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```

2. **Tidak perlu konfigurasi tambahan** - backend sudah melayani frontend dan API di domain yang sama.

#### Opsi 2: Frontend dan Backend Terpisah

Jika Anda menjalankan frontend dan backend secara terpisah:

1. **Edit `docker-compose.yml`** untuk menambahkan environment variable:
   ```yaml
   services:
     backend:
       # ... existing config ...
       environment:
         - DATABASE_URL=sqlite+aiosqlite:///data/data.db
         - CORS_ORIGINS=https://your-domain.com,https://your-tunnel.trycloudflare.com
     
     frontend:
       build:
         context: ./frontend
         args:
           VITE_API_BASE: https://your-backend-domain.com
       # ... existing config ...
   ```

2. **Update `frontend/Dockerfile`** untuk menerima build arg:
   ```dockerfile
   ARG VITE_API_BASE
   ENV VITE_API_BASE=${VITE_API_BASE}
   ```

### C. Konfigurasi CORS (Jika Diperlukan)

Jika backend dan frontend di domain berbeda, update CORS di `backend/.env` atau `docker-compose.yml`:

```env
CORS_ORIGINS=https://your-frontend-domain.com,https://your-tunnel.trycloudflare.com
```

Atau di `docker-compose.yml`:
```yaml
backend:
  environment:
    - CORS_ORIGINS=["https://your-domain.com"]
```

## Testing

Setelah konfigurasi:

1. **Test lokal:**
   ```bash
   curl http://localhost:3000/api/data/?page=1&limit=1
   ```

2. **Test via Cloudflare Tunnel:**
   - Buka browser di komputer lain
   - Akses URL tunnel Anda
   - Cek Console browser (F12) untuk error CORS atau network error

3. **Cek CORS headers:**
   ```bash
   curl -I -X OPTIONS http://your-tunnel-url/api/data/ \
     -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: GET"
   ```
   
   Response harus包含:
   ```
   Access-Control-Allow-Origin: https://your-frontend-domain.com
   ```

## Troubleshooting

### Error: "Network Error" atau "CORS policy"
- Pastikan `CORS_ORIGINS` di backend mencakup URL frontend Anda
- Untuk development, bisa gunakan `CORS_ORIGINS=["*"]` (hanya untuk dev!)

### Error: "404 Not Found" untuk API
- Pastikan proxy Vite mengarah ke backend yang benar
- Cek apakah backend sedang berjalan

### Error: "Mixed Content"
- Jika frontend HTTPS, backend juga harus HTTPS
- Cloudflare Tunnel sudah menyediakan HTTPS otomatis

### Frontend tidak bisa connect ke backend
- Pastikan firewall mengizinkan port yang diperlukan
- Untuk development: `sudo ufw allow 3000,8001/tcp`
