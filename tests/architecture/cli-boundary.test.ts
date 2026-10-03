import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLI_SRC = join(ROOT, '../../apps/cli/src');

/**
 * 递归收集目录下所有 .ts 源文件的 @uiq/* 导入。
 */
function collectImports(dir: string): { file: string; imports: string[] }[] {
  const results: { file: string; imports: string[] }[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.ts')) continue;
      const content = readFileSync(full, 'utf-8');
      const matches = content.matchAll(/from\s+['"](@uiq\/[^'"\/]+)['"]/g);
      const imports = [...matches].map((m) => m[1]!);
      if (imports.length > 0) results.push({ file: full.replace(CLI_SRC + '/', ''), imports });
    }
  }
  if (statSync(dir).isDirectory()) walk(dir);
  return results;
}

describe('AC-ARCH-06: CLI 编排边界约束', () => {
  const imports = collectImports(CLI_SRC);

  it('CLI 导入核心运行时包 (编排角色)', () => {
    const allImports = new Set(imports.flatMap((i) => i.imports));
    const REQUIRED = ['@uiq/core', '@uiq/metrics', '@uiq/rules', '@uiq/diagnostic', '@uiq/reporting'];
    for (const pkg of REQUIRED) {
      expect(allImports.has(pkg), `CLI should import ${pkg}`).toBe(true);
    }
  });

  it('CLI 不导入 @uiq/browser (Browser 由运行时注入)', () => {
    const allImports = new Set(imports.flatMap((i) => i.imports));
    expect(allImports.has('@uiq/browser')).toBe(false);
  });

  it('CLI 所有命令文件存在', () => {
    const commandsDir = join(CLI_SRC, 'commands');
    expect(statSync(commandsDir).isDirectory()).toBe(true);
    const files = readdirSync(commandsDir).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(2);
  });
});
