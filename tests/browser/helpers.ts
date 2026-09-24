import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { Measurement, MeasurementSnapshot } from '@uiq/core';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Playwright 测试与 CLI 共用同一个 IIFE 产物（tsup iife，globalName=UIQBrowser）。 */
export const browserGlobalPath: string = require.resolve('@uiq/browser/browser-global');
/** P5：Radix adapter 的 IIFE 产物（globalName=UIQRadix）。 */
export const radixGlobalPath: string = require.resolve('@uiq/radix/browser-global');
export const cliEntryPath: string = path.resolve(here, '../../apps/cli/dist/index.js');

/** Reference 夹具为纯静态文件，file:// 直接打开（无需 webServer）。 */
export function referenceUrl(file: string): string {
  return `file://${path.resolve(here, '../../apps/reference', file)}`;
}

interface BrowserGlobalHost {
  UIQBrowser?: { capture(options?: Record<string, unknown>): unknown };
  UIQRadix?: {
    createAdapter(
      options?: Record<string, unknown>,
    ): Record<string, (...args: unknown[]) => unknown>;
  };
}

/** 注入采集脚本并执行 capture，返回 JSON 可序列化快照。 */
export async function injectAndCapture(
  page: Page,
  options: Record<string, unknown> = {},
): Promise<MeasurementSnapshot> {
  await page.addScriptTag({ path: browserGlobalPath });
  const raw: unknown = await page.evaluate((opts) => {
    const api = (window as unknown as BrowserGlobalHost).UIQBrowser;
    return api === undefined ? null : api.capture(opts);
  }, options);
  if (raw === null || typeof raw !== 'object') {
    throw new Error('window.UIQBrowser 未注入或 capture 未返回快照');
  }
  return raw as MeasurementSnapshot;
}

export function findMeasurement(
  snapshot: MeasurementSnapshot,
  subjectId: string,
  type: string,
): Measurement | undefined {
  return snapshot.measurements.find((m) => m.subjectId === subjectId && m.type === type);
}
