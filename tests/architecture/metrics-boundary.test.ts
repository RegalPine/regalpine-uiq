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

describe('AC-ARCH-02: Metrics 包边界约束', () => {
  const imports = collectImports(join(PACKAGES, 'metrics'));
  const FORBIDDEN = ['@uiq/rules', '@uiq/browser', '@uiq/reporting', '@uiq/diagnostic', '@uiq/cli'];

  it('Metrics 源文件不导入 Rule/Browser/Reporting/Diagnostic/CLI', () => {
    for (const { file, imports: imps } of imports) {
      for (const imp of imps) {
        expect(FORBIDDEN, `${file} should not import ${imp}`).not.toContain(imp);
      }
    }
  });

  it('Metrics 只允许导入 core/color/geometry/measurement', () => {
    const ALLOWED = new Set(['@uiq/core', '@uiq/color', '@uiq/geometry', '@uiq/measurement']);
    for (const { file, imports: imps } of imports) {
      for (const imp of imps) {
        expect(ALLOWED.has(imp), `${file} imports unexpected ${imp}`).toBe(true);
      }
    }
  });
});

describe('AC-ARCH-03: Rules 包边界约束', () => {
  const imports = collectImports(join(PACKAGES, 'rules'));
  const FORBIDDEN = ['@uiq/browser', '@uiq/reporting', '@uiq/cli'];

  it('Rules 源文件不导入 Browser/Reporting/CLI', () => {
    for (const { file, imports: imps } of imports) {
      for (const imp of imps) {
        expect(FORBIDDEN, `${file} should not import ${imp}`).not.toContain(imp);
      }
    }
  });
});

describe('AC-ARCH-04: Diagnostic 包边界约束', () => {
  const imports = collectImports(join(PACKAGES, 'diagnostic'));
  const FORBIDDEN = ['@uiq/browser', '@uiq/cli'];

  it('Diagnostic 源文件不导入 Browser/CLI', () => {
    for (const { file, imports: imps } of imports) {
      for (const imp of imps) {
        expect(FORBIDDEN, `${file} should not import ${imp}`).not.toContain(imp);
      }
    }
  });
});

describe('AC-ARCH-05: Reporting 包边界约束', () => {
  const imports = collectImports(join(PACKAGES, 'reporting'));
  const FORBIDDEN = ['@uiq/metrics', '@uiq/browser', '@uiq/cli'];

  it('Reporting 不重新计算 Metric (不导入 @uiq/metrics)', () => {
    for (const { file, imports: imps } of imports) {
      for (const imp of imps) {
        expect(FORBIDDEN, `${file} should not import ${imp}`).not.toContain(imp);
      }
    }
  });
});
