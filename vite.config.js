import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['crypto', 'stream', 'assert', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000
    }
  }
}})