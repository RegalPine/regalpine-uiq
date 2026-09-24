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
