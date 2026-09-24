import { describe, expect, it } from 'vitest';
import {
  assertLevelExecutable,
  createGoldenRunner,
  resolveLevel,
  toConformanceSummary,
  type GoldenCase,
} from '@uiq/conformance';
import type { MeasurementSnapshot } from '@uiq/core';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { CONFORMANCE_MANIFEST } from '../conformance/manifest';

const ENGINE = { name: 'golden-engine', version: '1.0.0' } as const;
const SOURCE = { type: 'STATIC' } as const;

/** 构造"前景色 on 白背景"的对比度快照（同一 subject 两种测量）。 */
function contrastSnapshot(
  subjectId: string,
  fg: { r: number; g: number; b: number },
): MeasurementSnapshot {
  return {
    id: `golden-contrast-${subjectId}`,
    capturedAt: 1000,
    source: SOURCE,
    measurements: [
      {
        id: `${subjectId}-fg`,
        subjectId,
        type: 'color.srgb',
        value: { ...fg, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1000,
      },
      {
        id: `${subjectId}-bg`,
        subjectId,
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1000,
      },
    ],
  };
}

/** 被测函数注入（conformance 包不 import 被测引擎 —— Golden 执行器函数契约）。 */
function executeContrast(snapshot: MeasurementSnapshot): { ratio: number } {
  const engine = new MetricExecutionEngine({
    engine: ENGINE,
    registry: createDefaultMetricRegistry(),
  });
  const subjects = [...new Set(snapshot.measurements.map((m) => m.subjectId))];
  const report = engine.execute(snapshot, {
    snapshotId: snapshot.id,
    subjects,
    metrics: [{ id: 'COLOR.CONTRAST', version: '1.0.0' }],
  });
  const contrast = report.results.find((r) => r.metricId === 'COLOR.CONTRAST');
  if (contrast === undefined || contrast.value === undefined || contrast.value === null) {
    throw new Error(`COLOR.CONTRAST 未产出数值：status=${contrast?.status ?? 'missing'}`);
  }
  return { ratio: (contrast.value as { ratio: number }).ratio };
}

/** 对象期望：严格 canonicalJson 深比较（无 tolerance）。 */
const OBJECT_CASES: readonly GoldenCase<MeasurementSnapshot, { ratio: number }>[] = [
  {
    id: 'GOLDEN-COLOR-001',
    version: '1.0.0',
    input: contrastSnapshot('fg', { r: 0, g: 0, b: 0 }),
    expected: { ratio: 21 },
    metadata: { note: '黑/白对比度（WCAG 21:1）' },
  },
];

/** 数值期望 + RELATIVE tolerance（tolerance 仅支持数值期望 —— Task 1 语义）。 */
const RATIO_CASES: readonly GoldenCase<MeasurementSnapshot, number>[] = [
  {
    id: 'GOLDEN-COLOR-002',
    version: '1.0.0',
    input: contrastSnapshot('muted', { r: 0.5, g: 0.5, b: 0.5 }),
    expected: 3.98,
    tolerance: { type: 'RELATIVE', value: 0.01 },
    metadata: { note: '中灰/白 ≈ 3.98（1% 相对容差）' },
  },
];

describe('GoldenRunner 驱动 color golden（P6-05 渐进接入样例）', () => {
  it('被测函数注入执行，期望表全 PASS（对象严格比较 + 数值 tolerance 两路径）', () => {
    const runner = createGoldenRunner();
    const objectReport = runner.run(OBJECT_CASES, executeContrast);
    expect(objectReport.total).toBe(1);
    expect(objectReport.passed).toBe(1);

    const ratioRunner = createGoldenRunner();
    const ratioReport = ratioRunner.run(RATIO_CASES, (input) => executeContrast(input).ratio);
    expect(ratioReport.total).toBe(1);
    expect(ratioReport.passed).toBe(1);
    expect(objectReport.cases.map((c) => c.status)).toEqual(['PASS']);
    expect(ratioReport.cases.map((c) => c.status)).toEqual(['PASS']);
  });

  it('纯函数可重复：两次运行报告一致（§11 repeatable）', () => {
    const runner = createGoldenRunner();
    const first = runner.run(OBJECT_CASES, executeContrast);
    const second = runner.run(OBJECT_CASES, executeContrast);
    expect(second).toEqual(first);
    const ratioRunner = createGoldenRunner();
    expect(ratioRunner.run(RATIO_CASES, (input) => executeContrast(input).ratio)).toEqual(
      ratioRunner.run(RATIO_CASES, (input) => executeContrast(input).ratio),
    );
  });

  it('故意 FAIL：expected 未被改写、report 计数正确（§12 FAIL 不自动改写）', () => {
    const runner = createGoldenRunner();
    const brokenCase: GoldenCase<MeasurementSnapshot, { ratio: number }> = {
      id: 'GOLDEN-COLOR-003',
      version: '1.0.0',
      input: contrastSnapshot('fg', { r: 0, g: 0, b: 0 }),
      expected: { ratio: 99 },
    };
    const report = runner.run([brokenCase], executeContrast);
    expect(report.passed).toBe(0);
    expect(report.failed).toBe(1);
    const result = report.cases[0];
    expect(result?.status).toBe('FAIL');
    expect(result?.expected).toEqual({ ratio: 99 });
    expect(result?.actual).toEqual({ ratio: 21 });
  });

  it('execute 抛错 → ERROR（不吞异常）', () => {
    const runner = createGoldenRunner();
    const emptySnapshot: MeasurementSnapshot = {
      id: 'golden-empty',
      capturedAt: 1000,
      source: SOURCE,
      measurements: [],
    };
    const report = runner.run(
      [{ id: 'GOLDEN-COLOR-004', version: '1.0.0', input: emptySnapshot, expected: { ratio: 21 } }],
      executeContrast,
    );
    expect(report.cases[0]?.status).toBe('ERROR');
    expect(report.cases[0]?.message).toContain('未产出数值');
  });
});

describe('清单与等级宣称（P6-05：缺少用例不能报全等级通过）', () => {
  it('STANDARD 级条目（COVERED 六项）可执行；FULL 级因 browser/theme 等 PENDING 不可宣称', () => {
    const standardEntries = resolveLevel(CONFORMANCE_MANIFEST, 'STANDARD');
    expect(standardEntries.every((e) => e.status === 'COVERED')).toBe(true);

    const fullEntries = resolveLevel(CONFORMANCE_MANIFEST, 'FULL');
    const pending = fullEntries.filter((e) => e.status === 'PENDING').map((e) => e.caseId);
    expect(pending).toContain('BROWSER-GOLDEN-CROSS-BROWSER');
    expect(pending).toContain('THEME-GOLDEN-PER-THEME');
    // P7-05：REPORTING-GOLDEN-001 已落地（tests/golden/reporting.test.ts RPT-001~007），从 PENDING 转 COVERED。
    expect(pending).not.toContain('REPORTING-GOLDEN-001');
    expect(CONFORMANCE_MANIFEST.find((e) => e.caseId === 'REPORTING-GOLDEN-001')?.status).toBe(
      'COVERED',
    );
  });

  it('assertLevelExecutable：全 PASS 报告下 FULL 仍不可宣称（PENDING 阻断）', () => {
    const runner = createGoldenRunner();
    const report = runner.run(OBJECT_CASES, executeContrast);
    const standard = assertLevelExecutable(resolveLevel(CONFORMANCE_MANIFEST, 'STANDARD'), report);
    expect(standard.executable).toBe(true);

    const full = assertLevelExecutable(resolveLevel(CONFORMANCE_MANIFEST, 'FULL'), report);
    expect(full.executable).toBe(false);
    expect(full.pendingCases.length).toBeGreaterThan(0);
    expect(full.message).toContain('不可宣称');
  });

  it('toConformanceSummary 输出 §67 JSON 形状', () => {
    const runner = createGoldenRunner();
    const report = runner.run(OBJECT_CASES, executeContrast);
    const summary = toConformanceSummary(report, { level: 'STANDARD', engine: ENGINE });
    expect(summary).toEqual({
      level: 'STANDARD',
      total: 1,
      passed: 1,
      failed: 0,
      unknown: 0,
      errors: 0,
      engine: { name: 'golden-engine', version: '1.0.0' },
    });
  });
});
