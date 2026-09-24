import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';
import { jsonEquals } from '../internal/json-equality';
import { metricKey } from './identity';

/** UIQ-IMPL-11 §53：Metric Diff。before/after 为指标 value；delta = after − before（仅双侧数值）。 */
export interface MetricDiff {
  readonly metricId: string;
  readonly metricVersion: string;
  readonly subjectId: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly changed: boolean;
  readonly delta?: number;
}

function valueChanged(a: unknown, b: unknown): boolean {
  // 均缺失不算变化，单侧缺失算变化（canonicalJson 不接受 undefined，由 jsonEquals 统一处理）。
  return !jsonEquals(a, b);
}

export function diffMetrics(baseline: Baseline, current: AnalysisSnapshot): MetricDiff[] {
  const baselineByKey = new Map(baseline.metrics.map((m) => [metricKey(m), m] as const));
  const currentByKey = new Map(current.metricResults.map((m) => [metricKey(m), m] as const));
  const keys = [...new Set([...baselineByKey.keys(), ...currentByKey.keys()])].sort();
  const diffs: MetricDiff[] = [];
  for (const key of keys) {
    const before = baselineByKey.get(key);
    const after = currentByKey.get(key);
    const identity = before ?? after;
    if (identity === undefined) continue;
    const beforeValue = before?.value;
    const afterValue = after?.value;
    // delta 是变化量：仅在确有变化且双侧数值时输出（值不变不产生 delta: 0 噪音字段）。
    const changed = valueChanged(beforeValue, afterValue);
    const delta =
      changed && typeof beforeValue === 'number' && typeof afterValue === 'number'
        ? afterValue - beforeValue
        : undefined;
    diffs.push({
      metricId: identity.metricId,
      metricVersion: identity.metricVersion,
      subjectId: identity.subjectId,
      ...(beforeValue !== undefined ? { before: beforeValue } : {}),
      ...(afterValue !== undefined ? { after: afterValue } : {}),
      changed,
      ...(delta !== undefined ? { delta } : {}),
    });
  }
  return diffs;
}
