import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  return {
    plugins: [react(), tailwindcss(), mkcert()],
    server: {
      host: true,
      port: 3001,
      hmr: {
        overlay: true,
      },
      proxy: {
        "/api": {
          target: backendUrl,
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
  }
})
