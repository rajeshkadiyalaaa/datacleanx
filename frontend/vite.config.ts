import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Use explicit IPv4 to avoid macOS AirPlay Receiver which occupies
        // port 5000 on ::1 (IPv6) — 'localhost' on macOS resolves to IPv6 first.
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
