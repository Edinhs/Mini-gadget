import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// SPEC §2: três bundles independentes — main (Node), preload (bridge), renderer (sandbox).
export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      lib: { entry: resolve(__dirname, 'src/main/main.ts') },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      lib: { entry: resolve(__dirname, 'src/preload/preload.ts') },
    },
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: { input: resolve(__dirname, 'src/renderer/index.html') },
    },
    resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
    plugins: [react()],
  },
});
