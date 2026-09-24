import type { MetricDefinition, MetricCalculationContext, MetricResult } from '@uiq/core';

export const TYPOGRAPHY_SCALE_RATIO: MetricDefinition<number> = {
  id: 'TYPOGRAPHY.SCALE_RATIO',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0', required: true }],
  calculate(ctx: MetricCalculationContext): MetricResult<number> {
    const dep = ctx.dependencies.get('TYPOGRAPHY.FONT_SIZE@1.0.0');
    if (!dep || dep.status !== 'AVAILABLE') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const refId = ctx.snapshot.measurements.find(
      (m) => m.subjectId === ctx.subjectId && m.type === 'typography.scale-ratio.reference',
    );
    if (!refId || refId.status !== 'AVAILABLE' || typeof refId.value !== 'string') {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const refMeasurement = ctx.snapshot.measurements.find(
      (m) =>
        m.subjectId === refId.value &&
        m.type === 'typography.font-size' &&
        m.status === 'AVAILABLE',
    );
    if (!refMeasurement) {
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    const currentSize = dep.value as number;
    const referenceSize = refMeasurement.value as number;
    if (referenceSize === 0 || !Number.isFinite(currentSize) || !Number.isFinite(referenceSize)) {
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
      value: currentSize / referenceSize,
      dependencies: [],
      fingerprint: '',
    };
  },
};
