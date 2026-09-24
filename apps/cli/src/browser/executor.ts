import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { MeasurementSnapshot } from '@uiq/core';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CliError } from '../errors';

const require = createRequire(import.meta.url);

/** 页面内注入的采集 API（IIFE 挂载，不经模块系统）。 */
declare global {
  interface Window {
    UIQBrowser?: { capture(options?: { subjects?: string }): unknown };
  }
}

/** 导航与采集超时（毫秒）。 */
const NAVIGATION_TIMEOUT_MS = 30_000;
/** 固定测量视口与 DPR（IMPL-07 §71 Test Matrix：Chromium 1440×900 DPR 1）。 */
export const MEASUREMENT_VIEWPORT = { width: 1440, height: 900 } as const;
export const MEASUREMENT_DEVICE_SCALE_FACTOR = 1;

/**
 * UIQ-ARCH-01 §15.2 / P4-03：目标权限校验。
 * 默认仅允许 file:// 与 localhost/127.0.0.1/[::1]；其他目标必须显式 --allow-external。
 */
export function assertTargetAllowed(target: string, allowExternal: boolean): URL {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new CliError('INVALID_CONFIGURATION', `目标不是合法 URL：${target}`);
  }
  if (url.protocol === 'file:') {
    const filePath = url.pathname;
    if (!existsSync(filePath)) {
      throw new CliError('INPUT_ERROR', `file:// 目标不存在：${filePath}`);
    }
    return url;
  }
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
      return url;
    }
  }
  if (allowExternal) {
    return url;
  }
  throw new CliError(
    'INVALID_CONFIGURATION',
    `目标未授权：${url.host}。默认仅允许 file:// 与 localhost；外部目标需显式 --allow-external`,
  );
}

/** 解析 @uiq/browser 的 IIFE 构建产物路径（注入页面用）。 */
function resolveBrowserGlobalPath(): string {
  return require.resolve('@uiq/browser/browser-global');
}

/**
 * 校验并解析 auth-state 文件路径。
 * Playwright/storageState JSON 由 `browserContext.storageState({ path })` 导出，
 * 包含 cookies 与 origins（localStorage）。
 * 验证文件格式是否合法，防止传入无效文件。
 */
function resolveAuthState(authStatePath: string): string {
  const resolved = resolve(authStatePath);
  if (!existsSync(resolved)) {
    throw new CliError('INPUT_ERROR', `认证状态文件不存在：${resolved}`);
  }

  // 验证文件格式
  try {
    const content = readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      throw new CliError('INPUT_ERROR', `认证状态文件格式错误：不是有效的 JSON 对象：${resolved}`);
    }
    const state = parsed as Record<string, unknown>;
    // Playwright storageState 必须包含 cookies 或 origins 数组
    if (!Array.isArray(state.cookies) && !Array.isArray(state.origins)) {
      throw new CliError(
        'INPUT_ERROR',
        `认证状态文件格式错误：缺少 cookies 或 origins 数组：${resolved}\n` +
          '提示：使用 `uiq auth-save` 或 Playwright `context.storageState()` 生成有效文件',
      );
    }
  } catch (error) {
    if (error instanceof CliError) throw error;
    if (error instanceof SyntaxError) {
      throw new CliError('INPUT_ERROR', `认证状态文件不是有效的 JSON：${resolved}\n${error.message}`);
    }
    throw new CliError('INPUT_ERROR', `读取认证状态文件失败：${resolved}\n${String(error)}`);
  }

  return resolved;
}

/** IMPL-07 §47-48：等待字体与布局稳定（fonts.ready + 双 rAF）。 */
async function stabilize(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

/**
 * UIQ-ARCH-01 §15.2：隔离浏览器会话执行采集。
 * finally 关闭浏览器 —— 导航失败、采集失败或取消都必须清理（P4-03）。
 * 失败以 CliError(EXECUTION_ERROR) 抛出，绝不输出伪质量结论。
 *
 * @param authStatePath Playwright storageState JSON 文件路径（cookies + localStorage），
 *   用于需要登录态的目标页面。由 `context.storageState()` 导出。
 */
export async function captureWithBrowser(
  target: string,
  captureOptions: { readonly subjects?: string } = {},
  authStatePath?: string,
): Promise<MeasurementSnapshot> {
  const url = assertTargetAllowed(target, false);
  const fileUrl = url.protocol === 'file:' ? pathToFileURL(url.pathname).href : url.href;
  const resolvedAuthState = authStatePath !== undefined ? resolveAuthState(authStatePath) : undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { ...MEASUREMENT_VIEWPORT },
      deviceScaleFactor: MEASUREMENT_DEVICE_SCALE_FACTOR,
      ...(resolvedAuthState !== undefined ? { storageState: resolvedAuthState } : {}),
    });
    const page = await context.newPage();
    await page.goto(fileUrl, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
    await stabilize(page);
    await page.addScriptTag({ path: resolveBrowserGlobalPath() });
    const snapshot = await page.evaluate((options) => {
      const api = window.UIQBrowser;
      if (api === undefined) return null;
      return api.capture(options) as unknown;
    }, captureOptions);
    if (snapshot === null || typeof snapshot !== 'object') {
      throw new CliError('EXECUTION_ERROR', '页面采集脚本未返回 MeasurementSnapshot');
    }
    return snapshot as MeasurementSnapshot;
  } catch (error) {
    if (error instanceof CliError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError('EXECUTION_ERROR', `浏览器采集失败：${message}`);
  } finally {
    await browser.close();
  }
}
