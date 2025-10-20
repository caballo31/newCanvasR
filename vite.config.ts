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
    host: true,
    // Use polling for the file watcher. This helps when running the dev server
    // from WSL while files are edited on Windows, or when the OS/file system
    // doesn't reliably emit file change events. Polling has higher CPU usage
    // but ensures HMR notices file edits without restarting the server.
    watch: {
      usePolling: true,
      // interval in milliseconds between polls. 100 is a reasonable default.
      interval: 100
    }
  },
  build: {
    commonjsOptions: {
      include: [/lodash/, /node_modules/]
    }
  }
})
