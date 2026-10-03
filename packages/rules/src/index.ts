// 基础求值
export { evaluateOperator } from './operators';
export { evaluateRange } from './ranges';
export { applyTolerance } from './tolerance';

// 错误
export { RuleNotFoundError, RuleEvaluationError, MetricVersionMismatchError } from './errors';

// 评价引擎
export { EvaluationEngine } from './evaluation/engine';
export type {
  CustomEvaluationContext,
  CustomEvaluationOutcome,
  EnrichedRuleDefinition,
  EvaluationEngineOptions,
} from './evaluation/engine';
export type {
  RuleReference,
  EvaluationRequest,
  EvaluationReport,
  EvaluationSummary,
} from './evaluation/types';
export { computeSummary } from './evaluation/summary';

// Finding
export { FindingFactory } from './finding/factory';

// Policy
export type { PolicyProfileDefinition, PolicyRuleReference } from './policy/profile';
export { resolvePolicyRules } from './policy/profile';

// Release Gate（P6，IMPL-11 §60-63 + ER-02 §64：纯标量 DTO 判定，不依赖 regression/conformance）
export {
  evaluateGate,
  DEFAULT_GATE_POLICY,
  type GateInput,
  type GatePolicy,
  type GateResult,
  type GateDecision,
  type GateRegressionCategory,
  type RegressionSummaryCounts,
} from './policy/gate';

// 内置 Rule
export { CONTRAST_WCAG_AA } from './builtins/color/contrast-wcag-aa';
export { FONT_SIZE_MINIMUM } from './builtins/typography/font-size-minimum';
export { LINE_HEIGHT_MINIMUM } from './builtins/typography/line-height-minimum';
export { NO_OVERLAP } from './builtins/geometry/no-overlap';
export { createDefaultRuleRegistry } from './builtins/registry';

// Token 规则（P5，ER-02 §59-60）：工厂显式注册，不进 createDefaultRuleRegistry（关键决策 7）。
export { createTokenMatchRule } from './builtins/token/token-match';
export type {
  ComponentConformanceAggregate,
  ComponentConformanceOptions,
  TokenConformanceOutcome,
} from './builtins/token/component-conformance';
export { createComponentConformanceRule } from './builtins/token/component-conformance';

// P8：布局规则算法（纯函数）
export {
  evaluateAlignmentConformance,
  evaluateGridConformance,
  evaluateSpacingConformance,
  evaluateContainerConstraint,
  evaluateOverflowConstraint,
  evaluateDensityRange,
  evaluateSymmetryConformance,
  evaluateComponentSizeConsistency,
  evaluateResponsiveConstraint,
  evaluateResponsiveNoOverflow,
  evaluateOrderConformance,
} from './layout';
export type {
  LayoutEvalState,
  AlignmentConformanceConfig,
  AlignmentConformanceInput,
  GridConformanceConfig,
  GridConformanceInput,
  SpacingConformanceConfig,
  SpacingConformanceInput,
  ContainerConstraintConfig,
  ContainerConstraintInput,
  OverflowConstraintConfig,
  OverflowConstraintInput,
  OverflowMode,
  DensityRangeConfig,
  DensityRangeInput,
  SymmetryConformanceConfig,
  SymmetryConformanceInput,
  ComponentSizeConsistencyConfig,
  ComponentSizeConsistencyInput,
  ResponsiveConstraintConfig,
  ResponsiveConstraintInput,
  ResponsiveNoOverflowInput,
  OrderConformanceConfig,
  OrderConformanceInput,
} from './layout';

// Visual Texture Rules
export {
  SURFACE_RADIUS_CONSISTENCY_RULE,
  SURFACE_RADIUS_FRAGMENTATION_RULE,
  SURFACE_BORDER_CONSISTENCY_RULE,
  SURFACE_SHADOW_CONSISTENCY_RULE,
  SURFACE_SHADOW_COMPLEXITY_RULE,
  SURFACE_LAYER_CONSISTENCY_RULE,
  SURFACE_TRANSPARENCY_CONSISTENCY_RULE,
  SURFACE_MATERIAL_CONSISTENCY_RULE,
  surfaceRules,
  DEPTH_ELEVATION_RULE,
  DEPTH_SHADOW_DEPTH_RULE,
  DEPTH_LAYER_RULE,
  DEPTH_SEPARATION_RULE,
  DEPTH_OVERLAY_RULE,
  DEPTH_SPATIAL_PRIORITY_RULE,
  depthRules,
  COLOR_LIGHTNESS_HIERARCHY_RULE,
  COLOR_CHROMA_DISTRIBUTION_RULE,
  COLOR_HUE_RELATIONSHIP_RULE,
  COLOR_HARMONY_RULE,
  COLOR_TOKEN_CONSISTENCY_RULE,
  COLOR_NOISE_RULE,
  COLOR_CONTRAST_QUALITY_RULE,
  colorTextureRules,
  TYPO_FONT_CONSISTENCY_RULE,
  TYPO_SCALE_CONSISTENCY_RULE,
  TYPO_WEIGHT_HIERARCHY_RULE,
  TYPO_LINEHEIGHT_RHYTHM_RULE,
  TYPO_SPACING_QUALITY_RULE,
  TYPO_DENSITY_BALANCE_RULE,
  TYPO_HIERARCHY_RULE,
  typographyTextureRules,
  SPATIAL_GRID_RULE,
  SPATIAL_ALIGNMENT_RULE,
  SPATIAL_SPACING_RULE,
  SPATIAL_WHITESPACE_RULE,
  SPATIAL_DENSITY_RULE,
  SPATIAL_PROPORTION_RULE,
  SPATIAL_COMPOSITION_RULE,
  spatialTextureRules,
  MOTION_TRANSITION_RULE,
  MOTION_ANIMATION_TIMING_RULE,
  MOTION_EASING_RULE,
  MOTION_STATE_CHANGE_RULE,
  MOTION_CONSISTENCY_RULE,
  MOTION_LOADING_RULE,
  MOTION_DURATION_CONSISTENCY_RULE,
  motionTextureRules,
  MICRO_STATE_COMPLETENESS_RULE,
  MICRO_COMPONENT_CONSISTENCY_RULE,
  MICRO_ICON_CONSISTENCY_RULE,
  MICRO_FOCUS_QUALITY_RULE,
  MICRO_DISABLED_QUALITY_RULE,
  MICRO_EMPTY_QUALITY_RULE,
  MICRO_BORDER_DETAIL_RULE,
  MICRO_RADIUS_DETAIL_RULE,
  MICRO_LOADING_QUALITY_RULE,
  MICRO_ERROR_QUALITY_RULE,
  MICRO_HOVER_COMPLETENESS_RULE,
  MICRO_ACTIVE_FEEDBACK_RULE,
  MICRO_SELECTED_DIFFERENTIATION_RULE,
  MICRO_ICON_ALIGNMENT_RULE,
  MICRO_COMPONENT_DENSITY_RULE,
  MICRO_FRAGMENTATION_RULE,
  microDetailTextureRules,
} from './visual-texture';

export {
  createVisualTextureRuleRegistry,
  type VisualTextureRuleRegistry,
} from './visual-texture';
