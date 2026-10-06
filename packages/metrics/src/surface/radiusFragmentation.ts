import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { RadiusMeasurementValue, RadiusFragmentationValue } from './types';

/**
 * 从快照中提取所有 surface.radius 测量。
 */
function collectRadiusMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.radius' && m.status === 'AVAILABLE');
}

/**
 * 提取每个元素的等效 radius。
 */
function extractRadiusValues(measurements: readonly Measurement[]): number[] {
  return measurements
    .map((m) => m.value as RadiusMeasurementValue | null)
    .filter((v): v is RadiusMeasurementValue => v !== null)
    .map((v) => (v.topLeft + v.topRight + v.bottomRight + v.bottomLeft) / 4);
}

/**
 * SURFACE.RADIUS.FRAGMENTATION@1.0.0
 *
 * 计算圆角碎片化程度 = distinctValues / relevantElements。
 * 纯事实度量，不判断好坏。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-11 §3.2
 */
export const SURFACE_RADIUS_FRAGMENTATION: MetricDefinition<RadiusFragmentationValue> = {
  id: 'SURFACE.RADIUS.FRAGMENTATION',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<RadiusFragmentationValue> {
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
    const distinctValues = new Set(values).size;
    const relevantElements = values.length;
    const fragmentationRatio = relevantElements > 0 ? distinctValues / relevantElements : 0;

    const value: RadiusFragmentationValue = {
      relevantElements,
      distinctValues,
      fragmentationRatio,
      values,
    };

    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value,
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, value: { relevantElements, distinctValues, fragmentationRatio } }),
    };
  },
};
