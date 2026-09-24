import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  target: 'es2022',
  platform: 'node',
  banner: { js: '#!/usr/bin/env node' },
});
