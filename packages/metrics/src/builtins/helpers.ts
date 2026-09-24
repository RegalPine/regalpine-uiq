import type { MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';

export function findMeasurement(
  ctx: MetricCalculationContext,
  type: string,
): Measurement | undefined {
  return ctx.snapshot.measurements.find((m) => m.subjectId === ctx.subjectId && m.type === type);
}

export function baseResult<T>(
  ctx: MetricCalculationContext,
  metricId: string,
  version: string,
  measurementType: string,
  unit?: string,
): MetricResult<T> {
  const measurement = findMeasurement(ctx, measurementType);
  if (!measurement || measurement.status !== 'AVAILABLE') {
    return {
      metricId,
      metricVersion: version,
      subjectId: ctx.subjectId,
      status: 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    };
  }
  return {
    metricId,
    metricVersion: version,
    subjectId: ctx.subjectId,
    status: 'AVAILABLE',
    value: measurement.value as T,
    dependencies: [],
    fingerprint: '',
    ...(unit !== undefined ? { unit } : {}),
  };
}

export function depResult<T>(
  ctx: MetricCalculationContext,
  metricId: string,
  version: string,
  depKey: string,
  required: boolean,
  compute: (depValue: unknown) => { value: T; unit?: string } | null,
): MetricResult<T> {
  const dep = ctx.dependencies.get(depKey);
  if (!dep) {
    if (required) {
      return {
        metricId,
        metricVersion: version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      };
    }
    return {
      metricId,
      metricVersion: version,
      subjectId: ctx.subjectId,
      status: 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    };
  }
  if (dep.status !== 'AVAILABLE') {
    return {
      metricId,
      metricVersion: version,
      subjectId: ctx.subjectId,
      status: dep.status === 'ERROR' ? 'UNKNOWN' : 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    };
  }
  const result = compute(dep.value);
  if (result === null) {
    return {
      metricId,
      metricVersion: version,
      subjectId: ctx.subjectId,
      status: 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    };
  }
  return {
    metricId,
    metricVersion: version,
    subjectId: ctx.subjectId,
    status: 'AVAILABLE',
    value: result.value,
    dependencies: [],
    fingerprint: '',
    ...(result.unit !== undefined ? { unit: result.unit } : {}),
  };
}
