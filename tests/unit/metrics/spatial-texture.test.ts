import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { spatialTextureMetrics } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-spatial', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('spatialTextureMetrics registry', () => {
  it('包含 7 个 Spatial Metric', () => {
    expect(spatialTextureMetrics).toHaveLength(7);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = spatialTextureMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Spatial Metrics — AVAILABLE', () => {
  const snap = makeSnapshot([
    { subjectId: 'e1', type: 'geometry.width', value: 128 },
    { subjectId: 'e2', type: 'geometry.width', value: 128 },
    { subjectId: 'e3', type: 'geometry.width', value: 128 },
    { subjectId: 'e1', type: 'geometry.height', value: 64 },
    { subjectId: 'e2', type: 'geometry.height', value: 64 },
    { subjectId: 'e3', type: 'geometry.height', value: 64 },
    { subjectId: 'e1', type: 'geometry.x', value: 0 },
    { subjectId: 'e2', type: 'geometry.x', value: 144 },
    { subjectId: 'e3', type: 'geometry.x', value: 288 },
    { subjectId: 'e1', type: 'geometry.area', value: 8192 },
    { subjectId: 'e2', type: 'geometry.area', value: 8192 },
    { subjectId: 'e1', type: 'spacing.gap', value: 16 },
    { subjectId: 'e2', type: 'spacing.gap', value: 16 },
  ]);

  for (const metric of spatialTextureMetrics) {
    it(`${metric.id} 返回 AVAILABLE`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('AVAILABLE');
    });
  }
});

describe('Spatial Metrics — UNKNOWN', () => {
  const snap = makeSnapshot([]);

  for (const metric of spatialTextureMetrics) {
    it(`${metric.id} 返回 UNKNOWN`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('UNKNOWN');
    });
  }
});
