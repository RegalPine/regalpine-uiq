import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uiq/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@uiq/browser': fileURLToPath(
        new URL('../../packages/browser/src/index.ts', import.meta.url),
      ),
      '@uiq/metrics': fileURLToPath(
        new URL('../../packages/metrics/src/index.ts', import.meta.url),
      ),
      '@uiq/rules': fileURLToPath(new URL('../../packages/rules/src/index.ts', import.meta.url)),
      '@uiq/diagnostic': fileURLToPath(
        new URL('../../packages/diagnostic/src/index.ts', import.meta.url),
      ),
      '@uiq/reporting': fileURLToPath(
        new URL('../../packages/reporting/src/index.ts', import.meta.url),
      ),
      '@uiq/regression': fileURLToPath(
        new URL('../../packages/regression/src/index.ts', import.meta.url),
      ),
      '@uiq/tokens': fileURLToPath(new URL('../../packages/tokens/src/index.ts', import.meta.url)),
      '@uiq/theme': fileURLToPath(new URL('../../packages/theme/src/index.ts', import.meta.url)),
      '@uiq/measurement': fileURLToPath(
        new URL('../../packages/measurement/src/index.ts', import.meta.url),
      ),
      '@uiq/radix': fileURLToPath(
        new URL('../../integrations/radix/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
});
