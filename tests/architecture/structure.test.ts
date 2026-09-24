import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { builtinModules } from 'node:module';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

describe('AC-ARCH-01: 工程结构约束', () => {
  it('CI 固定版本、冻结安装、构建先于测试且失败保留报告', () => {
    const workflow = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    expect(workflow).toContain('version: 10.28.2');
    expect(workflow).toContain('node-version: 24.13.0');
    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow).toContain('playwright install --with-deps chromium firefox webkit');
    expect(workflow).toContain('run: pnpm run ci');
    expect(workflow).toContain('if: always()');
    expect(workflow).toContain('contents: read');
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    expect(pkg.packageManager).toBe('pnpm@10.28.2');
    expect(pkg.scripts.ci.split(' && ')).toEqual([
      'pnpm format:check',
      'pnpm lint',
      'pnpm build',
      'pnpm typecheck',
      'pnpm test',
      'pnpm exec playwright test',
    ]);
    expect(pkg.scripts['test:contract']).not.toContain('vitest run tests/contract');
    expect(pkg.scripts['test:baseline']).toContain('tests/unit/regression/baseline.test.ts');
  });

  it('pnpm-workspace.yaml 存在且包含 packages/*', () => {
    const content = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf-8');
    expect(content).toContain('packages/*');
  });

  it('tsconfig.base.json 启用 strict 模式', () => {
    const content = readFileSync(join(ROOT, 'tsconfig.base.json'), 'utf-8');
    const config = JSON.parse(content) as { compilerOptions: Record<string, unknown> };
    expect(config.compilerOptions.strict).toBe(true);
    expect(config.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    expect(config.compilerOptions.exactOptionalPropertyTypes).toBe(true);
  });

  it('根 package.json 声明 ESM 和引擎约束', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
    expect(pkg.type).toBe('module');
    expect(pkg.engines?.node).toBeDefined();
    expect(pkg.engines?.pnpm).toBeDefined();
  });
});

