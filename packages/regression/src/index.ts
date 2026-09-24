export type * from './baseline/contracts';
export { BaselineInputError } from './baseline/contracts';
export { approveBaseline, type ApproveBaselineOptions } from './baseline/approve';
export {
  createInMemoryBaselineStore,
  BaselineStoreError,
  type BaselineStore,
  type SaveOptions,
} from './baseline/store';
export { serializeBaseline, deserializeBaseline } from './baseline/serialize';
export { metricKey, evaluationKey, findingLogicKey } from './diff/identity';
export { REGRESSION_CATEGORIES, type RegressionCategory } from './diff/categories';
export { diffMetrics, type MetricDiff } from './diff/metric-diff';
export { diffEvaluations, type EvaluationDiff } from './diff/evaluation-diff';
export { diffFindings, type FindingDiff, type FindingDiffStatus } from './diff/finding-diff';
export {
  diffSubjectPresence,
  type MissingTarget,
  type MissingTargetSide,
} from './diff/missing-targets';
export {
  checkComparability,
  type ComparabilityAspect,
  type ComparabilityReason,
  type ComparabilityResult,
} from './classification/comparability';
export { classifyEvaluationDiff, type ClassificationResult } from './classification/classifier';
export {
  runRegression,
  RegressionInputError,
  type RegressionOutcome,
} from './classification/engine';
export {
  summarize,
  buildRegressionReport,
  type RegressionSummary,
  type RegressionRecord,
  type RegressionRecordKind,
  type RegressionReport,
  type BuildRegressionReportInput,
} from './report/report';
