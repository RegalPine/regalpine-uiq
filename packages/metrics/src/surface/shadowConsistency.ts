import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';
import type { ShadowMeasurementValue, ShadowConsistencyValue } from './types';

function collectShadowMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.shadow' && m.status === 'AVAILABLE');
}

/**
 * SURFACE.SHADOW.CONSISTENCY@1.0.0
 *
 * 比较 shadow 的 blur/layer count 一致性。
 */
export const SURFACE_SHADOW_CONSISTENCY: MetricDefinition<ShadowConsistencyValue> = {
  id: 'SURFACE.SHADOW.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<ShadowConsistencyValue> {
    const measurements = collectShadowMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }
    const values = measurements.map((m) => m.value as ShadowMeasurementValue).filter((v): v is ShadowMeasurementValue => v != null);
    const layerCounts = values.map((v) => v.layerCount);
    const blurs = values.flatMap((v) => v.layers.map((l) => l.blur));
    const layerConsistency = analyzeConsistency(layerCounts);
    const blurConsistency = analyzeConsistency(blurs);

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        populationSize: values.length,
        distinctLayerCounts: new Set(layerCounts).size,
        distinctBlurs: new Set(blurs).size,
        dominantBlur: blurConsistency.dominantValue,
        deviationCount: layerConsistency.deviationCount,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
