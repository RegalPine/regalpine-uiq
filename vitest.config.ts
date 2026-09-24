import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@uiq/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@uiq/color': fileURLToPath(new URL('./packages/color/src/index.ts', import.meta.url)),
      '@uiq/geometry': fileURLToPath(new URL('./packages/geometry/src/index.ts', import.meta.url)),
      '@uiq/measurement': fileURLToPath(
        new URL('./packages/measurement/src/index.ts', import.meta.url),
      ),
      '@uiq/metrics': fileURLToPath(new URL('./packages/metrics/src/index.ts', import.meta.url)),
      '@uiq/rules': fileURLToPath(new URL('./packages/rules/src/index.ts', import.meta.url)),
      '@uiq/diagnostic': fileURLToPath(
        new URL('./packages/diagnostic/src/index.ts', import.meta.url),
      ),
      '@uiq/browser': fileURLToPath(new URL('./packages/browser/src/index.ts', import.meta.url)),
      '@uiq/tokens': fileURLToPath(new URL('./packages/tokens/src/index.ts', import.meta.url)),
      '@uiq/theme': fileURLToPath(new URL('./packages/theme/src/index.ts', import.meta.url)),
      '@uiq/conformance': fileURLToPath(
        new URL('./packages/conformance/src/index.ts', import.meta.url),
      ),
      '@uiq/regression': fileURLToPath(
        new URL('./packages/regression/src/index.ts', import.meta.url),
      ),
      '@uiq/reporting': fileURLToPath(
        new URL('./packages/reporting/src/index.ts', import.meta.url),
      ),
      '@uiq/radix': fileURLToPath(new URL('./integrations/radix/src/index.ts', import.meta.url)),
      '@uiq/cli': fileURLToPath(new URL('./apps/cli/src/index.ts', import.meta.url)),
      '@uiq/inspector': fileURLToPath(new URL('./apps/inspector/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/browser/**'],
    passWithNoTests: false,
  },
});
