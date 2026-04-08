# Quick Start untuk Cloudflare Tunnel
# Jalankan: source quickstart-tunnel.sh

echo "🚀 QR Input GPT - Quick Start"
echo "=============================="
echo ""

# Cek apakah backend sudah ada .env
if [ ! -f backend/.env ]; then
  echo "📝 Membuat backend/.env..."
  cat > backend/.env << 'EOF'
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite+aiosqlite:///data/data.db
CORS_ORIGINS=["*"]
EOF
  echo "✅ Backend .env dibuat"
fi

echo ""
echo "🔧 Langkah selanjutnya:"
echo ""
echo "1️⃣  Jalankan Backend (terminal 1):"
echo "   cd backend"
echo "   uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
echo ""
echo "2️⃣  Setup Cloudflare Tunnel (terminal 2):"
echo "   cloudflared tunnel --url http://localhost:8001"
echo ""
echo "   📌 Catat URL yang dihasilkan (contoh: https://abc123.trycloudflare.com)"
echo ""
echo "3️⃣  Setup Frontend (terminal 3):"
echo "   cd frontend"
echo "   echo 'VITE_BACKEND_URL=https://YOUR-TUNNEL-URL' > .env"
echo "   npm run dev"
echo ""
echo "4️⃣  Akses dari komputer lain:"
echo "   Buka URL tunnel di browser"
echo ""
echo "💡 Atau gunakan helper script:"
echo "   ./setup-tunnel.sh tunnel"
echo ""
