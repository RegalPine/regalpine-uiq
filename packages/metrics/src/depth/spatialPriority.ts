import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { SpatialPriorityValue } from './types';

/** DEPTH.SPATIAL.PRIORITY@1.0.0 — 空间优先级证据。 */
export const DEPTH_SPATIAL_PRIORITY: MetricDefinition<SpatialPriorityValue> = {
  id: 'DEPTH.SPATIAL.PRIORITY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<SpatialPriorityValue> {
    const layerMeasurements = ctx.snapshot.measurements.filter((m) => m.type === 'surface.layer' && m.status === 'AVAILABLE');
    if (layerMeasurements.length === 0) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const values = layerMeasurements.map((m) => m.value as { zIndex: number | 'auto'; position: string } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const positions = values.map((v) => v.position);
    const distinctPositions = new Set(positions);
    const zValues = values.filter((v) => typeof v.zIndex === 'number').map((v) => v.zIndex as number);
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { populationSize: values.length, priorityLevels: new Set(zValues).size, positionOrder: [...distinctPositions] },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
