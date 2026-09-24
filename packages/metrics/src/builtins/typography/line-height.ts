import type { MetricDefinition } from '@uiq/core';
import { findMeasurement } from '../helpers';

interface LineHeightValue {
  readonly px: number;
  readonly ratio?: number;
}

export const TYPOGRAPHY_LINE_HEIGHT: MetricDefinition<LineHeightValue> = {
  id: 'TYPOGRAPHY.LINE_HEIGHT',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    const m = findMeasurement(ctx, 'typography.line-height');
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
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'AVAILABLE',
        value: { px: raw },
        dependencies: [],
        fingerprint: '',
      };
    }
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>;
      if (typeof obj.px === 'number' && Number.isFinite(obj.px)) {
        const ratio = typeof obj.ratio === 'number' ? obj.ratio : undefined;
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: { px: obj.px, ...(ratio !== undefined ? { ratio } : {}) },
          dependencies: [],
          fingerprint: '',
        };
      }
    }
    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    };
  },
};
