import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/domain/**/*.ts', 'scripts/**/*.ts'],
        exclude: ['**/*.test.ts', '**/index.ts', '**/types.ts'],
        thresholds: {
          'src/domain/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
        },
      },
    },
  }),
);
