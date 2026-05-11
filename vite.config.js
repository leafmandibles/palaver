import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const DEFAULT_PALAVER_BACKEND_URL = 'http://127.0.0.1:8000'
const DEFAULT_CONVEX_BACKEND_URL = 'http://127.0.0.1:3210'

export function createDevProxy(env = process.env) {
  return {
    '/opencode': {
      target: env.PALAVER_BACKEND_URL || DEFAULT_PALAVER_BACKEND_URL,
      changeOrigin: true
    },
    '/convex': {
      target: env.PALAVER_CONVEX_BACKEND_URL || DEFAULT_CONVEX_BACKEND_URL,
      changeOrigin: true,
      ws: true,
      rewrite: (path) => path.replace(/^\/convex/, '')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: createDevProxy()
  }
})
