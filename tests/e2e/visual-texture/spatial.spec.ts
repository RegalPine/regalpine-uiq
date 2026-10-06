import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { spatialTextureMetrics } from '@uiq/metrics';
import { spatialTextureRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Spatial E2E', () => {
  it('Pass: 网格对齐布局', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'geometry.dimensions', value: { width: 128, height: 64, x: 0, y: 0 } },
      { subjectId: 'e2', type: 'geometry.dimensions', value: { width: 128, height: 64, x: 144, y: 0 } },
    ]);
    const results = spatialTextureMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });
  it('Fail: 空测量', () => {
    const results = spatialTextureMetrics.map((m) => m.calculate(makeCtx(makeSnapshot([]))));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });
  it('Rules 引用有效 Metric', () => {
    for (const rule of spatialTextureRules) { expect(rule.metricId).toMatch(/^SPATIAL\./); }
  });
});
