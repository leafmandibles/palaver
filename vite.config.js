import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/opencode': {
        target: process.env.PALAVER_BACKEND_URL || 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
