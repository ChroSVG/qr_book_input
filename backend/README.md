"# QR Input App - Full Stack"

"Aplikasi full-stack untuk manajemen inventaris menggunakan QR code."

"## Struktur Project"

"- Backend: FastAPI dengan database SQLite"
"- Frontend: React SPA (disajikan sebagai file statis)"

"## Instalasi"

"1. Install dependensi:"
"   \`\`\`bash"
"   pip install -r requirements.txt"
"   \`\`\`"

"2. Jalankan aplikasi:"
"   \`\`\`bash"
"   python main.py"
"   \`\`\`"

"Aplikasi akan berjalan di http://localhost:8000"

"## Akses Melalui Tailscale"

"Untuk mengakses aplikasi melalui jaringan Tailscale:"

"- Pastikan Tailscale sudah terinstall dan berjalan di semua perangkat"
"- Backend akan otomatis mendengarkan pada semua antarmuka jaringan"
"- Akses melalui alamat IPv4 Tailscale di port 8000 (contoh: http://100.x.x.x:8000)"

"### Menggunakan Tailscale Funnel (HTTPS)"

"Tailscale Funnel memungkinkan Anda mengakses layanan lokal melalui HTTPS dengan sertifikat otomatis. Ikuti langkah-langkah berikut:"

"1. Pastikan Tailscale CLI terbaru terinstall di sistem Anda"
"2. Login ke akun Tailscale Anda di dashboard: https://login.tailscale.com/admin"
"3. Pergi ke tab \"Access Controls\" atau \"Funnel\""
"4. Aktifkan fitur Funnel untuk jaringan Anda (memerlukan admin privileges)"
"5. Dari command line, jalankan perintah berikut untuk mengaktifkan funnel pada port 8000:"

"   \`\`\`bash"
"   tailscale funnel tcp 8000"
"   \`\`\`"

"   Atau untuk HTTPS langsung:"

"   \`\`\`bash"
"   tailscale funnel 8000"
"   \`\`\`"

"6. Akses backend Anda melalui URL HTTPS unik seperti: https://your-device-name.tailnetname.ts.net:8000"

"Catatan: Jika perangkat Anda belum memiliki nama unik, Anda bisa mengaturnya di dashboard Tailscale."

"Atau, Anda dapat menjalankan backend dengan dukungan SSL secara langsung:"
"- Siapkan sertifikat SSL Anda"
"- Set environment variables SSL_KEYFILE dan SSL_CERTFILE"
"- Jalankan aplikasi seperti biasa"

"## Konfigurasi Frontend"

"URL backend untuk frontend dikonfigurasi di:"
"- Saat build: dengan environment variable \`VITE_API_BASE\`"
"- Default: \`http://localhost:8000\` (dilihat dari file \`../frontend/src/hooks/useApi.js\`)"

"## Catatan Penting"

"- Folder \`dist\` berisi versi build dari aplikasi React"
"- Semua rute non-API akan mengembalikan index.html untuk mendukung client-side routing React"
"- Untuk deployment produksi, sesuaikan konfigurasi CORS di main.py"
