#!/bin/bash

# Script untuk setup akses Cloudflare Tunnel
# Usage: ./setup-tunnel.sh [local|tunnel|production]

set -e

echo "======================================"
echo "  Cloudflare Tunnel Setup Helper"
echo "======================================"
echo ""

MODE=${1:-local}

case $MODE in
  local)
    echo "Mode: Development (Lokal)"
    echo ""
    echo "Backend URL: http://localhost:8001"
    echo ""
    
    # Buat .env frontend
    cat > frontend/.env << EOF
# Backend URL untuk Vite proxy
VITE_BACKEND_URL=http://localhost:8001
EOF
    
    echo "✓ Created frontend/.env"
    echo ""
    echo "Cara menjalankan:"
    echo "  1. Backend:  cd backend && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
    echo "  2. Frontend: cd frontend && npm run dev"
    echo "  3. Akses:    http://localhost:3000"
    ;;
    
  tunnel)
    echo "Mode: Development (Cloudflare Tunnel)"
    echo ""
    read -p "Masukkan URL Cloudflare Tunnel (contoh: https://abc123.trycloudflare.com): " TUNNEL_URL
    
    if [ -z "$TUNNEL_URL" ]; then
      echo "❌ URL tidak boleh kosong!"
      exit 1
    fi
    
    # Hapus trailing slash jika ada
    TUNNEL_URL=${TUNNEL_URL%/}
    
    # Buat .env frontend
    cat > frontend/.env << EOF
# Backend URL untuk Vite proxy
VITE_BACKEND_URL=${TUNNEL_URL}
EOF
    
    echo ""
    echo "✓ Created frontend/.env"
    echo ""
    echo "Cara menjalankan:"
    echo "  1. Pastikan Cloudflare Tunnel aktif ke port 8001"
    echo "  2. Backend:  cd backend && uvicorn main:app --host 0.0.0.0 --port 8001 --reload"
    echo "  3. Frontend: cd frontend && npm run dev"
    echo "  4. Akses:    ${TUNNEL_URL}"
    ;;
    
  production)
    echo "Mode: Production (Docker Compose)"
    echo ""
    read -p "Masukkan URL Backend (kosongkan jika sama dengan frontend): " BACKEND_URL
    
    # Update docker-compose.yml
    if [ -z "$BACKEND_URL" ]; then
      echo ""
      echo "✓ Menggunakan mode: Frontend dan Backend di domain yang sama"
      echo "  Tidak perlu konfigurasi tambahan"
      echo ""
      echo "Cara menjalankan:"
      echo "  1. Setup Cloudflare Tunnel ke port 8001 (backend)"
      echo "  2. docker-compose up -d"
    else
      BACKEND_URL=${BACKEND_URL%/}
      
      # Buat docker-compose override
      cat > docker-compose.tunnel.yml << EOF
version: '3.8'

services:
  backend:
    environment:
      - CORS_ORIGINS=${BACKEND_URL}
  
  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE: ${BACKEND_URL}
EOF
      
      echo ""
      echo "✓ Created docker-compose.tunnel.yml"
      echo ""
      echo "Cara menjalankan:"
      echo "  1. Setup Cloudflare Tunnel ke backend"
      echo "  2. docker-compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d"
    fi
    ;;
    
  *)
    echo "❌ Mode tidak valid!"
    echo ""
    echo "Usage:"
    echo "  ./setup-tunnel.sh local        - Development lokal"
    echo "  ./setup-tunnel.sh tunnel       - Development via Cloudflare Tunnel"
    echo "  ./setup-tunnel.sh production   - Production dengan Docker"
    exit 1
    ;;
esac

echo ""
echo "======================================"
echo "Setup selesai! 🚀"
echo "======================================"
