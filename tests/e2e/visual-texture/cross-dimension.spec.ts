import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot, Finding, Diagnostic } from '@uiq/core';
import { surfaceMetrics, depthMetrics } from '@uiq/metrics';
import { detectCrossDimensionRelations } from '@uiq/reporting';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Cross-Dimension E2E', () => {
  it('Surface + Depth 同时计算', () => {
    const surfSnap = makeSnapshot([{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }]);
    const depthSnap = makeSnapshot([{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } }]);
    const surfResults = surfaceMetrics.map((m) => m.calculate(makeCtx(surfSnap)));
    const depthResults = depthMetrics.map((m) => m.calculate(makeCtx(depthSnap)));
    expect(surfResults.every((r) => r.status === 'AVAILABLE')).toBe(true);
    expect(depthResults.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });

  it('跨维度关系检测', () => {
    const relations = detectCrossDimensionRelations([], []);
    expect(relations).toHaveLength(0);
  });
});