describe('AC-ARCH-02: 包结构约束', () => {
  const expectedPackages = [
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

  for (const pkg of expectedPackages) {
    it(`@uiq/${pkg} 包结构完整`, () => {
      const pkgDir = join(ROOT, 'packages', pkg);
      expect(existsSync(join(pkgDir, 'package.json'))).toBe(true);
      expect(existsSync(join(pkgDir, 'tsconfig.json'))).toBe(true);
      expect(existsSync(join(pkgDir, 'src', 'index.ts'))).toBe(true);
    });

    it(`@uiq/${pkg} 的 package.json 声明 ESM`, () => {
      const content = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      expect(content.type).toBe('module');
    });
  }
});

describe('AC-ARCH-03: 架构依赖白名单', () => {
  const ALLOWED_EXTERNAL_DEPS = new Set([
    'vitest',
    '@playwright/test',
    'tsup',
    'typescript',
    'eslint',
    'prettier',
    'ajv',
    'ajv-formats',
  ]);

  it('包之间不引入未声明的内部依赖', () => {
    const packagesDir = join(ROOT, 'packages');
    const packages = readdirSync(packagesDir).filter((name) => {
      return statSync(join(packagesDir, name)).isDirectory();
    });

    for (const pkg of packages) {
      const pkgJson = JSON.parse(readFileSync(join(packagesDir, pkg, 'package.json'), 'utf-8'));
      const allDeps = {
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies,
        ...pkgJson.peerDependencies,
      };

      for (const [dep] of Object.entries(allDeps ?? {})) {
        if (dep.startsWith('@uiq/')) {
          // 依赖白名单（ARCH-01 §4.2）：metrics 允许 core/color/geometry/measurement（不含 tokens，
          // Token 指标经端口注入）；theme 允许 core+tokens；browser 允许 §4.2 全集（允许≠必须使用）；
          // rules/diagnostic/tokens/conformance/regression 只允许 core
          const allowedInternal = new Set(['@uiq/core']);
          if (pkg === 'metrics') {
            allowedInternal.add('@uiq/color');
            allowedInternal.add('@uiq/geometry');
            allowedInternal.add('@uiq/measurement');
          }
          if (pkg === 'theme') {
            allowedInternal.add('@uiq/tokens');
          }
          if (pkg === 'browser') {
            allowedInternal.add('@uiq/measurement');
            allowedInternal.add('@uiq/color');
            allowedInternal.add('@uiq/geometry');
            allowedInternal.add('@uiq/tokens');
            allowedInternal.add('@uiq/theme');
          }
          // P7-05（ARCH-01 §4.2）：reporting 允许 core + conformance + regression（事实类型复用）。
          if (pkg === 'reporting') {
            allowedInternal.add('@uiq/diagnostic');
            allowedInternal.add('@uiq/conformance');
            allowedInternal.add('@uiq/regression');
          }
          expect(allowedInternal.has(dep), `${pkg} 不应依赖 ${dep}`).toBe(true);
        } else {
          expect(ALLOWED_EXTERNAL_DEPS.has(dep), `${pkg} 外部依赖需显式登记：${dep}`).toBe(true);
        }
      }
    }
  });

  it('apps/cli 依赖白名单（领域包 + browser，ARCH-01 AD-03）', () => {
    const pkgJson = JSON.parse(readFileSync(join(ROOT, 'apps', 'cli', 'package.json'), 'utf-8'));
    const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
    const allowed = new Set([
      '@uiq/core',
      '@uiq/color',
      '@uiq/geometry',
      '@uiq/measurement',
      '@uiq/metrics',
      '@uiq/rules',
      '@uiq/diagnostic',
      '@uiq/browser',
      '@uiq/tokens',
      '@uiq/theme',
      // P6-05：CLI 内部回归适配（toAnalysisSnapshot/toGateInput；不新增命令）。
      '@uiq/regression',
      // P10：Conformance 等级检查 + Reporting 报告生成。
      '@uiq/conformance',
      '@uiq/reporting',
    ]);
    const internalDeps = Object.keys(allDeps).filter((dep) => dep.startsWith('@uiq/'));
    expect(internalDeps.length).toBeGreaterThan(0);
    for (const dep of internalDeps) {
      expect(allowed.has(dep), `apps/cli 不应依赖 ${dep}`).toBe(true);
    }
    // Playwright 仅允许出现在 apps/cli（IMPL-07 §57-58：browser 包无测试依赖）
    expect(allDeps['@playwright/test']).toBeDefined();
  });

  it('apps/reference 为纯静态目录（无 package.json、无运行时依赖）', () => {
    expect(existsSync(join(ROOT, 'apps', 'reference', 'package.json'))).toBe(false);
    expect(existsSync(join(ROOT, 'apps', 'reference', 'index.html'))).toBe(true);
    expect(existsSync(join(ROOT, 'apps', 'reference', 'button.html'))).toBe(true);
  });

  it('@uiq/browser 不依赖 Playwright（仅 apps/cli 允许）', () => {
    const pkgJson = JSON.parse(
      readFileSync(join(ROOT, 'packages', 'browser', 'package.json'), 'utf-8'),
    );
    const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
    expect(allDeps['@playwright/test']).toBeUndefined();
  });

  it('integrations/radix 依赖白名单（core/tokens/theme/browser，ARCH-01 §4.3）', () => {
    const pkgJson = JSON.parse(
      readFileSync(join(ROOT, 'integrations', 'radix', 'package.json'), 'utf-8'),
    );
    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
      ...pkgJson.peerDependencies,
    };
    // React/Radix 不进入 UIQ 依赖：纯 DOM adapter 按渲染后 DOM 约定识别（IMPL-13 §31-33）
    expect(allDeps['react']).toBeUndefined();
    expect(allDeps['@radix-ui/react-dialog']).toBeUndefined();
    const allowed = new Set(['@uiq/core', '@uiq/tokens', '@uiq/theme', '@uiq/browser']);
    const internalDeps = Object.keys(allDeps).filter((dep) => dep.startsWith('@uiq/'));
    expect(internalDeps.length).toBeGreaterThanOrEqual(4);
    for (const dep of internalDeps) {
      expect(allowed.has(dep), `integrations/radix 不应依赖 ${dep}`).toBe(true);
    }
  });

  it('tokens/theme 无禁止依赖（IMPL-09 §64）', () => {
    for (const pkg of ['tokens', 'theme']) {
      const pkgJson = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
      for (const forbidden of ['@uiq/browser', '@uiq/rules', '@uiq/diagnostic']) {
        expect(allDeps[forbidden], `${pkg} 不应依赖 ${forbidden}`).toBeUndefined();
      }
    }
  });

  it('reporting 白名单：core/conformance/regression，禁浏览器/引擎/展示层（ARCH-01 §4.2/§5.6）', () => {
    const pkgJson = JSON.parse(
      readFileSync(join(ROOT, 'packages', 'reporting', 'package.json'), 'utf-8'),
    );
    const allDeps = {
      ...pkgJson.dependencies,
      ...pkgJson.devDependencies,
      ...pkgJson.peerDependencies,
    };
    const internalDeps = Object.keys(allDeps)
      .filter((dep) => dep.startsWith('@uiq/'))
      .sort();
    expect(internalDeps).toEqual(['@uiq/conformance', '@uiq/core', '@uiq/regression']);
    for (const forbidden of [
      '@uiq/browser',
      '@uiq/metrics',
      '@uiq/rules',
      '@uiq/tokens',
      '@uiq/theme',
      'react',
      '@playwright/test',
    ]) {
      expect(allDeps[forbidden], `reporting 不应依赖 ${forbidden}`).toBeUndefined();
    }
  });

  it('conformance/regression 只依赖 core（ARCH-01 §4.2/IMPL-11 §75-76）', () => {
    for (const pkg of ['conformance', 'regression']) {
      const pkgJson = JSON.parse(
        readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf-8'),
      );
      const allDeps = {
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies,
        ...pkgJson.peerDependencies,
      };
      const internalDeps = Object.keys(allDeps).filter((dep) => dep.startsWith('@uiq/'));
      expect(internalDeps, `${pkg} 应只依赖 @uiq/core`).toEqual(['@uiq/core']);
      for (const forbidden of [
        '@uiq/browser',
        '@uiq/metrics',
        '@uiq/rules',
        '@uiq/conformance',
        '@uiq/regression',
        'react',
        '@playwright/test',
      ]) {
        expect(allDeps[forbidden], `${pkg} 不应依赖 ${forbidden}`).toBeUndefined();
      }
    }
  });
});

