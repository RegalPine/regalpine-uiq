import type { MetricDefinition } from '@uiq/core';

export const GEOMETRY_AREA: MetricDefinition<number> = {
  id: 'GEOMETRY.AREA',
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
    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: (width.value as number) * (height.value as number),
      unit: 'px\u00B2',
      dependencies: [],
      fingerprint: '',
    };
  },
};
