/**
 * 验证条件与验证结果（IMPL-17 §31-32 / IMPL-18 §16）。
 * IMPLEMENTED ≠ VERIFIED：只有新采集且全部必需条件满足才 VERIFIED；
 * 目标评价 N/A、目标消失或版本变化一律不算修复（对齐 AD-23 严格边界）。
 */
import type { EvaluationState } from '@uiq/core';

export interface VerificationCriterion {
  readonly metricId: string;
  readonly metricVersion: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly expectedState: EvaluationState;
}

export interface VerificationResult {
  readonly status: 'VERIFIED' | 'NOT_VERIFIED';
  /** 未满足原因（结构化 code + detail），VERIFIED 时为空数组。 */
  readonly reasons: readonly { readonly code: string; readonly detail: string }[];
}
