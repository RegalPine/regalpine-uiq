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

// IMPL-32：Renderer 接口与实现类
export type {
  ReportRenderer,
  MarkdownReportRenderer,
  HtmlReportRenderer,
  JsonReportRenderer,
} from './renderer/types';
export {
  DefaultMarkdownReportRenderer,
  MARKDOWN_RENDERER_VERSION,
} from './renderer/markdown';
export {
  DefaultHtmlReportRenderer,
  HTML_RENDERER_VERSION,
} from './renderer/html';
export {
  DefaultJsonReportRenderer,
  JSON_RENDERER_VERSION,
} from './renderer/json';

// P8：布局报告模型
export type {
  LayoutLevel,
  LayoutDimensionReport,
  LayoutLevelReport,
  LayoutFindingGroup,
} from './layout';
export { LAYOUT_REPORT_SCHEMA_VERSION, emptyLayoutReport } from './layout';

// Visual Texture 报告
export { recommendSurface } from './visual-texture';
export type { SurfaceRecommendation } from './visual-texture';
export { recommendVisualTexture } from './visual-texture';
export type { VisualTextureRecommendation } from './visual-texture';
export { aggregateVisualTexture } from './visual-texture';
export type { VisualTextureAggregation, DimensionSummary } from './visual-texture';
export { generateVerification } from './visual-texture';
export { detectCrossDimensionRelations } from './visual-texture';
export { detectSystemicPatterns } from './visual-texture';
export { buildVisualTextureReport } from './visual-texture';
// Cross-Component Visual Continuity
export { analyzeCrossComponentContinuity, inferComponentRelations } from './visual-texture';
export { groupMeasurementsByComponent, groupByExplicitBoundaries } from './visual-texture';
export type { ComponentMetricGroup } from './visual-texture';
