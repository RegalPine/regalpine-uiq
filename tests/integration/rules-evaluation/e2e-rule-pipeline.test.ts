import { describe, expect, it } from 'vitest';
import type { EngineInfo, MeasurementSnapshot } from '@uiq/core';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';
import { DiagnosticEngine } from '@uiq/diagnostic';

const engineInfo: EngineInfo = { name: 'e2e-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

/**
 * 三个 subject：
 * - text-pass：黑色文本（对比度 21 → PASS）
 * - text-fail：#777777 文本（对比度 ≈ 4.48 → FAIL）
 * - text-size：字号 10px（< 12 → FAIL）
 */
function makeSnapshot(): MeasurementSnapshot {
  return {
    id: 'e2e-snap',
    capturedAt: 1000,
    source,
    measurements: [
      {
        id: 'm1',
        subjectId: 'text-pass',
        type: 'color.srgb',
        value: { r: 0, g: 0, b: 0, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm2',
        subjectId: 'text-pass',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm3',
        subjectId: 'text-fail',
        type: 'color.srgb',
        value: { r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm4',
        subjectId: 'text-fail',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm5',
        subjectId: 'text-size',
        type: 'typography.font-size',
        value: 10,
        unit: 'px',
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
    ],
  };
}

const METRIC_REQUEST = {
  snapshotId: 'e2e-snap',
  subjects: ['text-fail', 'text-pass', 'text-size'],
  metrics: [
    { id: 'COLOR.CONTRAST', version: '1.0.0' },
    { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
  ],
} as const;

const RULE_REQUEST = {
  snapshotId: 'e2e-snap',
  subjects: ['text-fail', 'text-pass', 'text-size'],
  rules: [
    { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
    { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
  ],
} as const;

function runPipeline() {
  const metricEngine = new MetricExecutionEngine({
    engine: engineInfo,
    registry: createDefaultMetricRegistry(),
  });
  const metricReport = metricEngine.execute(makeSnapshot(), { ...METRIC_REQUEST });

  const ruleEngine = new EvaluationEngine({
    engine: engineInfo,
    ruleRegistry: createDefaultRuleRegistry(),
  });
  const ruleReport = ruleEngine.evaluate({ ...RULE_REQUEST }, metricReport.results);

  const diagnosticEngine = new DiagnosticEngine();
  const diagnostics = diagnosticEngine.diagnose(ruleReport.findings, metricReport.results);

  return { metricReport, ruleReport, diagnostics };
}

describe('E2E: Snapshot → Metric → Rule → Finding → Diagnostic 完整链', () => {
  it('完整管线产出正确的评价/发现/诊断', () => {
    const { metricReport, ruleReport, diagnostics } = runPipeline();

    // Metric 层：CONTRAST×3 + FONT_SIZE×3 + 依赖展开的 SRGB×3 = 9 条；
    // CONTRAST/FONT_SIZE 全部 AVAILABLE（text-size 无颜色测量 → 其 CONTRAST 为 UNKNOWN，由 Rule 层处理）
    expect(metricReport.results).toHaveLength(9);
    const coreResults = metricReport.results.filter(
      (r) => r.metricId === 'COLOR.CONTRAST' || r.metricId === 'TYPOGRAPHY.FONT_SIZE',
    );
    expect(coreResults.filter((r) => r.status === 'AVAILABLE')).toHaveLength(3);
    expect(coreResults.filter((r) => r.status === 'UNKNOWN')).toHaveLength(3);

    // Rule 层：3 subject × 2 rule = 6 条评价
    expect(ruleReport.evaluations).toHaveLength(6);
    expect(ruleReport.summary.total).toBe(6);

    const evalOf = (subjectId: string, ruleId: string) =>
      ruleReport.evaluations.find((e) => e.subjectId === subjectId && e.ruleId === ruleId);

    expect(evalOf('text-pass', 'ACCESSIBILITY.CONTRAST.WCAG_AA')!.state).toBe('PASS');
    expect(evalOf('text-fail', 'ACCESSIBILITY.CONTRAST.WCAG_AA')!.state).toBe('FAIL');
    expect(evalOf('text-pass', 'TYPOGRAPHY.FONT_SIZE.MINIMUM')!.state).toBe('UNKNOWN');
    expect(evalOf('text-fail', 'TYPOGRAPHY.FONT_SIZE.MINIMUM')!.state).toBe('UNKNOWN');
    expect(evalOf('text-size', 'TYPOGRAPHY.FONT_SIZE.MINIMUM')!.state).toBe('FAIL');
    expect(evalOf('text-size', 'ACCESSIBILITY.CONTRAST.WCAG_AA')!.state).toBe('UNKNOWN');

    // Finding 层：仅 2 个 FAIL 生成 Finding；UNKNOWN 不生成
    expect(ruleReport.findings).toHaveLength(2);
    const contrastFinding = ruleReport.findings.find((f) => f.subjectId === 'text-fail');
    const sizeFinding = ruleReport.findings.find((f) => f.subjectId === 'text-size');
    expect(contrastFinding!.type).toBe('COLOR');
    expect(contrastFinding!.severity).toBe('HIGH');
    expect(sizeFinding!.type).toBe('TYPOGRAPHY');
    expect(sizeFinding!.severity).toBe('MEDIUM');

    // Diagnostic 层：每个 Finding 一个诊断
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0]!.cause).toBe('MEASUREMENT');
    expect(diagnostics[0]!.confidence).toBe('DIRECT');
    expect(diagnostics.every((d) => d.explanation.length > 0)).toBe(true);
  });

  it('Summary 统计与六态分布一致', () => {
    const { ruleReport } = runPipeline();
    const { summary } = ruleReport;
    expect(summary.pass).toBe(1);
    expect(summary.fail).toBe(2);
    expect(summary.unknown).toBe(3);
    expect(summary.warn + summary.notApplicable + summary.error).toBe(0);
  });

  it('确定性：两次执行产出相同指纹', () => {
    const r1 = runPipeline();
    const r2 = runPipeline();
    expect(r1.ruleReport.evaluations.map((e) => e.fingerprint)).toEqual(
      r2.ruleReport.evaluations.map((e) => e.fingerprint),
    );
    expect(r1.ruleReport.findings.map((f) => f.id)).toEqual(
      r2.ruleReport.findings.map((f) => f.id),
    );
    expect(r1.diagnostics.map((d) => d.id)).toEqual(r2.diagnostics.map((d) => d.id));
  });
});
