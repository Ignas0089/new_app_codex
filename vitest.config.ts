import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const coverageConfig = (() => {
  try {
    require.resolve('@vitest/coverage-v8');
    return {
      provider: 'v8' as const,
      reporter: ['text', 'lcov'],
      include: ['src/services/**/*.ts', 'src/utils/**/*.ts']
    };
  } catch {
    return {
      enabled: false,
      reporter: ['text'],
      include: ['src/services/**/*.ts', 'src/utils/**/*.ts']
    };
  }
})();

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
      '@utils': '/src/utils',
      '@test': '/src/test'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    reporters: process.env.CI
      ? ['default', ['junit', { outputFile: 'reports/junit.xml' }]]
      : 'default',
    coverage: coverageConfig
  }
});
