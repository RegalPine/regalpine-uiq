import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';
import type { TransparencyMeasurementValue, TransparencyConsistencyValue } from './types';

function collectTransparencyMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.transparency' && m.status === 'AVAILABLE');
}

/**
 * SURFACE.TRANSPARENCY.CONSISTENCY@1.0.0
 *
 * 比较 opacity 一致性。
 */
export const SURFACE_TRANSPARENCY_CONSISTENCY: MetricDefinition<TransparencyConsistencyValue> = {
  id: 'SURFACE.TRANSPARENCY.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<TransparencyConsistencyValue> {
    const measurements = collectTransparencyMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }
    const values = measurements.map((m) => m.value as TransparencyMeasurementValue).filter((v): v is TransparencyMeasurementValue => v != null);
    const opacities = values.map((v) => v.opacity);
    const consistency = analyzeConsistency(opacities);

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        populationSize: values.length,
        distinctOpacities: new Set(opacities).size,
        dominantOpacity: consistency.dominantValue,
        deviationCount: consistency.deviationCount,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
