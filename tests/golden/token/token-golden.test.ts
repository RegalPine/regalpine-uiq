import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ComponentContract,
  EngineInfo,
  EvaluationResult,
  Finding,
  MeasurementSnapshot,
  MetricResult,
  Theme,
} from '@uiq/core';
import {
  createDefaultMetricRegistry,
  createTokenDeviationMetric,
  createTokenMatchMetric,
  createTokenResolutionMetric,
  MetricExecutionEngine,
  type TokenResolutionPortResult,
} from '@uiq/metrics';
import {
  createComponentConformanceRule,
  createDefaultRuleRegistry,
  createTokenMatchRule,
  EvaluationEngine,
} from '@uiq/rules';
import { DiagnosticEngine } from '@uiq/diagnostic';
import { createTokenResolver, normalizeTokenAsset, type TokenAsset } from '@uiq/tokens';
import { applyTheme, validateTheme, type ThemeValidationResult } from '@uiq/theme';
import { describe, expect, it } from 'vitest';

/**
 * TOKEN-GOLDEN-001~008（IMPL-09 §71，计划 Task 6）。
 * 接线镜像 apps/cli/artifact.ts 的编排（绑定感知 port + 显式注册三指标两规则）；
 * color deviation 期望值由 OKLab 官方常数独立手工推导（Ottosson，非 @uiq/color）。
 */

const here = dirname(fileURLToPath(import.meta.url));
const FIX = resolve(here, '../../fixtures/token');

const engineInfo: EngineInfo = { name: 'token-golden-engine', version: '1.0.0' };
/** 与 CLI 一致的 V1.0 编排投影约定：token 实际值取背景测量。 */
const TOKEN_MEASUREMENT_TYPE = 'color.srgb.background';

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(resolve(FIX, name), 'utf-8')) as unknown;
}

const baseAsset: TokenAsset = normalizeTokenAsset(readJson('asset.json'));
const themeLight = readJson('theme-light.json') as Theme;
const themeDark = readJson('theme-dark.json') as Theme;
const fixtureContract = readJson('component-contract.json') as ComponentContract;
const lightSnapshot = readJson('fixture-snapshot.json') as MeasurementSnapshot;
const darkSnapshot = readJson('fixture-snapshot-dark.json') as MeasurementSnapshot;

export interface TokenRunResult {
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly { readonly findingId: string; readonly cause: string }[];
  readonly summary: { pass: number; fail: number; unknown: number; warn: number };
}

