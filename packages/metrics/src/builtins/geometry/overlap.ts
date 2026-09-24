import type { MetricDefinition, MetricCalculationContext, MetricResult } from '@uiq/core';
import { overlap as calcOverlap } from '@uiq/geometry';
import type { OverlapResult } from '@uiq/geometry';
import { findMeasurement } from '../helpers';

export const GEOMETRY_OVERLAP: MetricDefinition<OverlapResult> = {
  id: 'GEOMETRY.OVERLAP',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<OverlapResult> {
    const refMeasurement = findMeasurement(ctx, 'geometry.overlap.reference');
    if (
      !refMeasurement ||
      refMeasurement.status !== 'AVAILABLE' ||
      typeof refMeasurement.value !== 'string'
    ) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const refId = refMeasurement.value;
    const getRect = (subjectId: string) => {
      const x = ctx.snapshot.measurements.find(
        (m) => m.subjectId === subjectId && m.type === 'geometry.x',
      );
      const y = ctx.snapshot.measurements.find(
        (m) => m.subjectId === subjectId && m.type === 'geometry.y',
      );
      const w = ctx.snapshot.measurements.find(
        (m) => m.subjectId === subjectId && m.type === 'geometry.width',
      );
      const h = ctx.snapshot.measurements.find(
        (m) => m.subjectId === subjectId && m.type === 'geometry.height',
      );
      if (!x || !y || !w || !h || [x, y, w, h].some((m) => m.status !== 'AVAILABLE')) return null;
      return {
        x: x.value as number,
        y: y.value as number,
        width: w.value as number,
        height: h.value as number,
      };
    };
    const a = getRect(ctx.subjectId);
    const b = getRect(refId);
    if (!a || !b) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: calcOverlap(a, b),
      unit: 'px\u00B2',
      dependencies: [],
      fingerprint: '',
    };
  },
};
