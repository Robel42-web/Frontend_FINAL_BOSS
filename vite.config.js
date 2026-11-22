import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8001',
      '/sanctum': 'http://localhost:8001',
      '/auth/google': 'http://localhost:8001',
    },
  },
})