/** 镜像 CLI 编排：绑定感知 port → 三指标两规则显式注册 → 完整分析链。 */
export function runTokenAnalysis(options: {
  snapshot: MeasurementSnapshot;
  asset: TokenAsset;
  theme?: Theme;
  contract?: ComponentContract;
}): TokenRunResult {
  const { snapshot, asset, contract } = options;
  const effectiveTokens =
    options.theme !== undefined ? applyTheme(asset.tokens, options.theme) : [...asset.tokens];
  const resolver = createTokenResolver(effectiveTokens);

  const tokenIdBySubject = new Map<string, string>();
  const subjectIdByToken = new Map<string, string>();
  if (snapshot.bindings !== undefined) {
    for (const binding of snapshot.bindings) {
      if (binding.tokenId === undefined) continue;
      if (!tokenIdBySubject.has(binding.subjectId))
        tokenIdBySubject.set(binding.subjectId, binding.tokenId);
      if (!subjectIdByToken.has(binding.tokenId))
        subjectIdByToken.set(binding.tokenId, binding.subjectId);
    }
  }
  const port = {
    resolve(tokenId: string): TokenResolutionPortResult {
      const result = resolver.resolve(tokenIdBySubject.get(tokenId) ?? tokenId);
      return {
        status: result.status,
        ...(result.resolvedValue !== undefined ? { resolvedValue: result.resolvedValue } : {}),
        ...(result.chain !== undefined ? { chain: result.chain } : {}),
      };
    },
  };

  const subjects = [
    ...new Set([
      ...snapshot.measurements.map((m) => m.subjectId),
      ...(snapshot.bindings ?? []).map((b) => b.subjectId),
      ...(contract !== undefined ? [contract.id] : []),
    ]),
  ].sort();

  const metricRegistry = createDefaultMetricRegistry();
  metricRegistry.register(createTokenResolutionMetric(port));
  metricRegistry.register(
    createTokenMatchMetric({ actualMeasurementType: TOKEN_MEASUREMENT_TYPE }),
  );
  metricRegistry.register(
    createTokenDeviationMetric({ actualMeasurementType: TOKEN_MEASUREMENT_TYPE }),
  );
  const metricEngine = new MetricExecutionEngine({ engine: engineInfo, registry: metricRegistry });
  const metricReport = metricEngine.execute(snapshot, {
    snapshotId: snapshot.id,
    subjects,
    metrics: [
      { id: 'TOKEN.RESOLUTION', version: '1.0.0' },
      { id: 'TOKEN.MATCH', version: '1.0.0' },
      { id: 'TOKEN.DEVIATION', version: '1.0.0' },
    ],
  });

  const ruleRegistry = createDefaultRuleRegistry();
  ruleRegistry.register(createTokenMatchRule());
  const requestedRules: readonly { id: string; version: string }[] = [
    { id: 'TOKEN.TOKEN_MATCH', version: '1.0.0' },
  ];
  if (contract !== undefined) {
    const subjectIdByTokenMap: Record<string, string> = {};
    for (const [tokenId, subjectId] of subjectIdByToken) subjectIdByTokenMap[tokenId] = subjectId;
    ruleRegistry.register(
      createComponentConformanceRule({ contract, subjectIdByToken: subjectIdByTokenMap }),
    );
    (requestedRules as { id: string; version: string }[]).push({
      id: 'TOKEN.COMPONENT_CONFORMANCE',
      version: '1.0.0',
    });
  }
  const ruleEngine = new EvaluationEngine({ engine: engineInfo, ruleRegistry });
  const ruleReport = ruleEngine.evaluate(
    { snapshotId: snapshot.id, subjects, rules: requestedRules },
    metricReport.results,
  );

  const diagnostics = new DiagnosticEngine().diagnose(ruleReport.findings, metricReport.results);
  return {
    metricResults: metricReport.results,
    evaluations: ruleReport.evaluations,
    findings: ruleReport.findings,
    diagnostics: diagnostics.map((d) => ({ findingId: d.findingId, cause: d.cause })),
    summary: ruleReport.summary,
  };
}

function metricOf(
  run: TokenRunResult,
  subjectId: string,
  metricId: string,
): MetricResult | undefined {
  return run.metricResults.find((m) => m.subjectId === subjectId && m.metricId === metricId);
}
function evaluationOf(
  run: TokenRunResult,
  subjectId: string,
  ruleId: string,
): EvaluationResult | undefined {
  return run.evaluations.find((e) => e.subjectId === subjectId && e.ruleId === ruleId);
}

describe('TOKEN-GOLDEN-001: Exact token match（IMPL-09 §71）', () => {
  const run = runTokenAnalysis({
    snapshot: lightSnapshot,
    asset: baseAsset,
    theme: themeLight,
    contract: fixtureContract,
  });

  it('解析链完整（AC-THEME-02）：semantic → primitive', () => {
    const resolution = metricOf(run, 'token.button.exact', 'TOKEN.RESOLUTION');
    expect(resolution?.status).toBe('AVAILABLE');
    expect(resolution?.value).toMatchObject({
      resolvedValue: '#2563eb',
      resolutionChain: ['button.primary.background', 'color.blue.600'],
    });
  });

  it('期望 #2563EB == 实测背景 #2563EB → MATCH → 规则 PASS', () => {
    expect(metricOf(run, 'token.button.exact', 'TOKEN.MATCH')?.value).toEqual({ result: 'MATCH' });
    expect(evaluationOf(run, 'token.button.exact', 'TOKEN.TOKEN_MATCH')?.state).toBe('PASS');
    expect(run.findings.filter((f) => f.subjectId === 'token.button.exact')).toHaveLength(0);
  });

  it('INFERRED 绑定同样可评价（值匹配 ≠ 来源匹配）', () => {
    expect(metricOf(run, 'token.button.inferred', 'TOKEN.RESOLUTION')?.value).toMatchObject({
      resolvedValue: '#2563eb',
      resolutionChain: ['color.action.primary', 'color.blue.600'],
    });
    expect(evaluationOf(run, 'token.button.inferred', 'TOKEN.TOKEN_MATCH')?.state).toBe('PASS');
  });

  it('组件契约（完整供给）→ PASS', () => {
    const cc = evaluationOf(run, fixtureContract.id, 'TOKEN.COMPONENT_CONFORMANCE');
    expect(cc?.state).toBe('PASS');
  });
});

