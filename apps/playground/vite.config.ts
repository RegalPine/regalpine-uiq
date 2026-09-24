import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uiq/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@uiq/metrics': fileURLToPath(
        new URL('../../packages/metrics/src/index.ts', import.meta.url),
      ),
      '@uiq/rules': fileURLToPath(new URL('../../packages/rules/src/index.ts', import.meta.url)),
      '@uiq/diagnostic': fileURLToPath(
        new URL('../../packages/diagnostic/src/index.ts', import.meta.url),
      ),
      '@uiq/measurement': fileURLToPath(
        new URL('../../packages/measurement/src/index.ts', import.meta.url),
      ),
    },
  },
});
