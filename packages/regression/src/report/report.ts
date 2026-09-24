import { fingerprint, type EngineInfo } from '@uiq/core';
import type { RegressionCategory } from '../diff/categories';
import type { EvaluationDiff } from '../diff/evaluation-diff';
import type { FindingDiff } from '../diff/finding-diff';
import type { MetricDiff } from '../diff/metric-diff';
import type { MissingTarget } from '../diff/missing-targets';
import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';

/** UIQ-IMPL-11 §59：六类计数。 */
export interface RegressionSummary {
  readonly newFailures: number;
  readonly fixedFailures: number;
  readonly persistingFailures: number;
  readonly changedResults: number;
  readonly newUnknowns: number;
  readonly resolvedUnknowns: number;
}

export type RegressionRecordKind = 'METRIC' | 'RULE' | 'FINDING';

/** UIQ-IMPL-11 §57：保留 baselineSnapshotId/currentSnapshotId/subjectId/identity/category。 */
export interface RegressionRecord {
  readonly baselineSnapshotId: string;
  readonly currentSnapshotId: string;
  readonly subjectId: string;
  readonly kind: RegressionRecordKind;
  readonly identity: string;
  /** FINDING 与无分类记录为 null（ADDED/REMOVED 与 WARN/NA/ERROR 转换不归六类）。 */
  readonly category: RegressionCategory | null;
  readonly note?: string;
  readonly before?: unknown;
  readonly after?: unknown;
}

/** UIQ-IMPL-11 §58：RegressionReport。fingerprint 为报告事实的 SHA-256（§71-72 可重复性）。 */
export interface RegressionReport {
  readonly baselineId: string;
  readonly currentSnapshotId: string;
  readonly metricChanges: readonly MetricDiff[];
  readonly evaluationChanges: readonly EvaluationDiff[];
  readonly findingChanges: readonly FindingDiff[];
  readonly missingTargets: readonly MissingTarget[];
  readonly summary: RegressionSummary;
  readonly records: readonly RegressionRecord[];
  readonly fingerprint: string;
  readonly engine?: EngineInfo;
}

export function summarize(evaluationChanges: readonly EvaluationDiff[]): RegressionSummary {
  const summary = {
    newFailures: 0,
    fixedFailures: 0,
    persistingFailures: 0,
    changedResults: 0,
    newUnknowns: 0,
    resolvedUnknowns: 0,
  };
  for (const diff of evaluationChanges) {
    if (diff.category === undefined) continue;
    summary[COUNT_KEY[diff.category]] += 1;
  }
  return summary;
}

const COUNT_KEY: Readonly<Record<RegressionCategory, keyof RegressionSummary>> = {
  NEW_FAILURE: 'newFailures',
  FIXED_FAILURE: 'fixedFailures',
  PERSISTING_FAILURE: 'persistingFailures',
  CHANGED_RESULT: 'changedResults',
  NEW_UNKNOWN: 'newUnknowns',
  RESOLVED_UNKNOWN: 'resolvedUnknowns',
};

export interface BuildRegressionReportInput {
  readonly baseline: Baseline;
  readonly current: AnalysisSnapshot;
  readonly metricChanges: readonly MetricDiff[];
  readonly evaluationChanges: readonly EvaluationDiff[];
  readonly findingChanges: readonly FindingDiff[];
  readonly missingTargets: readonly MissingTarget[];
}

/**
 * 组装报告：records 收录确有变化的事实（METRIC changed / RULE 已分类 / FINDING
 * ADDED|REMOVED|contentChanged），组内沿用 diff 的 key 排序，拼接顺序确定，
 * 同输入两次构建得到相同 fingerprint（§71-72 可重复性，纯函数无系统时间）。
 */
export function buildRegressionReport(input: BuildRegressionReportInput): RegressionReport {
  const { baseline, current, metricChanges, evaluationChanges, findingChanges, missingTargets } =
    input;
  const baselineSnapshotId = baseline.snapshot.id;
  const currentSnapshotId = current.snapshot.id;
  const records: RegressionRecord[] = [];
  for (const diff of metricChanges) {
    if (!diff.changed) continue;
    records.push({
      baselineSnapshotId,
      currentSnapshotId,
      subjectId: diff.subjectId,
      kind: 'METRIC',
      identity: `${diff.metricId}@${diff.metricVersion}|${diff.subjectId}`,
      category: null,
      ...(diff.before !== undefined ? { before: diff.before } : {}),
      ...(diff.after !== undefined ? { after: diff.after } : {}),
    });
  }
  for (const diff of evaluationChanges) {
    if (diff.category === undefined) continue;
    records.push({
      baselineSnapshotId,
      currentSnapshotId,
      subjectId: diff.subjectId,
      kind: 'RULE',
      identity: `${diff.ruleId}@${diff.ruleVersion}|${diff.subjectId}`,
      category: diff.category,
      ...(diff.note !== undefined ? { note: diff.note } : {}),
      ...(diff.before !== undefined ? { before: diff.before } : {}),
      ...(diff.after !== undefined ? { after: diff.after } : {}),
    });
  }
  for (const diff of findingChanges) {
    const relevant = diff.status !== 'MATCHED' || diff.contentChanged;
    if (!relevant) continue;
    const subject = diff.before?.subjectId ?? diff.after?.subjectId;
    if (subject === undefined) continue;
    records.push({
      baselineSnapshotId,
      currentSnapshotId,
      subjectId: subject,
      kind: 'FINDING',
      identity: diff.logicKey,
      category: null,
      ...(diff.before !== undefined ? { before: diff.before } : {}),
      ...(diff.after !== undefined ? { after: diff.after } : {}),
    });
  }
  const summary = summarize(evaluationChanges);
  const engine = baseline.engine;
  const reportFingerprint = fingerprintOf({
    baselineId: baseline.id,
    currentSnapshotId,
    metricChanges,
    evaluationChanges,
    findingChanges,
    missingTargets,
    summary,
    records,
    engine,
  });
  return {
    baselineId: baseline.id,
    currentSnapshotId,
    metricChanges,
    evaluationChanges,
    findingChanges,
    missingTargets,
    summary,
    records,
    fingerprint: reportFingerprint,
    engine,
  };
}

/** fingerprint 覆盖报告全部事实字段（不含 fingerprint 自身）。 */
function fingerprintOf(facts: Omit<RegressionReport, 'fingerprint'>): string {
  return fingerprint(facts);
}
