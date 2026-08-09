import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://https://interndo.onrender.com/api/',
    },
  },
})
