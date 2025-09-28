import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': '/src/app',
      '@components': '/src/components',
      '@db': '/src/db',
      '@domain': '/src/domain',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@styles': '/src/styles',
      '@utils': '/src/utils'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