describe('TOKEN-GOLDEN-002: Color token deviation（期望值独立推导）', () => {
  const run = runTokenAnalysis({ snapshot: lightSnapshot, asset: baseAsset, theme: themeLight });

  it('期望 #2563EB vs 实测 #1D4ED8：ΔL/ΔC/ΔH/ΔE 符合 OKLab 手工基准', () => {
    const deviation = metricOf(run, 'token.button.deviation', 'TOKEN.DEVIATION');
    expect(deviation?.status).toBe('AVAILABLE');
    expect(deviation?.metadata).toMatchObject({ method: 'OKLAB_EUCLIDEAN@1.0' });
    const value = deviation?.value as {
      type: string;
      deltaL: number;
      deltaC: number;
      deltaH: number | null;
      deltaE: number;
    };
    expect(value.type).toBe('COLOR');
    // 官方 Ottosson 常数独立推导（OKLCH 色相单位为度）：
    // ΔL = -0.0579514114，ΔC = +0.0019577121，ΔH = +1.4953831°，ΔE = 0.0582583241。
    expect(value.deltaL).toBeCloseTo(-0.0579514114, 4);
    expect(value.deltaC).toBeCloseTo(0.0019577121, 4);
    expect(value.deltaH).toBeCloseTo(1.4953831, 4);
    expect(value.deltaE).toBeCloseTo(0.0582583241, 4);
  });

  it('MATCH = NO_MATCH → 规则 FAIL → Finding(TOKEN_DEVIATION) → Diagnostic(TOKEN)', () => {
    expect(metricOf(run, 'token.button.deviation', 'TOKEN.MATCH')?.value).toEqual({
      result: 'NO_MATCH',
    });
    const evaluation = evaluationOf(run, 'token.button.deviation', 'TOKEN.TOKEN_MATCH');
    expect(evaluation?.state).toBe('FAIL');
    const finding = run.findings.find((f) => f.subjectId === 'token.button.deviation');
    expect(finding).toBeDefined();
    expect(finding?.type).toBe('TOKEN_DEVIATION');
    expect(finding?.severity).toBe('MEDIUM');
    const diagnostic = run.diagnostics.find((d) => d.findingId === finding?.id);
    expect(diagnostic?.cause).toBe('TOKEN');
  });
});

describe('TOKEN-GOLDEN-003: Missing reference', () => {
  const brokenAsset = normalizeTokenAsset(readJson('asset-broken.json'));
  const run = runTokenAnalysis({ snapshot: lightSnapshot, asset: brokenAsset, theme: themeLight });

  it('断裂引用 → TOKEN.RESOLUTION UNKNOWN（不猜测值）', () => {
    const resolution = metricOf(run, 'token.button.exact', 'TOKEN.RESOLUTION');
    expect(resolution?.status).toBe('UNKNOWN');
    expect(resolution?.metadata).toMatchObject({ reason: 'TOKEN_UNRESOLVED' });
    expect(resolution?.value).toBeUndefined();
  });

  it('MATCH UNKNOWN → 规则 UNKNOWN → 不产生 Finding（不伪造结论）', () => {
    expect(metricOf(run, 'token.button.exact', 'TOKEN.MATCH')?.status).toBe('UNKNOWN');
    expect(evaluationOf(run, 'token.button.exact', 'TOKEN.TOKEN_MATCH')?.state).toBe('UNKNOWN');
    expect(run.findings).toHaveLength(0);
  });

  it('Theme Integrity：REFERENCE_BROKEN → FAIL（TK-01 §25）', () => {
    const validation: ThemeValidationResult = validateTheme(brokenAsset.tokens, themeLight);
    expect(validation.integrity).toBe('FAIL');
    expect(
      validation.issues.some(
        (i) => i.code === 'REFERENCE_BROKEN' && i.tokenId === 'button.primary.background',
      ),
    ).toBe(true);
  });
});

