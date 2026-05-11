import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { releaseFlags } from './src/lib/releaseFlags.js'

const DEFAULT_PALAVER_BACKEND_URL = 'http://127.0.0.1:15000'
const DEFAULT_CONVEX_BACKEND_URL = 'http://127.0.0.1:3210'
const DEFAULT_OPENCODE_SERVER_URL = 'http://127.0.0.1:18000'

export function createLocalServiceTargets(env = process.env) {
  return {
    fastApiUrl: env.PALAVER_BACKEND_URL || DEFAULT_PALAVER_BACKEND_URL,
    opencodeServerUrl: env.PALAVER_OPENCODE_SERVER_URL || env.OPENCODE_URL || DEFAULT_OPENCODE_SERVER_URL
  }
}

function createOpencodeProxy(targets, flags) {
  if (flags.isControlPlaneEnabled()) {
    return {
      target: targets.fastApiUrl,
      changeOrigin: true
    }
  }

  return {
    target: targets.opencodeServerUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/opencode/, '')
  }
}

export function createDevProxy(env = process.env, flags = releaseFlags) {
  const targets = createLocalServiceTargets(env)

  return {
    '/opencode': createOpencodeProxy(targets, flags),
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
