import { defineConfig } from '@playwright/test';

// E2E roda contra o Electron empacotado. Exige display — na prática, a máquina
// Windows do usuário. Ver docs/SPR.md (T-33).
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
});
