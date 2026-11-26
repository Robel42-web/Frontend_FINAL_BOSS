import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://repairhub-api-1zjp.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/sanctum': {
        target: 'https://repairhub-api-1zjp.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/auth/google': {
        target: 'https://repairhub-api-1zjp.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})