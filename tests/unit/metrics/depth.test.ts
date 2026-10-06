import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import {
  DEPTH_ELEVATION_HIERARCHY,
  DEPTH_SHADOW_DEPTH,
  DEPTH_LAYER_CONSISTENCY,
  DEPTH_VISUAL_SEPARATION,
  DEPTH_OVERLAY_QUALITY,
  DEPTH_SPATIAL_PRIORITY,
  depthMetrics,
} from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(
  measurements: Array<{ subjectId: string; type: string; value: unknown }>,
): MeasurementSnapshot {
  return {
    id: 'snap-depth',
    capturedAt: 1000,
    source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`,
      subjectId: m.subjectId,
      type: m.type,
      value: m.value,
      status: 'AVAILABLE' as const,
      source,
      timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

describe('depthMetrics registry', () => {
  it('包含 6 个 Depth Metric', () => {
    expect(depthMetrics).toHaveLength(6);
  });

  it('所有 Metric 有唯一 ID', () => {
    const ids = depthMetrics.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('DEPTH.ELEVATION.HIERARCHY', () => {
  it('AVAILABLE — 多层级', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } },
      { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 2 } },
      { subjectId: 'e3', type: 'surface.layer', value: { zIndex: 10 } },
    ]);
    const result = DEPTH_ELEVATION_HIERARCHY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value!.levelCount).toBeGreaterThanOrEqual(2);
  });

  it('UNKNOWN — 无测量', () => {
    const snap = makeSnapshot([]);
    const result = DEPTH_ELEVATION_HIERARCHY.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('DEPTH.SHADOW.DEPTH', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } },
      { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 2, layers: [{ blur: 8, spread: 2 }] } },
    ]);
    const result = DEPTH_SHADOW_DEPTH.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });

  it('UNKNOWN — 无测量', () => {
    const snap = makeSnapshot([]);
    const result = DEPTH_SHADOW_DEPTH.calculate(makeCtx(snap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('DEPTH.LAYER.CONSISTENCY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.layer', value: { zIndex: 1 } },
      { subjectId: 'e2', type: 'surface.layer', value: { zIndex: 2 } },
    ]);
    const result = DEPTH_LAYER_CONSISTENCY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('DEPTH.VISUAL.SEPARATION', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } },
      { subjectId: 'e2', type: 'surface.border', value: { width: 1, style: 'solid', topWidth: 1 } },
    ]);
    const result = DEPTH_VISUAL_SEPARATION.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('DEPTH.OVERLAY.QUALITY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.layer', value: { zIndex: 100 } },
      { subjectId: 'e2', type: 'surface.transparency', value: { opacity: 0.5 } },
    ]);
    const result = DEPTH_OVERLAY_QUALITY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});

describe('DEPTH.SPATIAL.PRIORITY', () => {
  it('AVAILABLE', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.layer', value: { zIndex: 10, position: 'absolute' } },
      { subjectId: 'e2', type: 'surface.layer', value: { zIndex: 20, position: 'relative' } },
    ]);
    const result = DEPTH_SPATIAL_PRIORITY.calculate(makeCtx(snap));
    expect(result.status).toBe('AVAILABLE');
  });
});
