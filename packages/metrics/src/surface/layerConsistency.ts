import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { LayerMeasurementValue, LayerConsistencyValue } from './types';

function collectLayerMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.layer' && m.status === 'AVAILABLE');
}

/**
 * SURFACE.LAYER.CONSISTENCY@1.0.0
 *
 * 分析 zIndex/position 分布。
 */
export const SURFACE_LAYER_CONSISTENCY: MetricDefinition<LayerConsistencyValue> = {
  id: 'SURFACE.LAYER.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<LayerConsistencyValue> {
    const measurements = collectLayerMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }
    const values = measurements.map((m) => m.value as LayerMeasurementValue).filter((v): v is LayerMeasurementValue => v != null);
    const numericZIndices = values.filter((v) => typeof v.zIndex === 'number').map((v) => v.zIndex as number);
    const positionDist: Record<string, number> = {};
    for (const v of values) {
      positionDist[v.position] = (positionDist[v.position] ?? 0) + 1;
    }

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        populationSize: values.length,
        distinctZIndices: new Set(numericZIndices).size,
        positionDistribution: positionDist,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
