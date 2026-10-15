import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // DISABLE_HMR=true desactiva HMR en entornos donde el watcher genera parpadeos.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api/booking': {
        target: 'https://barberflow-n8n.13zseu.easypanel.host/webhook/barberflow',
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
    css: false,
    testTimeout: 15000,
  },
});
