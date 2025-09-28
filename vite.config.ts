import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  },
  resolve: {
    alias: {
      '@app': '/src/app',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@styles': '/src/styles'
    }
  }
});
