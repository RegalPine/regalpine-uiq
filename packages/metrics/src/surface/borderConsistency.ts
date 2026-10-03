import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';
import type { BorderMeasurementValue, BorderConsistencyValue } from './types';

function collectBorderMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.border' && m.status === 'AVAILABLE');
}

/**
 * SURFACE.BORDER.CONSISTENCY@1.0.0
 *
 * 比较 border width/style 的一致性。
 */
export const SURFACE_BORDER_CONSISTENCY: MetricDefinition<BorderConsistencyValue> = {
  id: 'SURFACE.BORDER.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<BorderConsistencyValue> {
    const measurements = collectBorderMeasurements(ctx);
    if (measurements.length === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }
    const values = measurements.map((m) => m.value as BorderMeasurementValue).filter((v): v is BorderMeasurementValue => v != null);
    const widths = values.map((v) => v.topWidth);
    const styles = values.map((v) => v.topStyle);
    const widthConsistency = analyzeConsistency(widths);
    const styleSet = new Set(styles);
    const dominantStyle = styles.length > 0 ? analyzeConsistency(styles.map((_, i) => i)).dominantValue !== undefined ? styles[0] : undefined : undefined;

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        populationSize: values.length,
        distinctWidths: new Set(widths).size,
        distinctStyles: styleSet.size,
        dominantWidth: widthConsistency.dominantValue,
        dominantStyle: styleSet.size > 0 ? [...styleSet][0] : undefined,
        deviationCount: widthConsistency.deviationCount,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
