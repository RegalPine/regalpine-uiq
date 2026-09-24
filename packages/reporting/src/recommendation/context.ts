/**
 * 建议上下文（IMPL-17 §13）。
 * 全部字段为调用方构造的只读投影：reporting 不 import tokens/theme/browser，
 * 绑定、组件契约与主题信息以 DTO 形式进入（ARCH-01 §4.2/§5.6）。
 */
import type {
  ComponentContract,
  Diagnostic,
  EvaluationResult,
  Finding,
  MetricResult,
  TokenBinding,
} from '@uiq/core';

import type { ImpactTrace } from '../impact/calculate-impact';

/** 主题投影：id 稳定标识，name 用于建议文案（如 "Light" → "Review Light Theme …"）。 */
export interface ThemeProjection {
  readonly id: string;
  readonly name: string;
}

export interface RecommendationContext {
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
  readonly evaluations: readonly EvaluationResult[];
  readonly metrics: readonly MetricResult[];
  readonly tokenBindings?: readonly TokenBinding[];
  readonly components?: readonly ComponentContract[];
  readonly themes?: readonly ThemeProjection[];
  readonly impactTraces?: readonly ImpactTrace[];
}
