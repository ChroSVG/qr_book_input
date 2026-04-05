import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mkcert()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
      }
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Pendekatan manualChunks yang lebih fleksibel
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('axios')) {
              return 'axios';
            }
            if (id.includes('html5-qrcode')) {
              return 'qr-scanner';
            }
            // Grup semua modul node_modules lainnya ke vendor
            return 'vendor';
          }
        }
      }
    }
  }
})
