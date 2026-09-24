import type { MetricDefinition, MetricCalculationContext, MetricResult } from '@uiq/core';
import type { SRGB } from '@uiq/color';
import { contrastRatio } from '@uiq/color';
import { findMeasurement } from '../helpers';

interface ContrastValue {
  readonly ratio: number;
}

export const COLOR_CONTRAST: MetricDefinition<ContrastValue> = {
  id: 'COLOR.CONTRAST',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.SRGB', version: '1.0.0', required: true }],
  calculate(ctx: MetricCalculationContext): MetricResult<ContrastValue> {
    const fgMeasurement = findMeasurement(ctx, 'color.srgb');
    const bgMeasurement = findMeasurement(ctx, 'color.srgb.background');
    if (!fgMeasurement || fgMeasurement.status !== 'AVAILABLE') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    if (!bgMeasurement || bgMeasurement.status !== 'AVAILABLE') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    try {
      const fg = fgMeasurement.value as SRGB;
      const bg = bgMeasurement.value as SRGB;
      const ratio = contrastRatio(fg, bg);
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'AVAILABLE',
        value: { ratio },
        dependencies: [],
        fingerprint: '',
      };
    } catch {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
  },
};
