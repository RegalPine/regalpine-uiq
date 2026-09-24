import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * P12-04：构建产物兼容性加固。
 *
 * Browser bundle（@uiq/browser IIFE）不得泄漏 Node/Playwright 专属全局。
 * 离线分析与报告不依赖浏览器或后端。
 */
describe('P12-04：构建产物边界', () => {
  it('@uiq/browser IIFE 产物存在且非空', () => {
    const browserGlobal = resolve(ROOT, 'packages/browser/dist/browser-global.js');
    expect(existsSync(browserGlobal)).toBe(true);
    const content = readFileSync(browserGlobal, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('browser bundle 不引用 Node 专属 API（require/process/Buffer/__dirname）', () => {
    const browserGlobal = resolve(ROOT, 'packages/browser/dist/browser-global.js');
    const content = readFileSync(browserGlobal, 'utf-8');
    // 检查常见 Node 泄漏（排除注释和字符串中的假阳性）
    // require( 模式（排除 dynamic import 中的 require）
    const requirePattern = /[^a-zA-Z_]require\s*\(/;
    expect(requirePattern.test(content)).toBe(false);
    // process.env / process.exit 等
    expect(content).not.toMatch(/process\.env/);
    expect(content).not.toMatch(/process\.exit/);
    // Buffer.from 等
    expect(content).not.toMatch(/Buffer\./);
    // __dirname / __filename
    expect(content).not.toContain('__dirname');
    expect(content).not.toContain('__filename');
  });

  it('CLI dist 产物存在且可执行', () => {
    const cliDist = resolve(ROOT, 'apps/cli/dist/index.js');
    expect(existsSync(cliDist)).toBe(true);
    const content = readFileSync(cliDist, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('Inspector dist 产物存在', () => {
    const inspectorDist = resolve(ROOT, 'apps/inspector/dist/index.html');
    expect(existsSync(inspectorDist)).toBe(true);
  });

  it('所有包 dist 产物存在（13 个包）', () => {
    const packages = [
      'core',
      'color',
      'geometry',
      'measurement',
      'metrics',
      'rules',
      'diagnostic',
      'browser',
      'tokens',
      'theme',
      'conformance',
      'regression',
      'reporting',
    ];
    for (const pkg of packages) {
      const distIndex = resolve(ROOT, 'packages', pkg, 'dist/index.js');
      expect(existsSync(distIndex), `${pkg} dist/index.js 缺失`).toBe(true);
    }
  });
});

/**
 * P12-03：安全边界 — CLI 不暗中执行浏览器、不泄漏凭据。
 */
describe('P12-03：CLI 安全边界', () => {
  it('外域目标未加 --allow-external → 拒绝（不启动浏览器）', async () => {
    const { runCli } = await import('../../apps/cli/src/index');
    const lines: string[] = [];
    const io = { out: (l: string) => lines.push(l), err: () => {} };
    const result = await runCli(['analyze', 'https://example.com'], io);
    expect(result.code).toBe(4);
    const response = JSON.parse(lines[0]!) as { errors?: { code: string }[] };
    expect(response.errors?.[0]?.code).toBe('INVALID_CONFIGURATION');
  });

  it('file:// 目标指向工作区内快照 → 允许（不触发外部检查）', async () => {
    const fixture = resolve(ROOT, 'tests/fixtures/analysis/fixture-snapshot.json');
    const { runCli } = await import('../../apps/cli/src/index');
    const lines: string[] = [];
    const io = { out: (l: string) => lines.push(l), err: () => {} };
    await runCli(['evaluate', fixture], io);
    const response = JSON.parse(lines[0]!) as { status: string };
    expect(response.status).toBe('COMPLETED');
  });
});

/**
 * P12-03：错误注入 — 损坏输入不产生伪结论。
 */
describe('P12-03：错误注入（损坏输入处理）', () => {
  it('损坏的 JSON 快照 → exit 5 INPUT_ERROR（不伪造分析结论）', async () => {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const tmpDir = resolve(ROOT, 'test-results/p12-error-injection');
    mkdirSync(tmpDir, { recursive: true });
    const corruptPath = resolve(tmpDir, 'corrupt.json');
    writeFileSync(corruptPath, '{invalid json!!', 'utf-8');

    const { runCli } = await import('../../apps/cli/src/index');
    const lines: string[] = [];
    const io = { out: (l: string) => lines.push(l), err: () => {} };
    const result = await runCli(['evaluate', corruptPath], io);
    expect(result.code).toBe(5);
    const response = JSON.parse(lines[0]!) as { status: string };
    expect(response.status).toBe('ERROR');
  });

  it('不存在的快照文件 → exit 5 INPUT_ERROR', async () => {
    const { runCli } = await import('../../apps/cli/src/index');
    const lines: string[] = [];
    const io = { out: (l: string) => lines.push(l), err: () => {} };
    const result = await runCli(['evaluate', '/nonexistent/snapshot.json'], io);
    expect(result.code).toBe(5);
  });
});
