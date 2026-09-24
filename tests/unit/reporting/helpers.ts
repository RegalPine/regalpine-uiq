import type {
  Diagnostic,
  EvaluationResult,
  Finding,
  Measurement,
  MetricResult,
  MeasurementSnapshot,
} from '@uiq/core';
import type { ReportFacts } from '@uiq/reporting';

/** 测试共享工厂：最小合法 core 事实对象（harness 可依赖多包，reporting 生产包不可）。 */

export function makeMeasurement(subjectId: string, overrides?: Partial<Measurement>): Measurement {
  return {
    id: `meas-${subjectId}`,
    subjectId,
    type: 'COLOR.FG',
    value: { r: 0.5, g: 0.5, b: 0.5 },
    source: { type: 'STATIC' },
    status: 'AVAILABLE',
    timestamp: 1700000000000,
    ...overrides,
  };
}

export function makeSnapshot(subjectIds: readonly string[], id = 'snap-001'): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1700000000000,
    source: { type: 'STATIC' },
    measurements: subjectIds.map((s) => makeMeasurement(s)),
  };
}

export function makeMetric(overrides?: Partial<MetricResult>): MetricResult {
  return {
    metricId: 'COLOR.CONTRAST',
    metricVersion: '1.0.0',
    subjectId: 'button.primary',
    value: { ratio: 5.17 },
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

export function makeDiagnostic(overrides?: Partial<Diagnostic>): Diagnostic {
  return {
    id: 'diag-default',
    findingId: 'finding-default',
    type: 'ACCESSIBILITY',
    cause: 'TOKEN',
    confidence: 'DIRECT',
    evidence: [],
    explanation: 'Foreground/background contrast does not satisfy the configured criterion.',
    ...overrides,
  };
}

export interface FactsParts {
  readonly snapshot?: MeasurementSnapshot;
  readonly metricResults?: readonly MetricResult[];
  readonly evaluations?: readonly EvaluationResult[];
  readonly findings?: readonly Finding[];
  readonly diagnostics?: readonly Diagnostic[];
}

export function makeFacts(parts?: FactsParts): ReportFacts {
  return {
    snapshot: parts?.snapshot ?? makeSnapshot(['button.primary']),
    metricResults: parts?.metricResults ?? [makeMetric()],
    evaluations: parts?.evaluations ?? [makeEvaluation()],
    findings: parts?.findings ?? [],
    diagnostics: parts?.diagnostics ?? [],
  };
}