describe('AC-ARCH-04: TypeScript 配置约束', () => {
  it('所有包继承 tsconfig.base.json', () => {
    const packagesDir = join(ROOT, 'packages');
    const packages = readdirSync(packagesDir).filter((name) =>
      statSync(join(packagesDir, name)).isDirectory(),
    );

    for (const pkg of packages) {
      const content = readFileSync(join(packagesDir, pkg, 'tsconfig.json'), 'utf-8');
      const config = JSON.parse(content) as { extends?: string };
      expect(config.extends).toBeDefined();
      expect(config.extends).toContain('tsconfig.base.json');
    }
  });
});

describe('AC-ARCH-05: 测试结构约束', () => {
  it('tests 目录包含 unit 子目录', () => {
    expect(existsSync(join(ROOT, 'tests', 'unit'))).toBe(true);
  });

  it('vitest.config.ts 排除 browser 测试', () => {
    const content = readFileSync(join(ROOT, 'vitest.config.ts'), 'utf-8');
    expect(content).toContain('tests/browser/**');
  });

  it('playwright.config.ts 存在', () => {
    expect(existsSync(join(ROOT, 'playwright.config.ts'))).toBe(true);
  });
});

// 生产源码也必须满足 ARCH-01 §4.2；包含类型导入、re-export、动态导入和 require。
const SOURCE_DEPS: Readonly<Record<string, readonly string[]>> = {
  core: [],
  color: ['core'],
  geometry: ['core'],
  measurement: ['core'],
  metrics: ['core', 'color', 'geometry', 'measurement'],
  rules: ['core'],
  diagnostic: ['core'],
  tokens: ['core'],
  theme: ['core', 'tokens'],
  browser: ['core', 'measurement', 'color', 'geometry', 'tokens', 'theme'],
  conformance: ['core'],
  regression: ['core'],
  reporting: ['core', 'diagnostic', 'conformance', 'regression'],
};
const NODE_MODULES = new Set(builtinModules.map((name) => name.replace(/^node:/, '')));
const PLATFORM_NAMES = new Set([
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'fetch',
  'Window',
  'Document',
  'HTMLElement',
  'Element',
  'Node',
  'CSSStyleDeclaration',
  'process',
  'Buffer',
  '__dirname',
  '__filename',
  'require',
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith('.ts') ? [path] : [];
  });
}

