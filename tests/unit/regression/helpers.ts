import type { EvaluationResult, Finding, MetricResult } from '@uiq/core';
import { approveBaseline, type AnalysisSnapshot, type Baseline } from '@uiq/regression';

/** 测试共享工厂：最小合法 core 事实对象（harness 可依赖多包，conformance/regression 生产包不可）。 */

export function makeMetric(overrides?: Partial<MetricResult>): MetricResult {
  return {
    metricId: 'COLOR.CONTRAST',
    metricVersion: '1.0.0',
    subjectId: 'button.primary',
    value: 5.17,
    status: 'AVAILABLE',
    dependencies: [],
    fingerprint: 'fp-metric-default',
    ...overrides,
  };
}

export function makeEvaluation(overrides?: Partial<EvaluationResult>): EvaluationResult {
  return {
    ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    ruleVersion: '1.0.0',
    subjectId: 'button.primary',
    state: 'PASS',
    severity: 'INFO',
    metricResult: makeMetric(),
    evidence: [],
    fingerprint: 'fp-eval-default',
    ...overrides,
  };
}

export function makeFinding(overrides?: Partial<Finding>): Finding {
  const evaluation = overrides?.evaluation ?? makeEvaluation();
  return {
    id: 'finding-default',
    fingerprint: 'fp-finding-default',
    type: 'ACCESSIBILITY',
    state: 'DETECTED',
    severity: 'MEDIUM',
    subjectId: evaluation.subjectId,
    evaluation,
    evidence: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

export interface SnapshotParts {
  readonly snapshotId?: string;
  readonly metrics?: readonly MetricResult[];
  readonly evaluations?: readonly EvaluationResult[];
  readonly findings?: readonly Finding[];
  readonly themeId?: string;
  readonly environment?: AnalysisSnapshot['snapshot']['environment'];
  readonly schemaVersion?: string;
}

export function makeAnalysisSnapshot(parts?: SnapshotParts): AnalysisSnapshot {
  return {
    schemaVersion: parts?.schemaVersion ?? '1.0.0',
    snapshot: {
      id: parts?.snapshotId ?? 'snap-001',
      capturedAt: 1700000000000,
      source: { type: 'STATIC' },
      ...(parts?.environment !== undefined ? { environment: parts.environment } : {}),
      measurements: [],
    },
    metricResults: parts?.metrics ?? [makeMetric()],
    evaluations: parts?.evaluations ?? [makeEvaluation()],
    findings: parts?.findings ?? [],
    engine: {
      metrics: { name: '@uiq/metrics', version: '1.0.0' },
      rules: { name: '@uiq/rules', version: '1.0.0' },
    },
    ...(parts?.themeId !== undefined ? { themeId: parts.themeId } : {}),
  };
}

export function makeBaseline(id: string, snapshot: AnalysisSnapshot): Baseline {
  return approveBaseline(snapshot, { id, approvedAt: '2026-09-24T00:00:00.000Z' });
}
