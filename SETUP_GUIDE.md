# QR Input GPT - Setup Guide

Aplikasi inventory management dengan QR code scanning, menggunakan FastAPI backend dan React frontend.

## 🚀 Quick Start

### Development Mode (Lokal)

1. **Setup Backend:**
   ```bash
   cd backend
   cp .env.example .env  # jika belum ada
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Setup Frontend (terminal baru):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Akses aplikasi:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8001/docs

### Development Mode (Via Cloudflare Tunnel)

Jika Anda ingin mengakses dari komputer lain via Cloudflare Tunnel:

1. **Jalankan backend** seperti di atas

2. **Setup Cloudflare Tunnel** (terminal baru):
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```
   
   Catat URL tunnel yang dihasilkan (contoh: `https://abc123.trycloudflare.com`)

3. **Setup Frontend:**
   ```bash
   cd frontend
   # Jalankan script helper
   ../setup-tunnel.sh tunnel
   # Atau manual buat file .env:
   echo "VITE_BACKEND_URL=https://abc123.trycloudflare.com" > .env
   ```

4. **Jalankan frontend:**
   ```bash
   npm run dev
   ```

5. **Akses dari komputer lain:**
   - Buka URL tunnel di browser
   - Frontend akan otomatis proxy API requests ke backend

### Production Mode (Docker Compose)

#### Opsi 1: Lokal Saja
```bash
docker-compose up -d
```

#### Opsi 2: Dengan Cloudflare Tunnel

1. **Setup tunnel ke backend:**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```

2. **Build dan jalankan dengan config tunnel:**
   ```bash
   # Jika frontend dan backend di domain yang sama (recommended)
   docker-compose up -d
   
   # Atau jika terpisah, gunakan helper script
   ./setup-tunnel.sh production
   ```

## 📁 Struktur Project

```
input-qr-gpt/
├── backend/              # FastAPI backend
│   ├── main.py          # Entry point
│   ├── config.py        # Configuration
│   ├── routers/         # API routes
│   ├── .env.example     # Backend config template
│   └── Dockerfile
├── frontend/            # React frontend
│   ├── src/
│   │   ├── lib/api.js   # API client (updated!)
│   │   └── ...
│   ├── vite.config.js   # Vite config with proxy (updated!)
│   ├── .env.example     # Frontend config template
│   └── Dockerfile
├── docker-compose.yml   # Production setup
├── setup-tunnel.sh      # Helper script
└── TROUBLESHOOTING_TUNNEL.md  # Detailed troubleshooting
```

## 🔧 Konfigurasi

### Backend Environment Variables

Buat file `backend/.env`:

```env
# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=sqlite+aiosqlite:///data/data.db

# CORS
CORS_ORIGINS=["*"]  # Development only!
# CORS_ORIGINS=["https://your-domain.com"]  # Production
```

### Frontend Environment Variables

Buat file `frontend/.env`:

```env
# Untuk Vite dev server proxy
VITE_BACKEND_URL=http://localhost:8001

# Untuk production build (jika backend terpisah)
# VITE_API_BASE=https://your-backend-domain.com
```

## 🌐 Cloudflare Tunnel Setup

### Cara Kerja

Arsitektur aplikasi:
```
User → Cloudflare Tunnel → Backend (port 8001) → Frontend (SPA)
                                      ↓
                                  API (/api/*)
```

**Backend melayani:**
- API endpoints di `/api/*`
- Frontend SPA untuk semua route lainnya

### Step-by-Step

1. **Install cloudflared:**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   sudo mv cloudflared /usr/local/bin/
   ```

2. **Jalankan backend:**
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

3. **Buat tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```

4. **Akses dari mana saja:**
   - Buka URL yang diberikan cloudflared
   - Aplikasi sudah accessible dari internet!

## 🐛 Troubleshooting

Lihat [TROUBLESHOOTING_TUNNEL.md](./TROUBLESHOOTING_TUNNEL.md) untuk panduan lengkap.

### Common Issues

**Problem: CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Update `CORS_ORIGINS` di backend `.env`

**Problem: Network Error**
```
ERR_CONNECTION_REFUSED atau Network Error
```
**Solution:** 
- Pastikan backend berjalan
- Cek `VITE_BACKEND_URL` di `frontend/.env`
- Pastikan firewall mengizinkan port

**Problem: 404 API Not Found**
**Solution:**
- Cek apakah proxy Vite correctly configured
- Pastikan backend endpoint ada

**Problem: Mixed Content Warning**
**Solution:**
- Jika frontend HTTPS, backend juga harus HTTPS
- Cloudflare Tunnel otomatis provide HTTPS

## 🔒 Security Notes

⚠️ **PENTING untuk Production:**

1. **Jangan gunakan `CORS_ORIGINS=["*"]`** di production
2. **Selalu gunakan HTTPS** (Cloudflare Tunnel sudah otomatis)
3. **Tambahkan authentication** jika diperlukan
4. **Backup database** secara berkala

## 📝 Changes Made

File yang diupdate untuk support Cloudflare Tunnel:

1. ✅ `frontend/vite.config.js` - Dynamic backend URL dari env
2. ✅ `frontend/src/lib/api.js` - Auto-detect API base URL
3. ✅ `frontend/Dockerfile` - Support build arg untuk API_BASE
4. ✅ `backend/.env.example` - Template konfigurasi
5. ✅ `frontend/.env.example` - Template konfigurasi
6. ✅ `setup-tunnel.sh` - Helper script
7. ✅ `TROUBLESHOOTING_TUNNEL.md` - Panduan troubleshooting

## 🆘 Bantuan

Jika masih ada masalah:
1. Cek browser console (F12) untuk error messages
2. Cek backend logs untuk API errors
3. Lihat [TROUBLESHOOTING_TUNNEL.md](./TROUBLESHOOTING_TUNNEL.md)
4. Test dengan curl: `curl http://your-url/api/data/?page=1&limit=1`
