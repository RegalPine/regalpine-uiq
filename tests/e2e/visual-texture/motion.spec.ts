import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { motionTextureMetrics } from '@uiq/metrics';
import { motionTextureRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Motion E2E', () => {
  it('Pass: 统一 transition', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } },
      { subjectId: 'e2', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } },
    ]);
    const results = motionTextureMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });
  it('Fail: 空测量', () => {
    const results = motionTextureMetrics.map((m) => m.calculate(makeCtx(makeSnapshot([]))));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });
  it('Rules 引用有效 Metric', () => {
    for (const rule of motionTextureRules) { expect(rule.metricId).toMatch(/^MOTION\./); }
  });
});
