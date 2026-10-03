import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { ElevationHierarchyValue } from './types';

function collectElevationMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) =>
    (m.type === 'surface.shadow' || m.type === 'surface.layer') && m.status === 'AVAILABLE'
  );
}

/** DEPTH.ELEVATION.HIERARCHY@1.0.0 — 分析 elevation 层次结构。 */
export const DEPTH_ELEVATION_HIERARCHY: MetricDefinition<ElevationHierarchyValue> = {
  id: 'DEPTH.ELEVATION.HIERARCHY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<ElevationHierarchyValue> {
    const measurements = collectElevationMeasurements(ctx);
    if (measurements.length === 0) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const shadowMeasurements = measurements.filter((m) => m.type === 'surface.shadow');
    const layerMeasurements = measurements.filter((m) => m.type === 'surface.layer');
    const zValues = new Set<number>();
    for (const m of layerMeasurements) {
      const v = m.value as { zIndex: number | 'auto' } | null;
      if (v && typeof v.zIndex === 'number') zValues.add(v.zIndex);
    }
    for (const m of shadowMeasurements) {
      const v = m.value as { layerCount: number } | null;
      if (v) zValues.add(v.layerCount);
    }
    const sorted = [...zValues].sort((a, b) => a - b);
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { populationSize: measurements.length, levelCount: sorted.length, hierarchyDepth: sorted.length },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
