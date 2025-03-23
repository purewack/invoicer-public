import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
        '@keys': fileURLToPath(new URL('./keys', import.meta.url)),
      },
    },
    server: { 
      proxy: { "/api": 'http://' + env.VITE_BACKEND_HOST },
      allowedHosts: [env.VITE_ALLOWED_HOSTS]
    },
    build: {
      sourcemap: true
    }
  }
})
