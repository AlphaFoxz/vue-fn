import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: ['libs/**'],
      exclude: ['libs/**/*.dep.ts'],
    },
  },
});
