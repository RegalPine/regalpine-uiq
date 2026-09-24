export type { QualityDimension, QualitySummary, QualityDimensionReport } from './model/quality';
export { QUALITY_DIMENSIONS } from './model/quality';
export type { ReportScope } from './model/scope';
export type { FindingSummary, DiagnosticSummary } from './model/finding';
export type {
  RecommendationType,
  RecommendationTargetType,
  EvidenceReference,
  ImpactAssessment,
  ImprovementRecommendation,
} from './model/recommendation';
export type { VerificationCriterion, VerificationResult } from './model/verification';
export type { ReproducibilityMetadata } from './model/reproducibility';
export type { FindingGroup } from './model/group';
export {
  QUALITY_REPORT_SCHEMA_VERSION,
  QUALITY_REPORT_SCHEMA_VERSION_EXTENDED,
  type UIQualityReport,
} from './model/report';

export type { ReportFacts } from './aggregation/facts';
export { aggregateSummary, SummaryInvariantError } from './aggregation/summary';
export {
  aggregateDimensions,
  dimensionForRule,
  DimensionMappingError,
} from './aggregation/dimensions';
export { groupFindings } from './aggregation/group-findings';

export { linkDiagnostics } from './diagnostic/link-diagnostics';
export { toDiagnosticSummaries } from './diagnostic/root-cause';
export { calculateImpact, type ImpactTrace, type ImpactInput } from './impact/calculate-impact';

export type { RecommendationContext, ThemeProjection } from './recommendation/context';
export type { RecommendationRule, RecommendationDraft } from './recommendation/recommendation-rule';
export {
  RecommendationRuleRegistry,
  RecommendationRuleRegistryError,
} from './recommendation/registry';
export {
  DefaultRecommendationEngine,
  recommend,
  type RecommendationEngine,
} from './recommendation/engine';
export { initialRecommendationRules } from './recommendation/rules/initial-rules';

export { createVerificationCriteria } from './verification/create-verification-criteria';
export { verify, type VerificationInput } from './verification/verify';

export {
  generateQualityReport,
  ReportInputError,
  type QualityReportInput,
  type GenerateQualityReportOptions,
} from './generator/generate-quality-report';
export { renderJson } from './renderer/json-renderer';
export { renderMarkdown } from './renderer/markdown-renderer';
export { escapeHtml, renderHtml } from './renderer/html-renderer';

// P8：布局报告模型
export type {
  LayoutLevel,
  LayoutDimensionReport,
  LayoutLevelReport,
  LayoutFindingGroup,
} from './layout';
export { LAYOUT_REPORT_SCHEMA_VERSION, emptyLayoutReport } from './layout';
