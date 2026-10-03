import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { depthMetrics } from '@uiq/metrics';
import { depthRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return { id: 'snap-e2e', capturedAt: 1000, source, measurements: measurements.map((m, i) => ({ id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) };
}
function makeCtx(snapshot: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot, dependencies: new Map() }; }

describe('Depth E2E', () => {
  it('Pass 场景: 多层级 elevation', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } },
      { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 2 } },
      { subjectId: 'e3', type: 'surface.layer', value: { zIndex: 10 } },
    ]);
    const results = depthMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });

  it('Fail 场景: 无 elevation 数据', () => {
    const snap = makeSnapshot([]);
    const results = depthMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });

  it('Rules 引用有效 Metric', () => {
    for (const rule of depthRules) {
      expect(rule.metricId).toMatch(/^DEPTH\./);
    }
  });
});
