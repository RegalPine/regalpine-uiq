import { describe, expect, it } from 'vitest';
import type { EngineInfo, MeasurementSnapshot, MetricResult } from '@uiq/core';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';

const engineInfo: EngineInfo = { name: 'golden-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

function makeSnapshot(fg: { r: number; g: number; b: number }, id: string): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1000,
    source,
    measurements: [
      {
        id: 'm1',
        subjectId: 'text',
        type: 'color.srgb',
        value: { ...fg, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm2',
        subjectId: 'text',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
    ],
  };
}

function evaluateContrast(snapshot: MeasurementSnapshot): {
  metricResults: readonly MetricResult[];
  report: ReturnType<EvaluationEngine['evaluate']>;
} {
  const metricEngine = new MetricExecutionEngine({
    engine: engineInfo,
    registry: createDefaultMetricRegistry(),
  });
  const metricReport = metricEngine.execute(snapshot, {
    snapshotId: snapshot.id,
    subjects: ['text'],
    metrics: [{ id: 'COLOR.CONTRAST', version: '1.0.0' }],
  });

  const ruleEngine = new EvaluationEngine({
    engine: engineInfo,
    ruleRegistry: createDefaultRuleRegistry(),
  });
  const report = ruleEngine.evaluate(
    {
      snapshotId: snapshot.id,
      subjects: ['text'],
      rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
    },
    metricReport.results,
  );
  return { metricResults: metricReport.results, report };
}

describe('RULE-GOLDEN-001: WCAG AA 对比度评价', () => {
  it('#777777 vs #FFFFFF ≈ 4.48 → FAIL（ER-01 §56）', () => {
    const { metricResults, report } = evaluateContrast(
      makeSnapshot({ r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 }, 'golden-777'),
    );

    const contrast = metricResults.find((r) => r.metricId === 'COLOR.CONTRAST');
    expect(contrast).toBeDefined();
    expect(contrast!.status).toBe('AVAILABLE');
    const ratio = (contrast!.value as { ratio: number }).ratio;
    expect(ratio).toBeCloseTo(4.48, 1);

    expect(report.evaluations).toHaveLength(1);
    expect(report.evaluations[0]!.state).toBe('FAIL');
    expect(report.summary.fail).toBe(1);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]!.severity).toBe('HIGH');
  });

  it('#000000 vs #FFFFFF = 21 → PASS', () => {
    const { metricResults, report } = evaluateContrast(
      makeSnapshot({ r: 0, g: 0, b: 0 }, 'golden-000'),
    );

    const contrast = metricResults.find((r) => r.metricId === 'COLOR.CONTRAST');
    expect((contrast!.value as { ratio: number }).ratio).toBe(21);

    expect(report.evaluations[0]!.state).toBe('PASS');
    expect(report.summary.pass).toBe(1);
    expect(report.findings).toHaveLength(0);
  });

  it('确定性：相同输入产生相同输出', () => {
    const snapshot = makeSnapshot(
      { r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 },
      'golden-determinism',
    );
    const r1 = evaluateContrast(snapshot);
    const r2 = evaluateContrast(snapshot);
    expect(r1.report.evaluations[0]!.fingerprint).toBe(r2.report.evaluations[0]!.fingerprint);
    expect(r1.report.evaluations[0]!.state).toBe(r2.report.evaluations[0]!.state);
    expect(r1.report.findings[0]?.id).toBe(r2.report.findings[0]?.id);
  });
});
