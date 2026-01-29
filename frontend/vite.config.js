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
        target: "http://localhost:9873",
        changeOrigin: true,
        secure: false,
  }}
  }  
})
