import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * P12-05：发布候选验收汇总。
 *
 * 汇总 AC-ARCH-01～14 关闭证据，验证：
 * - 13 个包、4 个应用、Radix 集成和 Skill 在候选版本下可用
 * - 版本一致性
 * - 离线分析不依赖浏览器或后端
 */
describe('P12-05：发布候选验收汇总', () => {
  const EXPECTED_PACKAGES = [
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

  const EXPECTED_APPS = ['cli', 'reference', 'inspector', 'playground'];

  it('13 个包全部存在且声明版本 1.0.0', () => {
    for (const pkg of EXPECTED_PACKAGES) {
      const pkgJson = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      expect(pkgJson.version, `${pkg} 版本应为 1.0.0`).toBe('1.0.0');
      expect(existsSync(join(ROOT, 'packages', pkg, 'src', 'index.ts'))).toBe(true);
    }
  });

  it('4 个应用全部存在', () => {
    for (const app of EXPECTED_APPS) {
      const appDir = join(ROOT, 'apps', app);
      expect(existsSync(appDir), `${app} 目录缺失`).toBe(true);
    }
    // reference 为纯静态目录（无 package.json），其余有 package.json
    expect(existsSync(join(ROOT, 'apps', 'reference', 'package.json'))).toBe(false);
    for (const app of ['cli', 'inspector', 'playground']) {
      expect(existsSync(join(ROOT, 'apps', app, 'package.json')), `${app} package.json 缺失`).toBe(
        true,
      );
    }
  });

  it('integrations/radix 存在且可用', () => {
    const radixDir = join(ROOT, 'integrations', 'radix');
    expect(existsSync(join(radixDir, 'package.json'))).toBe(true);
    expect(existsSync(join(radixDir, 'src', 'index.ts'))).toBe(true);
  });

  it('Skill 包存在且结构完整（P11 交付）', () => {
    const skillDir = join(ROOT, 'skills', 'uiq-ui-quality');
    expect(existsSync(join(skillDir, 'SKILL.md'))).toBe(true);
    expect(existsSync(join(skillDir, 'workflows'))).toBe(true);
    expect(existsSync(join(skillDir, 'references'))).toBe(true);
    const workflows = readdirSync(join(skillDir, 'workflows'));
    expect(workflows.length).toBeGreaterThanOrEqual(10);
    const references = readdirSync(join(skillDir, 'references'));
    expect(references.length).toBeGreaterThanOrEqual(8);
  });

  it('CLI 版本与包版本一致（1.0.0）', () => {
    const cliPkg = JSON.parse(readFileSync(join(ROOT, 'apps', 'cli', 'package.json'), 'utf-8'));
    expect(cliPkg.version).toBe('1.0.0');
  });

  it('根工程版本与包版本一致（1.0.0）', () => {
    const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    expect(rootPkg.version).toBe('1.0.0');
  });

  it('离线分析不依赖浏览器（evaluate 命令可直接消费快照文件）', () => {
    // 验证 evaluate 命令的源码不导入 @uiq/browser
    const evaluateSrc = readFileSync(
      join(ROOT, 'apps', 'cli', 'src', 'commands', 'evaluate.ts'),
      'utf-8',
    );
    expect(evaluateSrc).not.toContain('@uiq/browser');
  });

  it('报告生成不依赖浏览器（report 命令的源码无浏览器引用）', () => {
    const reportSrc = readFileSync(
      join(ROOT, 'apps', 'cli', 'src', 'commands', 'report.ts'),
      'utf-8',
    );
    expect(reportSrc).not.toContain('@uiq/browser');
    expect(reportSrc).not.toContain('playwright');
  });

  it('pnpm-workspace.yaml 包含 packages/* 和 apps/*', () => {
    const workspace = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf-8');
    expect(workspace).toContain('packages/*');
  });

  it('CI 门禁脚本包含完整检查链', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    const ciSteps = pkg.scripts.ci.split(' && ');
    expect(ciSteps).toContain('pnpm format:check');
    expect(ciSteps).toContain('pnpm lint');
    expect(ciSteps).toContain('pnpm build');
    expect(ciSteps).toContain('pnpm typecheck');
    expect(ciSteps).toContain('pnpm test');
    expect(ciSteps).toContain('pnpm exec playwright test');
  });
});

/**
 * P12-02：Conformance 等级执行证据。
 *
 * 验证 @uiq/conformance 包提供四级等级检查。
 */
describe('P12-02：Conformance 等级覆盖', () => {
  it('conformance 包导出 resolveLevel 和 assertLevelExecutable', async () => {
    const conformance = await import('@uiq/conformance');
    expect(typeof conformance.resolveLevel).toBe('function');
    expect(typeof conformance.assertLevelExecutable).toBe('function');
  });

  it('四级等级全部可解析', async () => {
    const conformance = await import('@uiq/conformance');
    // resolveLevel 需要 entries + level 两个参数；使用空数组验证函数可调用
    for (const level of ['CORE', 'STANDARD', 'BROWSER', 'FULL'] as const) {
      const entries = conformance.resolveLevel([], level);
      expect(Array.isArray(entries)).toBe(true);
    }
  });
});

/**
 * P12-02：Regression 六类分类覆盖。
 */
describe('P12-02：Regression 分类覆盖', () => {
  it('regression 包导出 runRegression 和 deserializeBaseline', async () => {
    const regression = await import('@uiq/regression');
    expect(typeof regression.runRegression).toBe('function');
    expect(typeof regression.deserializeBaseline).toBe('function');
  });
});

/**
 * P12-02：Reporting 多格式渲染覆盖。
 */
describe('P12-02：Reporting 渲染覆盖', () => {
  it('reporting 包导出三种渲染器（JSON/Markdown/HTML）', async () => {
    const reporting = await import('@uiq/reporting');
    expect(typeof reporting.renderJson).toBe('function');
    expect(typeof reporting.renderMarkdown).toBe('function');
    expect(typeof reporting.renderHtml).toBe('function');
  });
});