function importsOf(text: string): string[] {
  const source = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest, true);
  const imports: string[] = [];
  const add = (node: ts.Node | undefined) => {
    imports.push(node && ts.isStringLiteralLike(node) ? node.text : '<非字面量模块引用>');
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) add(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      add(node.moduleReference.expression);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      add(node.argument.literal);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return imports;
}

function importViolation(pkg: string, file: string, specifier: string): string | undefined {
  if (specifier.startsWith('.')) {
    const target = resolve(dirname(file), specifier);
    const within = relative(join(ROOT, 'packages', pkg, 'src'), target);
    if (within === '..' || within.startsWith('../')) return '跨包相对路径';
    if (!['', '.ts', '/index.ts'].some((suffix) => existsSync(target + suffix))) {
      return '本地模块不存在';
    }
    return undefined;
  }
  if (specifier.startsWith('node:') || NODE_MODULES.has(specifier)) return 'Node 依赖';
  if (!specifier.startsWith('@uiq/')) return '未授权外部依赖';
  const parts = specifier.split('/');
  if (parts.length !== 2) return '禁止 deep import';
  const dependency = parts[1]!;
  if (!SOURCE_DEPS[pkg]?.includes(dependency)) return '超出生产依赖白名单';
  const manifest = JSON.parse(readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf8'));
  if (
    !(specifier in (manifest.dependencies ?? {})) &&
    !(specifier in (manifest.peerDependencies ?? {}))
  ) {
    return '源码依赖未在生产 manifest 声明';
  }
  return undefined;
}

function assertAcyclic(graph: ReadonlyMap<string, readonly string[]>): void {
  const done = new Set<string>();
  const visit = (node: string, stack: readonly string[]): void => {
    if (stack.includes(node)) throw new Error(`依赖环：${[...stack, node].join(' → ')}`);
    if (done.has(node)) return;
    for (const next of graph.get(node) ?? []) visit(next, [...stack, node]);
    done.add(node);
  };
  for (const node of graph.keys()) visit(node, []);
}

function platformReferences(text: string): string[] {
  const source = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest, true);
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, noEmit: true };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (file) => (file === 'source.ts' ? source : undefined);
  const checker = ts.createProgram(['source.ts'], options, host).getTypeChecker();
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && PLATFORM_NAMES.has(node.text)) {
      const symbol = ts.isShorthandPropertyAssignment(node.parent)
        ? checker.getShorthandAssignmentValueSymbol(node.parent)
        : checker.getSymbolAtLocation(node);
      if (!symbol?.declarations?.some((declaration) => declaration.getSourceFile() === source)) {
        found.add(node.text);
      }
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'globalThis' &&
      ts.isStringLiteralLike(node.argumentExpression) &&
      PLATFORM_NAMES.has(node.argumentExpression.text)
    )
      found.add(node.argumentExpression.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return [...found];
}

