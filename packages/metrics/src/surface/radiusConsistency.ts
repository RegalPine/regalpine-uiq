import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';
import type { RadiusMeasurementValue, RadiusConsistencyValue } from './types';

/**
 * 从快照中提取所有 surface.radius 测量。
 */
function collectRadiusMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.radius' && m.status === 'AVAILABLE');
}

/**
 * 提取每个元素的"等效 radius"（四角平均值），用于一致性比较。
 */
function extractRadiusValues(measurements: readonly Measurement[]): number[] {
  return measurements
    .map((m) => m.value as RadiusMeasurementValue | null)
    .filter((v): v is RadiusMeasurementValue => v !== null)
    .map((v) => (v.topLeft + v.topRight + v.bottomRight + v.bottomLeft) / 4);
}

/**
 * SURFACE.RADIUS.CONSISTENCY@1.0.0
 *
 * 计算页面内所有元素的圆角一致性。
 * 输出：populationSize, distinctValues, dominantValue, deviationCount, fragmentationRatio
 *
 * 规范基线：UIQ-VISUAL-QUALITY-11 §3, UIQ-VISUAL-QUALITY-26 §3.1
 */
export const SURFACE_RADIUS_CONSISTENCY: MetricDefinition<RadiusConsistencyValue> = {
  id: 'SURFACE.RADIUS.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<RadiusConsistencyValue> {
    const measurements = collectRadiusMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }

    const values = extractRadiusValues(measurements);
    const consistency = analyzeConsistency(values);
    const fragmentationRatio =
      consistency.populationSize > 0
        ? consistency.distinctValues / consistency.populationSize
        : 0;

    const value: RadiusConsistencyValue = {
      populationSize: consistency.populationSize,
      distinctValues: consistency.distinctValues,
      dominantValue: consistency.dominantValue,
      dominantCount: consistency.dominantCount,
      deviationCount: consistency.deviationCount,
      fragmentationRatio,
    };

    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value,
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, value }),
    };
  },
};
