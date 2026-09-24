import type { MetricDefinition } from '@uiq/core';

export const GEOMETRY_ASPECT_RATIO: MetricDefinition<number> = {
  id: 'GEOMETRY.ASPECT_RATIO',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [
    { metricId: 'GEOMETRY.WIDTH', version: '1.0.0', required: true },
    { metricId: 'GEOMETRY.HEIGHT', version: '1.0.0', required: true },
  ],
  calculate(ctx) {
    const width = ctx.dependencies.get('GEOMETRY.WIDTH@1.0.0');
    const height = ctx.dependencies.get('GEOMETRY.HEIGHT@1.0.0');
    if (!width || width.status !== 'AVAILABLE' || !height || height.status !== 'AVAILABLE') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const h = height.value as number;
    if (h === 0) {
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
      value: (width.value as number) / h,
      dependencies: [],
      fingerprint: '',
    };
  },
};