describe('P1-05：生产源码边界与无环验证', () => {
  it('扫描所有生产源码，覆盖类型导入及公开 re-export', () => {
    const graph = new Map<string, string[]>();
    const packages = readdirSync(join(ROOT, 'packages')).sort();
    expect(packages).toEqual(Object.keys(SOURCE_DEPS).sort());
    for (const pkg of packages) {
      const edges = new Set<string>();
      const files = sourceFiles(join(ROOT, 'packages', pkg, 'src'));
      expect(files.length).toBeGreaterThan(0);
      for (const file of files) {
        const text = readFileSync(file, 'utf8');
        for (const specifier of importsOf(text)) {
          expect(
            importViolation(pkg, file, specifier),
            `${relative(ROOT, file)} → ${specifier}`,
          ).toBeUndefined();
          if (specifier.startsWith('@uiq/')) edges.add(specifier.slice(5));
        }
        if (pkg !== 'browser') {
          expect(platformReferences(text), `${relative(ROOT, file)} 使用平台 API`).toEqual([]);
        }
      }
      graph.set(pkg, [...edges]);
    }
    expect(() => assertAcyclic(graph)).not.toThrow();
  });

  it('识别类型、动态、CommonJS 和 re-export 引用，拒绝隐藏的非字面量导入', () => {
    const imports = importsOf(`import type { T } from 'a'; export { T } from 'b';
      type X = import('c').X; import('d'); require('e'); import x = require('f'); import(variable);`);
    expect(imports).toEqual(['a', 'b', 'c', 'd', 'e', 'f', '<非字面量模块引用>']);
  });

  it('白名单拒绝 Node、外部库、deep import、跨包路径和未声明依赖', () => {
    const file = join(ROOT, 'packages/core/src/index.ts');
    for (const specifier of [
      'node:fs',
      'fs/promises',
      'react',
      '@uiq/color',
      '@uiq/core/src/contracts',
      '../../color/src/index',
    ]) {
      expect(importViolation('core', file, specifier)).toBeDefined();
    }
    expect(
      importViolation('color', join(ROOT, 'packages/color/src/index.ts'), '@uiq/core'),
    ).toContain('未在生产');
  });

  it('无环检查器拒绝间接环与自环', () => {
    expect(() =>
      assertAcyclic(
        new Map([
          ['a', ['b']],
          ['b', ['a']],
        ]),
      ),
    ).toThrow('a → b → a');
    expect(() => assertAcyclic(new Map([['a', ['a']]]))).toThrow('a → a');
    expect(() =>
      assertAcyclic(
        new Map([
          ['a', ['b']],
          ['b', []],
        ]),
      ),
    ).not.toThrow();
  });

  it('平台隔离检查识别运行时全局及 DOM 类型', () => {
    expect(platformReferences('const x: HTMLElement = document.body; process.exit();')).toEqual([
      'HTMLElement',
      'document',
      'process',
    ]);
    expect(platformReferences('globalThis["window"];')).toEqual(['window']);
    expect(platformReferences('const label = "document"; // process.exit()')).toEqual([]);
    expect(platformReferences('function validate(document: unknown) { return document; }')).toEqual(
      [],
    );
    expect(
      platformReferences('function f(document: string) { return document; } document.body;'),
    ).toEqual(['document']);
    expect(platformReferences('const value = { document };')).toEqual(['document']);
  });

  it('Core/Color 公共 ESM 与声明入口有真实构建产物', () => {
    for (const pkg of ['core', 'color']) {
      const directory = join(ROOT, 'packages', pkg);
      const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
      for (const entry of ['import', 'types']) {
        const path = manifest.exports['.'][entry] as string;
        expect(path.startsWith('./dist/')).toBe(true);
        expect(readFileSync(join(directory, path), 'utf8').length).toBeGreaterThan(0);
      }
    }
  });
});

describe('AC-ARCH-06: 契约完整性', () => {
  it('contracts.schema.json 存在且为有效 JSON', () => {
    const schemaPath = join(ROOT, 'packages', 'core', 'schemas', 'contracts.schema.json');
    expect(existsSync(schemaPath)).toBe(true);
    const content = readFileSync(schemaPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});
