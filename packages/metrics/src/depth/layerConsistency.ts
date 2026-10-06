import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { DepthLayerConsistencyValue } from './types';

function collectLayerMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.layer' && m.status === 'AVAILABLE');
}

/** DEPTH.LAYER.CONSISTENCY@1.0.0 — 层关系一致性。 */
export const DEPTH_LAYER_CONSISTENCY: MetricDefinition<DepthLayerConsistencyValue> = {
  id: 'DEPTH.LAYER.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<DepthLayerConsistencyValue> {
    const measurements = collectLayerMeasurements(ctx);
    if (measurements.length === 0) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const values = measurements.map((m) => m.value as { zIndex: number | 'auto'; position: string } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const dist: Record<string, number> = {};
    for (const v of values) {
      const key = `${v.position}:${v.zIndex}`;
      dist[key] = (dist[key] ?? 0) + 1;
    }
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { populationSize: values.length, distinctLayers: Object.keys(dist).length, layerDistribution: dist },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
