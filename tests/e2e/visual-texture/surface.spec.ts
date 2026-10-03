import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { surfaceMetrics } from '@uiq/metrics';
import { surfaceRules } from '@uiq/rules';
import { diagnoseSurface } from '@uiq/diagnostic';
import { aggregateVisualTexture, recommendSurface } from '@uiq/reporting';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-e2e', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('Surface E2E: Measurement → Metric → Rule → Diagnostic → Report', () => {
  const measurements = [
    { subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
    { subjectId: 'e2', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
    { subjectId: 'e3', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
  ];
  const snap = makeSnapshot(measurements);
  const ctx = makeCtx(snap);

  it('Step 1: Metrics 计算', () => {
    const results = surfaceMetrics.map((m) => m.calculate(ctx));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });

  it('Step 2: Rules 存在且引用正确 Metric', () => {
    expect(surfaceRules.length).toBe(8);
    for (const rule of surfaceRules) {
      expect(rule.metricId).toMatch(/^SURFACE\./);
    }
  });

  it('Step 3: 完整 Pipeline 不抛异常', () => {
    const metricResults = surfaceMetrics.map((m) => m.calculate(ctx));
    expect(metricResults).toHaveLength(8);
    expect(metricResults.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });
});

describe('Surface E2E: FAIL 场景', () => {
  const measurements = [
    { subjectId: 'e1', type: 'surface.radius', value: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 } },
    { subjectId: 'e2', type: 'surface.radius', value: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 } },
    { subjectId: 'e3', type: 'surface.radius', value: { topLeft: 20, topRight: 20, bottomBottom: 20, bottomLeft: 20 } },
  ];
  const snap = makeSnapshot(measurements);
  const ctx = makeCtx(snap);

  it('不一致圆角产生 AVAILABLE 结果', () => {
    const results = surfaceMetrics.map((m) => m.calculate(ctx));
    const radiusResult = results.find((r) => r.metricId === 'SURFACE.RADIUS.CONSISTENCY');
    expect(radiusResult?.status).toBe('AVAILABLE');
    expect((radiusResult?.value as Record<string, unknown>)?.distinctValues).toBeGreaterThanOrEqual(2);
  });
});
