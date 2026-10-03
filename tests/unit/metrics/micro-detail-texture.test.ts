import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { microDetailTextureMetrics } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot {
  return {
    id: 'snap-micro', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: 'AVAILABLE' as const, source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('microDetailTextureMetrics registry', () => {
  it('包含 16 个 Micro Detail Metric', () => {
    expect(microDetailTextureMetrics).toHaveLength(16);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = microDetailTextureMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ID 使用 MICRO_DETAIL.* 规范前缀', () => {
    for (const m of microDetailTextureMetrics) {
      expect(m.id).toMatch(/^MICRO_DETAIL\./);
    }
  });
});

describe('Micro Detail Metrics — AVAILABLE', () => {
  const snap = makeSnapshot([
    { subjectId: 'e1', type: 'state.interaction', value: { cursor: 'pointer', isFocusable: true, outline: '2px solid blue' } },
    { subjectId: 'e2', type: 'state.interaction', value: { cursor: 'pointer', isFocusable: false, outline: 'none' } },
    { subjectId: 'e1', type: 'state.coverage', value: { requiredStates: ['hover', 'focus', 'disabled'], observedStates: ['hover', 'focus', 'disabled'], coverageRatio: 1.0 } },
    { subjectId: 'e1', type: 'geometry.width', value: 16 },
    { subjectId: 'e2', type: 'geometry.width', value: 16 },
    { subjectId: 'e1', type: 'geometry.height', value: 16 },
    { subjectId: 'e2', type: 'geometry.height', value: 16 },
    { subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } },
    { subjectId: 'e2', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } },
    { subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
    { subjectId: 'e2', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
    { subjectId: 'e1', type: 'motion.state-transition', value: { hasActiveTransition: true, transitionPropertyCount: 2 } },
    { subjectId: 'e1', type: 'geometry.area', value: 4000 },
  ]);

  for (const metric of microDetailTextureMetrics) {
    it(`${metric.id} 返回 AVAILABLE`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('AVAILABLE');
    });
  }
});

describe('Micro Detail Metrics — UNKNOWN', () => {
  const snap = makeSnapshot([]);

  for (const metric of microDetailTextureMetrics) {
    it(`${metric.id} 返回 UNKNOWN`, () => {
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe('UNKNOWN');
    });
  }
});