describe('TOKEN-GOLDEN-004: Token cycle（完整路径，AC-THEME-01）', () => {
  const cycleAsset = normalizeTokenAsset(readJson('asset-cycle.json'));
  const cycleSnapshot: MeasurementSnapshot = {
    id: 'snap-token-golden-cycle',
    capturedAt: 1700000000000,
    source: { type: 'BROWSER', adapter: '@uiq/browser', version: '1.0.0' },
    measurements: [
      {
        id: 'bm-cycle-1',
        subjectId: 's.a',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        source: { type: 'BROWSER', adapter: '@uiq/browser', version: '1.0.0' },
        status: 'AVAILABLE',
        timestamp: 1700000000000,
      },
    ],
    bindings: [
      {
        subjectId: 's.a',
        tokenId: 'token.a',
        bindingType: 'EXPLICIT',
        source: 'data-uiq-token',
        confidence: 'DIRECT',
      },
    ],
  };
  const run = runTokenAnalysis({ snapshot: cycleSnapshot, asset: cycleAsset });

  it('TOKEN.RESOLUTION ERROR，chain 保留完整环路径 A→B→A', () => {
    const resolution = metricOf(run, 's.a', 'TOKEN.RESOLUTION');
    expect(resolution?.status).toBe('ERROR');
    expect(resolution?.metadata).toMatchObject({
      reason: 'TOKEN_RESOLUTION_PORT_ERROR',
      chain: ['token.a', 'token.b', 'token.a'],
    });
  });

  it('ERROR 不降级为数值结论：MATCH UNKNOWN → 规则 UNKNOWN', () => {
    expect(metricOf(run, 's.a', 'TOKEN.MATCH')?.status).toBe('UNKNOWN');
    expect(evaluationOf(run, 's.a', 'TOKEN.TOKEN_MATCH')?.state).toBe('UNKNOWN');
    expect(run.findings).toHaveLength(0);
  });

  it('Theme Integrity：CYCLE → FAIL 且 path 为完整环', () => {
    const validation = validateTheme(cycleAsset.tokens, themeLight);
    expect(validation.integrity).toBe('FAIL');
    const cycle = validation.issues.find((i) => i.code === 'CYCLE');
    expect(cycle?.path).toEqual(['token.a', 'token.b', 'token.a']);
  });
});

describe('TOKEN-GOLDEN-005: Theme override（AC-THEME-03 独立解析）', () => {
  const withoutTheme = runTokenAnalysis({ snapshot: darkSnapshot, asset: baseAsset });
  const withDark = runTokenAnalysis({ snapshot: darkSnapshot, asset: baseAsset, theme: themeDark });

  it('无主题：card 期望 #ffffff vs 实测 #171717 → NO_MATCH → FAIL', () => {
    expect(metricOf(withoutTheme, 'token.card.surface', 'TOKEN.RESOLUTION')?.value).toMatchObject({
      resolvedValue: '#ffffff',
    });
    expect(metricOf(withoutTheme, 'token.card.surface', 'TOKEN.MATCH')?.value).toEqual({
      result: 'NO_MATCH',
    });
    expect(evaluationOf(withoutTheme, 'token.card.surface', 'TOKEN.TOKEN_MATCH')?.state).toBe(
      'FAIL',
    );
  });

  it('Dark 覆盖 color.surface.base → #171717：同一快照翻转为 MATCH → PASS', () => {
    expect(metricOf(withDark, 'token.card.surface', 'TOKEN.RESOLUTION')?.value).toMatchObject({
      resolvedValue: '#171717',
      resolutionChain: ['card.surface.background', 'color.surface.base'],
    });
    expect(metricOf(withDark, 'token.card.surface', 'TOKEN.MATCH')?.value).toEqual({
      result: 'MATCH',
    });
    expect(evaluationOf(withDark, 'token.card.surface', 'TOKEN.TOKEN_MATCH')?.state).toBe('PASS');
  });

  it('基础资产不被主题覆盖污染（Theme Isolation，IMPL-09 §21）', () => {
    const untouched = baseAsset.tokens.find((t) => t.id === 'color.surface.base');
    expect(untouched?.value).toBe('#ffffff');
  });
});

