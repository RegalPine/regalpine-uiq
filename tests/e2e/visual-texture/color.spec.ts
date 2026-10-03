import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { colorTextureMetrics } from '@uiq/metrics';
import { colorTextureRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) };
}
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Color E2E', () => {
  it('Pass: Token 一致色彩', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'color.srgb', value: { r: 0.1, g: 0.45, b: 0.91, alpha: 1 } },
      { subjectId: 'e2', type: 'color.srgb', value: { r: 0.05, g: 0.56, b: 0.31, alpha: 1 } },
    ]);
    const results = colorTextureMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });

  it('Fail: 空测量返回 UNKNOWN', () => {
    const results = colorTextureMetrics.map((m) => m.calculate(makeCtx(makeSnapshot([]))));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });

  it('Rules 引用有效 Metric', () => {
    for (const rule of colorTextureRules) {
      expect(rule.metricId).toMatch(/^COLOR\./);
    }
  });
});
