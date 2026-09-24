import { fingerprint } from '@uiq/core';
import type { MetricResult } from '@uiq/core';

export function metricFingerprint(result: MetricResult): string {
  return fingerprint({
    metricId: result.metricId,
    metricVersion: result.metricVersion,
    subjectId: result.subjectId,
    status: result.status,
    ...(result.value !== undefined ? { value: result.value } : {}),
    ...(result.unit !== undefined ? { unit: result.unit } : {}),
    dependencies: result.dependencies.map((d) => `${d.metricId}@${d.version}`),
  });
}
