export { MetricNotFoundError, MetricDependencyCycleError, MetricExecutionError } from './errors';
export type {
  MetricExecutionNode,
  MetricReference as PlannerMetricReference,
  MetricExecutionPlan,
} from './planner/types';
export { buildExecutionPlan } from './planner/plan';
export type { MetricCache, MetricCacheKey } from './cache/types';
export { InMemoryMetricCache } from './cache/memory';
export { metricFingerprint } from './fingerprint/metric-fingerprint';
export type {
  MetricExecutionRequest,
  MetricExecutionReport,
  MetricExecutionMetadata,
  MetricReference,
} from './execution/types';
export { MetricExecutionEngine } from './execution/engine';
export type { MetricExecutionEngineOptions } from './execution/engine';

// Built-in metrics
export { createDefaultMetricRegistry } from './builtins/registry';
export { COLOR_SRGB } from './builtins/color/srgb';
export { COLOR_OKLAB } from './builtins/color/oklab';
export { COLOR_OKLCH } from './builtins/color/oklch';
export { COLOR_LIGHTNESS } from './builtins/color/lightness';
export { COLOR_CHROMA } from './builtins/color/chroma';
export { COLOR_HUE } from './builtins/color/hue';
export { COLOR_CONTRAST } from './builtins/color/contrast';
export { TYPOGRAPHY_FONT_SIZE } from './builtins/typography/font-size';
export { TYPOGRAPHY_FONT_WEIGHT } from './builtins/typography/font-weight';
export { TYPOGRAPHY_LINE_HEIGHT } from './builtins/typography/line-height';
export { TYPOGRAPHY_LETTER_SPACING } from './builtins/typography/letter-spacing';
export { TYPOGRAPHY_TEXT_MEASURE } from './builtins/typography/text-measure';
export { TYPOGRAPHY_SCALE_RATIO } from './builtins/typography/scale-ratio';
export { GEOMETRY_WIDTH } from './builtins/geometry/width';
export { GEOMETRY_HEIGHT } from './builtins/geometry/height';
export { GEOMETRY_AREA } from './builtins/geometry/area';
export { GEOMETRY_ASPECT_RATIO } from './builtins/geometry/aspect-ratio';
export { GEOMETRY_CENTER_DISTANCE } from './builtins/geometry/center-distance';
export { GEOMETRY_EDGE_DISTANCE } from './builtins/geometry/edge-distance';
export { GEOMETRY_OVERLAP } from './builtins/geometry/overlap';

// Token 指标（P5，IMPL-09 §26-28）：工厂显式注册，不进 createDefaultMetricRegistry——
// TokenResolutionPort 未注入时不应产生静默 UNKNOWN 结果（关键决策 7）。
export type { TokenResolutionPort, TokenResolutionPortResult } from './builtins/token/types';
export type { TokenResolutionValue } from './builtins/token/resolution';
export { createTokenResolutionMetric } from './builtins/token/resolution';
export type {
  TokenMatchMetricOptions,
  TokenMatchOutcome,
  TokenMatchValue,
} from './builtins/token/match';
export {
  compareTokenValue,
  createTokenMatchMetric,
  TOKEN_RESOLUTION_METRIC_ID,
  TOKEN_RESOLUTION_METRIC_VERSION,
} from './builtins/token/match';
export type { TokenDeviationMetricOptions, TokenDeviationValue } from './builtins/token/deviation';
export { createTokenDeviationMetric } from './builtins/token/deviation';

// P8：布局指标算法（纯函数，不依赖 MetricDefinition 接口）
export {
  calculateAlignment,
  median,
  calculateGridAlignment,
  calculateGridGroup,
  calculateDensity,
  calculateSymmetry,
  calculateOverflow,
  calculateResponsiveSizeDelta,
  calculateResponsivePositionDelta,
  calculateComponentSizeVariance,
  calculateSpacingVariance,
} from './layout';
export type {
  AlignmentInput,
  AlignmentOutput,
  AlignmentMember,
  GridInput,
  GridOutput,
  GridGroupInput,
  GridGroupOutput,
  GridGroupMember,
  DensityInput,
  DensityOutput,
  DensityMode,
  SymmetryInput,
  SymmetryOutput,
  SymmetryPair,
  SymmetryPairResult,
  OverflowInput,
  OverflowOutput,
  ResponsiveSizeDeltaInput,
  ResponsiveSizeDeltaOutput,
  ResponsivePositionDeltaInput,
  ResponsivePositionDeltaOutput,
  ComponentSizeVarianceInput,
  ComponentSizeVarianceOutput,
  SpacingVarianceOutput,
} from './layout';
