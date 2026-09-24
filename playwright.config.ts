import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { headless: true, viewport: { width: 1440, height: 900 } },
  projects: [
    // P12-01：三浏览器 × Light/Dark 完整矩阵
    { name: 'chromium-light', use: { browserName: 'chromium', colorScheme: 'light' } },
    { name: 'chromium-dark', use: { browserName: 'chromium', colorScheme: 'dark' } },
    { name: 'firefox-light', use: { browserName: 'firefox', colorScheme: 'light' } },
    { name: 'firefox-dark', use: { browserName: 'firefox', colorScheme: 'dark' } },
    { name: 'webkit-light', use: { browserName: 'webkit', colorScheme: 'light' } },
    { name: 'webkit-dark', use: { browserName: 'webkit', colorScheme: 'dark' } },
  ],
});
