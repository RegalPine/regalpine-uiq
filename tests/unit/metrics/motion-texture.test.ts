import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { motionTextureMetrics } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-motion', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('motionTextureMetrics registry', () => {
  it('包含 7 个 Motion Metric', () => {
    expect(motionTextureMetrics).toHaveLength(7);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = motionTextureMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Motion Metrics — AVAILABLE', () => {
  const snap = makeSnapshot([
    { subjectId: 'e1', type: 'motion.transition', value: { hasTransition: true, durations: [200], timingFunctions: ['ease'] } },
    { subjectId: 'e2', type: 'motion.transition', value: { hasTransition: true, durations: [200], timingFunctions: ['ease'] } },
    { subjectId: 'e3', type: 'motion.animation', value: { hasAnimation: true, durations: [300] } },
    { subjectId: 'e1', type: 'state.interaction', value: { cursor: 'pointer', isFocusable: true } },
  ]);

  for (const metric of motionTextureMetrics) {
    it(`${metric.id} 返回 AVAILABLE`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('AVAILABLE');
    });
  }
});

describe('Motion Metrics — UNKNOWN', () => {
  const snap = makeSnapshot([]);

  for (const metric of motionTextureMetrics) {
    it(`${metric.id} 返回 UNKNOWN`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('UNKNOWN');
    });
  }
});
