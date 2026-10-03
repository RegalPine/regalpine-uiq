import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { ShadowMeasurementValue, ShadowComplexityValue } from './types';

function collectShadowMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.shadow' && m.status === 'AVAILABLE');
}

/**
 * SURFACE.SHADOW.COMPLEXITY@1.0.0
 *
 * 统计 shadow 复杂度（纯事实，不判断好坏）。
 */
export const SURFACE_SHADOW_COMPLEXITY: MetricDefinition<ShadowComplexityValue> = {
  id: 'SURFACE.SHADOW.COMPLEXITY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<ShadowComplexityValue> {
    const measurements = collectShadowMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }
    const values = measurements.map((m) => m.value as ShadowMeasurementValue).filter((v): v is ShadowMeasurementValue => v != null);
    const totalShadows = values.length;
    const totalLayers = values.reduce((sum, v) => sum + v.layerCount, 0);
    const allBlurs = values.flatMap((v) => v.layers.map((l) => l.blur));
    const allSpreads = values.flatMap((v) => v.layers.map((l) => l.spread));
    const maxLayerCount = values.reduce((max, v) => Math.max(max, v.layerCount), 0);

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        totalShadows,
        totalLayers,
        distinctBlurs: new Set(allBlurs).size,
        distinctSpreads: new Set(allSpreads).size,
        maxLayerCount,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