describe('TOKEN-GOLDEN-006: Component token missing（AC-THEME-07）', () => {
  // 只含 button 绑定的最小快照：contract 第二个 required token 无 subject 承载 → missing。
  const minimalSnapshot: MeasurementSnapshot = {
    ...lightSnapshot,
    id: 'snap-token-golden-006',
    bindings: (lightSnapshot.bindings ?? []).filter((b) => b.subjectId === 'token.button.exact'),
    measurements: lightSnapshot.measurements.filter((m) => m.subjectId === 'token.button.exact'),
  };
  const run = runTokenAnalysis({
    snapshot: minimalSnapshot,
    asset: baseAsset,
    theme: themeLight,
    contract: fixtureContract,
  });

  it('required token 缺失 → FAIL（aggregate: matched=1 / missing=1）', () => {
    const cc = evaluationOf(run, fixtureContract.id, 'TOKEN.COMPONENT_CONFORMANCE');
    expect(cc?.state).toBe('FAIL');
    expect(cc?.metricResult.value).toMatchObject({
      requiredTotal: 2,
      matched: 1,
      noMatch: 0,
      unresolved: 0,
      missing: 1,
      details: [
        { tokenId: 'button.primary.background', subjectId: 'token.button.exact', outcome: 'MATCH' },
        { tokenId: 'card.surface.background', outcome: 'MISSING' },
      ],
    });
  });

  it('个别 token MATCH ≠ 契约满足（IMPL-09 §47 分离）：Finding HIGH + Diagnostic', () => {
    const finding = run.findings.find((f) => f.subjectId === fixtureContract.id);
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('HIGH');
    const diagnostic = run.diagnostics.find((d) => d.findingId === finding?.id);
    expect(diagnostic?.cause).toBe('TOKEN');
  });

  it('完整供给时同一契约 PASS（正向对照）', () => {
    const full = runTokenAnalysis({
      snapshot: lightSnapshot,
      asset: baseAsset,
      theme: themeLight,
      contract: fixtureContract,
    });
    expect(evaluationOf(full, fixtureContract.id, 'TOKEN.COMPONENT_CONFORMANCE')?.state).toBe(
      'PASS',
    );
  });
});

describe('TOKEN-GOLDEN-007: Unresolved binding（AC-THEME-06 不强行推断）', () => {
  const run = runTokenAnalysis({ snapshot: lightSnapshot, asset: baseAsset, theme: themeLight });

  it('UNRESOLVED 绑定无 tokenId：解析 UNKNOWN，不猜测 tokenId', () => {
    const resolution = metricOf(run, 'token.button.orphan-bg', 'TOKEN.RESOLUTION');
    expect(resolution?.status).toBe('UNKNOWN');
    expect(resolution?.value).toBeUndefined();
    const binding = lightSnapshot.bindings?.find((b) => b.subjectId === 'token.button.orphan-bg');
    expect(binding?.tokenId).toBeUndefined();
  });

  it('规则 UNKNOWN（非 FAIL）：无法确认 ≠ 违规', () => {
    expect(evaluationOf(run, 'token.button.orphan-bg', 'TOKEN.TOKEN_MATCH')?.state).toBe('UNKNOWN');
    expect(run.findings.filter((f) => f.subjectId === 'token.button.orphan-bg')).toHaveLength(0);
    expect(run.summary.unknown).toBeGreaterThanOrEqual(1);
  });
});

describe('TOKEN-GOLDEN-008: Multi-theme isolation（AC-THEME-08，TK-01 §36）', () => {
  const light = runTokenAnalysis({ snapshot: lightSnapshot, asset: baseAsset, theme: themeLight });
  const dark = runTokenAnalysis({ snapshot: darkSnapshot, asset: baseAsset, theme: themeDark });

  it('Light：dialog PASS；Dark：同一 subject 因陈旧值 FAIL', () => {
    const lightDialog = evaluationOf(light, 'token.dialog.content', 'TOKEN.TOKEN_MATCH');
    const darkDialog = evaluationOf(dark, 'token.dialog.content', 'TOKEN.TOKEN_MATCH');
    expect(lightDialog?.state).toBe('PASS');
    expect(darkDialog?.state).toBe('FAIL');
    expect(lightDialog?.fingerprint).not.toBe(darkDialog?.fingerprint);
  });

  it('Light PASS 不自动使 Dark PASS（独立汇总）：fail 分布各自独立', () => {
    expect(light.summary.fail).toBe(1); // deviation
    expect(dark.summary.fail).toBe(2); // deviation + dialog 陈旧
    expect(light.summary.pass).toBeGreaterThan(0);
    expect(dark.summary.pass).toBeGreaterThan(0);
  });

  it('两主题各自的解析事实互不污染', () => {
    expect(metricOf(light, 'token.button.exact', 'TOKEN.RESOLUTION')?.value).toMatchObject({
      resolvedValue: '#2563eb',
    });
    expect(metricOf(dark, 'token.button.exact', 'TOKEN.RESOLUTION')?.value).toMatchObject({
      resolvedValue: '#60a5fa',
    });
    // Dark 的 deviation 仍然独立 FAIL（手写偏差与主题无关地持续存在）。
    expect(evaluationOf(dark, 'token.button.deviation', 'TOKEN.TOKEN_MATCH')?.state).toBe('FAIL');
  });
});
