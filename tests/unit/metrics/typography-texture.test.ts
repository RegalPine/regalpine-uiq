import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { typographyTextureMetrics } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-typo', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('typographyTextureMetrics registry', () => {
  it('包含 7 个 Typography Metric', () => {
    expect(typographyTextureMetrics).toHaveLength(7);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = typographyTextureMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Typography Metrics — AVAILABLE', () => {
  const snap = makeSnapshot([
    { subjectId: 'e1', type: 'typography.font-size', value: 16 },
    { subjectId: 'e2', type: 'typography.font-size', value: 24 },
    { subjectId: 'e3', type: 'typography.font-size', value: 12 },
    { subjectId: 'e1', type: 'typography.font-weight', value: 400 },
    { subjectId: 'e2', type: 'typography.font-weight', value: 700 },
    { subjectId: 'e1', type: 'typography.line-height', value: 1.5 },
    { subjectId: 'e2', type: 'typography.line-height', value: 1.2 },
    { subjectId: 'e1', type: 'typography.letter-spacing', value: 0.5 },
    { subjectId: 'e2', type: 'typography.letter-spacing', value: 0.5 },
  ]);

  for (const metric of typographyTextureMetrics) {
    it(`${metric.id} 返回 AVAILABLE`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('AVAILABLE');
    });
  }
});

describe('Typography Metrics — UNKNOWN', () => {
  const snap = makeSnapshot([]);

  for (const metric of typographyTextureMetrics) {
    it(`${metric.id} 返回 UNKNOWN`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('UNKNOWN');
    });
  }
});
