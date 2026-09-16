import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    passWithNoTests: true,
  },
  resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
});
