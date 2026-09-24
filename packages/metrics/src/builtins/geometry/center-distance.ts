import type { MetricDefinition, MetricCalculationContext, MetricResult } from '@uiq/core';
import { centerDistance } from '@uiq/geometry';
import { findMeasurement } from '../helpers';

export const GEOMETRY_CENTER_DISTANCE: MetricDefinition<number> = {
  id: 'GEOMETRY.CENTER_DISTANCE',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<number> {
    const refMeasurement = findMeasurement(ctx, 'geometry.center-distance.reference');
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
    const ax = findMeasurement(ctx, 'geometry.x');
    const ay = findMeasurement(ctx, 'geometry.y');
    const aw = findMeasurement(ctx, 'geometry.width');
    const ah = findMeasurement(ctx, 'geometry.height');
    const bx = ctx.snapshot.measurements.find(
      (m) => m.subjectId === refId && m.type === 'geometry.x',
    );
    const by = ctx.snapshot.measurements.find(
      (m) => m.subjectId === refId && m.type === 'geometry.y',
    );
    const bw = ctx.snapshot.measurements.find(
      (m) => m.subjectId === refId && m.type === 'geometry.width',
    );
    const bh = ctx.snapshot.measurements.find(
      (m) => m.subjectId === refId && m.type === 'geometry.height',
    );
    if (!ax || !ay || !aw || !ah || !bx || !by || !bw || !bh) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    if ([ax, ay, aw, ah, bx, by, bw, bh].some((m) => m.status !== 'AVAILABLE')) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const dist = centerDistance(
      {
        x: ax.value as number,
        y: ay.value as number,
        width: aw.value as number,
        height: ah.value as number,
      },
      {
        x: bx.value as number,
        y: by.value as number,
        width: bw.value as number,
        height: bh.value as number,
      },
    );
    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: dist,
      unit: 'px',
      dependencies: [],
      fingerprint: '',
    };
  },
};
