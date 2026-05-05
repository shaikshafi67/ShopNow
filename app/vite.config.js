import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/utils/**', 'src/context/**'],
    },
  },

  server: {
    port: 5173,
    strictPort: true,  // NEVER fall back to 5174+ — always use 5173
    proxy: {
      // All /api/* and /outputs/* requests are forwarded to the FastAPI server.
      // This eliminates CORS issues during local development — the browser
      // only ever talks to the Vite dev server (same origin).
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Skip browser-extension calls (e.g. /api/ext/activate, /api/ext/auth-token)
        bypass: (req) => {
          if (req.url && req.url.startsWith('/api/ext/')) return req.url;
          return null;
        },
      },
      '/outputs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Replicate API calls to avoid browser CORS block
      '/replicate': {
        target: 'https://api.replicate.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/replicate/, '/v1'),
      },
      // Proxy Fashn.ai calls
      '/fashn': {
        target: 'https://api.fashn.ai',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/fashn/, '/v1'),
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
