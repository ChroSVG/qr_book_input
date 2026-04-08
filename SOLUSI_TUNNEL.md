# Solusi: Frontend Tidak Bisa Akses Backend via Cloudflare Tunnel

## ❓ Masalah

Ketika mengakses frontend dari komputer lain melalui Cloudflare Tunnel, data/server tidak bisa diakses.

## 🔍 Penyebab

### 1. **Vite Proxy Menggunakan localhost**
File `frontend/vite.config.js` sebelumnya menggunakan:
```javascript
target: "http://localhost:8001"
```

Masalahnya: Ketika diakses dari komputer lain, `localhost` merujuk ke komputer mereka, bukan server Anda.

### 2. **Frontend Tidak Tahu URL Backend**
File `frontend/src/lib/api.js` menggunakan relative URL yang hanya bekerja jika frontend dan backend di domain yang sama.

### 3. **CORS Configuration**
Backend mungkin tidak mengizinkan request dari domain tunnel.

## ✅ Solusi yang Sudah Diterapkan

### File yang Diupdate:

#### 1. `frontend/vite.config.js`
✅ Sekarang membaca URL backend dari environment variable `VITE_BACKEND_URL`
✅ Support untuk lokal dan tunnel access

#### 2. `frontend/src/lib/api.js`
✅ Auto-detect API base URL dari `window.location.origin`
✅ Support environment variable `VITE_API_BASE` untuk production

#### 3. `frontend/Dockerfile`
✅ Menambahkan build arg `VITE_API_BASE` untuk production build

#### 4. File Dokumentasi Baru:
- ✅ `backend/.env.example` - Template konfigurasi backend
- ✅ `frontend/.env.example` - Template konfigurasi frontend
- ✅ `SETUP_GUIDE.md` - Panduan lengkap setup
- ✅ `TROUBLESHOOTING_TUNNEL.md` - Panduan troubleshooting
- ✅ `setup-tunnel.sh` - Helper script interaktif

## 🚀 Cara Menggunakan

### **Opsi A: Development Mode (Recommended untuk Testing)**

1. **Jalankan Backend:**
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Setup Cloudflare Tunnel (terminal baru):**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```
   Catat URL yang dihasilkan, contoh: `https://abc123.trycloudflare.com`

3. **Setup Frontend:**
   ```bash
   cd frontend
   
   # Buat file .env
   echo "VITE_BACKEND_URL=https://abc123.trycloudflare.com" > .env
   
   # Jalankan frontend
   npm run dev
   ```

4. **Akses dari Komputer Lain:**
   - Buka URL tunnel di browser
   - Aplikasi seharusnya sudah bekerja!

### **Opsi B: Production Mode (Docker Compose)**

Jika backend dan frontend di domain yang sama (recommended):

1. **Setup tunnel ke backend:**
   ```bash
   cloudflared tunnel --url http://localhost:8001
   ```

2. **Jalankan dengan Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Akses via URL tunnel**

Jika backend dan frontend terpisah:

1. **Gunakan helper script:**
   ```bash
   ./setup-tunnel.sh production
   ```

2. **Ikuti instruksi yang ditampilkan**

## 🧪 Testing

### Test Lokal:
```bash
curl http://localhost:3000/api/data/?page=1&limit=1
```

### Test via Tunnel:
```bash
curl https://your-tunnel-url/api/data/?page=1&limit=1
```

### Cek CORS:
```bash
curl -I -X OPTIONS https://your-tunnel-url/api/data/ \
  -H "Origin: https://your-tunnel-url" \
  -H "Access-Control-Request-Method: GET"
```

Response harus包含 header:
```
Access-Control-Allow-Origin: https://your-tunnel-url
```

## 🐛 Troubleshooting

### Problem: CORS Error
**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Pastikan `backend/.env` berisi:
```env
CORS_ORIGINS=["*"]
```
Atau untuk production:
```env
CORS_ORIGINS=["https://your-tunnel-url.trycloudflare.com"]
```

### Problem: Network Error / Connection Refused
**Solution:**
1. Pastikan backend berjalan: `curl http://localhost:8001/docs`
2. Cek `frontend/.env` - pastikan `VITE_BACKEND_URL` benar
3. Cek firewall: `sudo ufw allow 3000,8001/tcp`

### Problem: 404 API Not Found
**Solution:**
1. Pastikan URL tunnel benar
2. Cek apakah backend melayani endpoint `/api/data/`
3. Lihat logs backend untuk error messages

### Problem: Mixed Content Warning
**Solution:**
- Cloudflare Tunnel sudah menyediakan HTTPS otomatis
- Pastikan tidak ada hardcoded `http://` URLs

## 📋 Checklist Setup

- [ ] Backend berjalan di port 8001
- [ ] Cloudflare Tunnel aktif
- [ ] `frontend/.env` dibuat dengan `VITE_BACKEND_URL` yang benar
- [ ] Frontend dev server berjalan
- [ ] Browser console tidak ada error
- [ ] API endpoint bisa diakses via tunnel URL

## 💡 Tips

1. **Untuk Development:** Gunakan `CORS_ORIGINS=["*"]` (hanya untuk dev!)
2. **Untuk Production:** Spesifikkan domain yang diizinkan
3. **Testing:** Selalu test di browser incognito untuk clear cache
4. **Debug:** Buka browser console (F12) untuk melihat network requests

## 📚 Dokumentasi Lengkap

Lihat file-file berikut untuk informasi lebih detail:
- `SETUP_GUIDE.md` - Panduan setup lengkap
- `TROUBLESHOOTING_TUNNEL.md` - Troubleshooting detail
- `README.md` - Overview project

## 🆘 Masih Bermasalah?

1. Cek browser console (F12) → Tab Network
2. Cek backend logs untuk errors
3. Test API langsung dengan curl
4. Pastikan semua environment variables benar
5. Restart semua services

---

**Ringkasan Perubahan:**
- ✅ Vite config sekarang support dynamic backend URL
- ✅ API client auto-detect backend URL
- ✅ Dockerfile support build args
- ✅ Dokumentasi lengkap tersedia
- ✅ Helper scripts untuk memudahkan setup
