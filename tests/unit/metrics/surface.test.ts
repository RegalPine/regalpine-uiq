import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import {
  SURFACE_RADIUS_CONSISTENCY,
  SURFACE_RADIUS_FRAGMENTATION,
  SURFACE_BORDER_CONSISTENCY,
  SURFACE_SHADOW_CONSISTENCY,
  SURFACE_SHADOW_COMPLEXITY,
  SURFACE_LAYER_CONSISTENCY,
  SURFACE_TRANSPARENCY_CONSISTENCY,
  SURFACE_MATERIAL_CONSISTENCY,
  surfaceMetrics,
} from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(
  measurements: Array<{ subjectId: string; type: string; value: unknown; status?: string }>,
): MeasurementSnapshot {
  return {
    id: 'snap-surface',
    capturedAt: 1000,
    source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`,
      subjectId: m.subjectId,
      type: m.type,
      value: m.value,
      status: (m.status ?? 'AVAILABLE') as 'AVAILABLE' | 'UNKNOWN' | 'ERROR',
      source,
      timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

function makeRadiusValue(topLeft: number, topRight?: number, bottomRight?: number, bottomLeft?: number) {
  return { topLeft, topRight: topRight ?? topLeft, bottomRight: bottomRight ?? topLeft, bottomLeft: bottomLeft ?? topLeft };
}

describe('surfaceMetrics registry', () => {
  it('包含 8 个 Surface Metric', () => {
    expect(surfaceMetrics).toHaveLength(8);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = surfaceMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('SURFACE.RADIUS.CONSISTENCY', () => {
  it('AVAILABLE — 一致圆角', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.radius', value: makeRadiusValue(8) },
      { subjectId: 'e2', type: 'surface.radius', value: makeRadiusValue(8) },
      { subjectId: 'e3', type: 'surface.radius', value: makeRadiusValue(8) },
    ]);
    const result = SURFACE_RADIUS_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toMatchObject({ populationSize: 3, distinctValues: 1, dominantValue: 8, deviationCount: 0 });
  });

  it('AVAILABLE — 不一致圆角', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.radius', value: makeRadiusValue(4) },
      { subjectId: 'e2', type: 'surface.radius', value: makeRadiusValue(8) },
      { subjectId: 'e3', type: 'surface.radius', value: makeRadiusValue(12) },
    ]);
    const result = SURFACE_RADIUS_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value!.distinctValues).toBe(3);
    expect(result.value!.deviationCount).toBeGreaterThan(0);
  });

  it('UNKNOWN — 无测量值', () => {
    const snap = makeSnapshot([]);
    const result = SURFACE_RADIUS_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('SURFACE.RADIUS.FRAGMENTATION', () => {
  it('低碎片化 — 2 种值', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.radius', value: makeRadiusValue(8) },
      { subjectId: 'e2', type: 'surface.radius', value: makeRadiusValue(8) },
      { subjectId: 'e3', type: 'surface.radius', value: makeRadiusValue(12) },
    ]);
    const result = SURFACE_RADIUS_FRAGMENTATION.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value!.fragmentationRatio).toBeLessThan(1);
  });

  it('UNKNOWN — 无测量', () => {
    const snap = makeSnapshot([]);
    const result = SURFACE_RADIUS_FRAGMENTATION.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('SURFACE.BORDER.CONSISTENCY', () => {
  it('AVAILABLE — 一致边框', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } },
      { subjectId: 'e2', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } },
    ]);
    const result = SURFACE_BORDER_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });

  it('UNKNOWN — 无测量', () => {
    const snap = makeSnapshot([]);
    const result = SURFACE_BORDER_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('SURFACE.SHADOW.CONSISTENCY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } },
      { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } },
    ]);
    const result = SURFACE_SHADOW_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });

  it('UNKNOWN — 无测量', () => {
    const snap = makeSnapshot([]);
    const result = SURFACE_SHADOW_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('SURFACE.SHADOW.COMPLEXITY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } },
      { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 2, layers: [{ blur: 3, spread: 0 }, { blur: 8, spread: 2 }] } },
    ]);
    const result = SURFACE_SHADOW_COMPLEXITY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('SURFACE.LAYER.CONSISTENCY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.layer', value: { zIndex: 1 } },
      { subjectId: 'e2', type: 'surface.layer', value: { zIndex: 1 } },
    ]);
    const result = SURFACE_LAYER_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('SURFACE.TRANSPARENCY.CONSISTENCY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.transparency', value: { opacity: 1 } },
      { subjectId: 'e2', type: 'surface.transparency', value: { opacity: 0.8 } },
    ]);
    const result = SURFACE_TRANSPARENCY_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('SURFACE.MATERIAL.CONSISTENCY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.material', value: { backgroundType: 'solid' } },
      { subjectId: 'e2', type: 'surface.material', value: { backgroundType: 'solid' } },
    ]);
    const result = SURFACE_MATERIAL_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});
