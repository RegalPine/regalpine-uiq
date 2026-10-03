import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { colorTextureMetrics } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-color', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('colorTextureMetrics registry', () => {
  it('包含 7 个 Color Metric', () => {
    expect(colorTextureMetrics).toHaveLength(7);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = colorTextureMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ID 使用规范命名 COLOR.* 前缀', () => {
    for (const m of colorTextureMetrics) {
      expect(m.id).toMatch(/^COLOR\./);
    }
  });
});

describe('Color Metrics — AVAILABLE', () => {
  const snap = makeSnapshot([
    { subjectId: 'e1', type: 'color.srgb', value: { r: 1, g: 0, b: 0, alpha: 1 } },
    { subjectId: 'e2', type: 'color.srgb', value: { r: 0, g: 0, b: 1, alpha: 1 } },
    { subjectId: 'e3', type: 'color.srgb', value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 } },
    { subjectId: 'e1', type: 'color.srgb.background', value: { r: 1, g: 1, b: 1, alpha: 1 } },
  ]);

  for (const metric of colorTextureMetrics) {
    it(`${metric.id} 返回 AVAILABLE`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('AVAILABLE');
    });
  }
});

describe('Color Metrics — UNKNOWN (no measurements)', () => {
  const snap = makeSnapshot([]);

  for (const metric of colorTextureMetrics) {
    it(`${metric.id} 返回 UNKNOWN`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('UNKNOWN');
    });
  }
});
