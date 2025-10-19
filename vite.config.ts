import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@tldraw/tldraw',
      'lodash.throttle',
      'lodash.debounce',
      'lodash.isequal'
    ],
    exclude: ['@tldraw/tldraw']
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    commonjsOptions: {
      include: [/lodash/, /node_modules/]
    }
  }
})
