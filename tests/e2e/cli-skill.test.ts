import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { runCli, type CliIO } from '../../apps/cli/src/index';

/**
 * install-skill / uninstall-skill 命令 E2E 测试。
 * 验证 Skill 安装/卸载生命周期。
 */

const io: CliIO = { out: () => {}, err: () => {} };

function captureIO(): { io: CliIO; lines: string[] } {
  const lines: string[] = [];
  return {
    io: {
      out: (l) => lines.push(l),
      err: (l) => lines.push(l),
    },
    lines,
  };
}

describe('install-skill / uninstall-skill E2E', () => {
  it('install-skill --help 显示用法', async () => {
    const { io: testIO, lines } = captureIO();
    const result = await runCli(['install-skill', '--help'], testIO);
    expect(result.code).toBe(0);
    expect(lines.some((l) => l.includes('install-skill'))).toBe(true);
  });

  it('install-skill 到 qoder（默认）', async () => {
    const qoderSkillsDir = join(homedir(), '.qoder', 'skills');
    if (!existsSync(qoderSkillsDir)) return; // 跳过如果 Agent 未安装

    const dest = join(qoderSkillsDir, 'uiq-ui-quality');

    // 先卸载（如果已安装）
    await runCli(['uninstall-skill', '--agent', 'qoder'], io);

    // 安装
    const result = await runCli(['install-skill', '--agent', 'qoder'], io);
    expect(result.code).toBe(0);
    expect(result.response.status).toBe('COMPLETED');
    expect(existsSync(dest)).toBe(true);
  });

  it('install-skill --agent all 安装到所有 Agent', async () => {
    const result = await runCli(['install-skill', '--agent', 'all'], io);
    expect(result.code).toBe(0);
    expect(result.response.status).toBe('COMPLETED');
    const data = result.response.data as { results: Array<{ agent: string; mode: string }> };
    expect(data.results.length).toBeGreaterThan(0);
  });

  it('uninstall-skill 卸载 qoder', async () => {
    const qoderSkillsDir = join(homedir(), '.qoder', 'skills');
    if (!existsSync(qoderSkillsDir)) return;

    // 先安装
    await runCli(['install-skill', '--agent', 'qoder'], io);

    // 卸载
    const result = await runCli(['uninstall-skill', '--agent', 'qoder'], io);
    expect(result.code).toBe(0);
    expect(result.response.status).toBe('COMPLETED');
    const data = result.response.data as { removed: boolean };
    expect(data.removed).toBe(true);

    const dest = join(qoderSkillsDir, 'uiq-ui-quality');
    expect(existsSync(dest)).toBe(false);
  });

  it('uninstall-skill --agent all 被拒绝', async () => {
    const result = await runCli(['uninstall-skill', '--agent', 'all'], io);
    expect(result.code).toBe(4); // INVALID_CONFIGURATION
    expect(result.response.status).toBe('ERROR');
  });

  it('uninstall-skill 对未安装的 Agent 返回 removed=false', async () => {
    // 先确保卸载
    await runCli(['uninstall-skill', '--agent', 'qoder'], io);

    const result = await runCli(['uninstall-skill', '--agent', 'qoder'], io);
    expect(result.code).toBe(0);
    const data = result.response.data as { removed: boolean };
    expect(data.removed).toBe(false);
  });
});
