import { describe, it, expect } from 'vitest';
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCli, type CliIO } from '../../apps/cli/src/index';

/**
 * auth-clean / auth-state 验证 E2E 测试。
 */

// 使用存在的参考页面作为目标
const REFERENCE_FILE = join(process.cwd(), 'apps', 'reference', 'button.html');

function captureIO(): { io: CliIO; outLines: string[]; errLines: string[] } {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    io: {
      out: (l) => outLines.push(l),
      err: (l) => errLines.push(l),
    },
    outLines,
    errLines,
  };
}

describe('auth-clean E2E', () => {
  it('auth-clean 删除存在的文件', async () => {
    const testFile = join(tmpdir(), `uiq-test-auth-${Date.now()}.json`);
    writeFileSync(testFile, JSON.stringify({ cookies: [{ name: 'test' }], origins: [] }));

    const { io } = captureIO();
    const result = await runCli(['auth-clean', testFile], io);

    expect(result.code).toBe(0);
    expect(result.response.status).toBe('COMPLETED');
    const data = result.response.data as { removed: boolean; hadCookies: number };
    expect(data.removed).toBe(true);
    expect(data.hadCookies).toBe(1);
    expect(existsSync(testFile)).toBe(false);
  });

  it('auth-clean 对不存在的文件返回 removed=false', async () => {
    const { io } = captureIO();
    const result = await runCli(['auth-clean', '/tmp/nonexistent-auth-file.json'], io);

    expect(result.code).toBe(0);
    expect(result.response.status).toBe('COMPLETED');
    const data = result.response.data as { removed: boolean };
    expect(data.removed).toBe(false);
  });

  it('auth-clean 缺少参数 → exit 4', async () => {
    const { io } = captureIO();
    const result = await runCli(['auth-clean'], io);

    expect(result.code).toBe(4);
    expect(result.response.status).toBe('ERROR');
  });
});

describe('auth-state 验证 E2E', () => {
  it('无效 JSON → exit 5 INPUT_ERROR', async () => {
    const testFile = join(tmpdir(), `uiq-bad-auth-${Date.now()}.json`);
    writeFileSync(testFile, 'not valid json');

    const { io } = captureIO();
    const result = await runCli(
      ['measure', `file://${REFERENCE_FILE}`, '--auth-state', testFile],
      io,
    );

    expect(result.response.status).toBe('ERROR');
    const errors = result.response.errors;
    expect(errors?.[0]?.code).toBe('INPUT_ERROR');
    expect(errors?.[0]?.message).toContain('不是有效的 JSON');

    rmSync(testFile, { force: true });
  });

  it('缺少 cookies/origins → exit 5 INPUT_ERROR', async () => {
    const testFile = join(tmpdir(), `uiq-bad-auth2-${Date.now()}.json`);
    writeFileSync(testFile, JSON.stringify({ foo: 'bar' }));

    const { io } = captureIO();
    const result = await runCli(
      ['measure', `file://${REFERENCE_FILE}`, '--auth-state', testFile],
      io,
    );

    expect(result.response.status).toBe('ERROR');
    const errors = result.response.errors;
    expect(errors?.[0]?.code).toBe('INPUT_ERROR');
    expect(errors?.[0]?.message).toContain('缺少 cookies 或 origins');

    rmSync(testFile, { force: true });
  });

  it('文件不存在 → exit 5 INPUT_ERROR', async () => {
    const { io } = captureIO();
    const result = await runCli(
      ['measure', `file://${REFERENCE_FILE}`, '--auth-state', '/tmp/nonexistent-auth.json'],
      io,
    );

    expect(result.response.status).toBe('ERROR');
    const errors = result.response.errors;
    expect(errors?.[0]?.code).toBe('INPUT_ERROR');
    expect(errors?.[0]?.message).toContain('认证状态文件不存在');
  });
});
