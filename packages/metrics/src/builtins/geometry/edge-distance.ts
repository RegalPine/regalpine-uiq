import type { MetricDefinition, MetricCalculationContext, MetricResult } from '@uiq/core';
import { edgeDistance as calcEdgeDistance } from '@uiq/geometry';
import type { EdgeDistanceResult } from '@uiq/geometry';
import { findMeasurement } from '../helpers';

export const GEOMETRY_EDGE_DISTANCE: MetricDefinition<EdgeDistanceResult> = {
  id: 'GEOMETRY.EDGE_DISTANCE',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<EdgeDistanceResult> {
    const refMeasurement = findMeasurement(ctx, 'geometry.edge-distance.reference');
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
      value: calcEdgeDistance(a, b),
      unit: 'px',
      dependencies: [],
      fingerprint: '',
    };
  },
};
