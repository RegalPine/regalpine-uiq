import { describe, expect, it } from 'vitest';
import type { EngineInfo, MeasurementSnapshot } from '@uiq/core';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';
import { DiagnosticEngine } from '@uiq/diagnostic';

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

function runChain(snapshot: MeasurementSnapshot) {
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
  const ruleReport = ruleEngine.evaluate(
    {
      snapshotId: snapshot.id,
      subjects: ['text'],
      rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
    },
    metricReport.results,
  );

  const diagnosticEngine = new DiagnosticEngine();
  const diagnostics = diagnosticEngine.diagnose(ruleReport.findings, metricReport.results);
  return { ruleReport, diagnostics };
}

describe('DIAGNOSTIC-GOLDEN-001: 对比度 FAIL 诊断', () => {
  it('#777777 对比 FAIL → cause=MEASUREMENT，confidence=DIRECT', () => {
    const { ruleReport, diagnostics } = runChain(
      makeSnapshot({ r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 }, 'golden-diag-777'),
    );

    expect(ruleReport.findings).toHaveLength(1);
    expect(diagnostics).toHaveLength(1);

    const diagnostic = diagnostics[0]!;
    expect(diagnostic.findingId).toBe(ruleReport.findings[0]!.id);
    expect(diagnostic.type).toBe('COLOR');
    expect(diagnostic.cause).toBe('MEASUREMENT');
    expect(diagnostic.confidence).toBe('DIRECT');
    expect(diagnostic.explanation).toContain('Measured COLOR.CONTRAST');
    expect(diagnostic.evidence.length).toBeGreaterThan(0);
  });

  it('#000000 对比 PASS → 无 Finding、无 Diagnostic', () => {
    const { ruleReport, diagnostics } = runChain(
      makeSnapshot({ r: 0, g: 0, b: 0 }, 'golden-diag-000'),
    );

    expect(ruleReport.findings).toHaveLength(0);
    expect(diagnostics).toHaveLength(0);
  });

  it('确定性：相同输入产生相同 Diagnostic', () => {
    const snapshot = makeSnapshot(
      { r: 0x77 / 255, g: 0x77 / 255, b: 0x77 / 255 },
      'golden-diag-det',
    );
    const r1 = runChain(snapshot);
    const r2 = runChain(snapshot);
    expect(r1.diagnostics[0]!.id).toBe(r2.diagnostics[0]!.id);
    expect(r1.diagnostics[0]!.explanation).toBe(r2.diagnostics[0]!.explanation);
  });
});
