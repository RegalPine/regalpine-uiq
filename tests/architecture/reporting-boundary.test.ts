import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PACKAGES = join(ROOT, '../../packages');

/**
 * 递归收集目录下所有 .ts 源文件的 @uiq/* 导入。
 */
function collectImports(pkgDir: string): { file: string; imports: string[] }[] {
  const results: { file: string; imports: string[] }[] = [];
  const srcDir = join(pkgDir, 'src');
  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!entry.endsWith('.ts')) continue;
      const content = readFileSync(full, 'utf-8');
      const matches = content.matchAll(/from\s+['"](@uiq\/[^'"\/]+)['"]/g);
      const imports = [...matches].map((m) => m[1]!);
      if (imports.length > 0) results.push({ file: full.replace(pkgDir + '/', ''), imports });
    }
  }
  if (statSync(srcDir).isDirectory()) walk(srcDir);
  return results;
}

describe('AC-ARCH-08: Reporting 不重新计算 Metric', () => {
  const imports = collectImports(join(PACKAGES, 'reporting'));
  const allImports = new Set(imports.flatMap((i) => i.imports));

  it('Reporting 不导入 @uiq/metrics', () => {
    expect(allImports.has('@uiq/metrics')).toBe(false);
  });

  it('Reporting 不导入 @uiq/rules', () => {
    expect(allImports.has('@uiq/rules')).toBe(false);
  });

  it('Reporting 只依赖 core/conformance/regression', () => {
    const ALLOWED = new Set(['@uiq/core', '@uiq/conformance', '@uiq/regression']);
    for (const imp of allImports) {
      expect(ALLOWED.has(imp), `Reporting imports unexpected ${imp}`).toBe(true);
    }
  });
});
