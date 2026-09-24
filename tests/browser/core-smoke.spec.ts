import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// 直接读取公共 exports 指向的 ESM 产物，不重新打包，不注入 Node 垫片。
const modules = new Map([
  ['/core.js', readFileSync(fileURLToPath(import.meta.resolve('@uiq/core')), 'utf8')],
  ['/color.js', readFileSync(fileURLToPath(import.meta.resolve('@uiq/color')), 'utf8')],
]);

test('P1-05：Core/Color 公共 ESM 在无 Node 环境中加载和执行', async ({ page }) => {
  const errors: string[] = [];
  const unexpectedRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // 全部请求由测试拦截，不依赖外部网络或启动本地服务器。
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://uiq.test') {
      unexpectedRequests.push(url.href);
      await route.abort();
      return;
    }
    if (url.pathname === '/') {
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Core smoke</title>',
      });
      return;
    }
    const body = modules.get(url.pathname);
    if (body === undefined) {
      unexpectedRequests.push(url.href);
      await route.abort();
      return;
    }
    await route.fulfill({ contentType: 'text/javascript', body });
  });
  await page.goto('http://uiq.test');
  const result = await page.evaluate(async () => {
    const coreUrl = '/core.js';
    const colorUrl = '/color.js';
    const core = await import(coreUrl);
    const color = await import(colorUrl);
    const registry = new core.ExactVersionRegistry();
    registry.register({ id: 'SMOKE', version: '1.0.0' });
    let duplicateRejected = false;
    try {
      registry.register({ id: 'SMOKE', version: '1.0.0' });
    } catch {
      duplicateRejected = true;
    }
    return {
      hash: core.sha256('abc'),
      canonical: core.canonicalJson({ z: 1, a: [2, 1] }),
      ratio: color.contrastRatio(color.parseHex('#000'), color.parseHex('#fff')),
      hue: color.deltaH(350, 10),
      duplicateRejected,
      nodeGlobals: ['process', 'require', 'Buffer'].filter((name) => name in globalThis),
    };
  });
  expect(result).toEqual({
    hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    canonical: '{"a":[2,1],"z":1}',
    ratio: 21,
    hue: 20,
    duplicateRejected: true,
    nodeGlobals: [],
  });
  expect(errors).toEqual([]);
  expect(unexpectedRequests).toEqual([]);
});
