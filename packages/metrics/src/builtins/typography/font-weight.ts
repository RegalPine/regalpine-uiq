import type { MetricDefinition } from '@uiq/core';
import { findMeasurement } from '../helpers';

export const TYPOGRAPHY_FONT_WEIGHT: MetricDefinition<number> = {
  id: 'TYPOGRAPHY.FONT_WEIGHT',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    const m = findMeasurement(ctx, 'typography.font-weight');
    if (!m || m.status !== 'AVAILABLE') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const raw = m.value;
    let weight: number;
    if (typeof raw === 'string') {
      if (raw === 'normal') weight = 400;
      else if (raw === 'bold') weight = 700;
      else {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        weight = parsed;
      }
    } else if (typeof raw === 'number' && Number.isFinite(raw)) {
      weight = raw;
    } else {
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
      value: weight,
      dependencies: [],
      fingerprint: '',
    };
  },
};
