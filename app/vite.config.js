import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // All /api/* and /outputs/* requests are forwarded to the FastAPI server.
      // This eliminates CORS issues during local development — the browser
      // only ever talks to the Vite dev server (same origin).
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/outputs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    // Raise the chunk-size warning threshold (Three.js + R3F are large)
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three-core';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('framer-motion')) return 'framer';
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-core';
        },
      },
    },
  },
})
