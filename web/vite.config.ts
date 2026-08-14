import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server proxies /api to the Go backend so you can run
//   terminal 1: go run .            (Locket API on :8090)
//   terminal 2: npm run dev         (Vite on :5173)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8090',
    },
  },
})
