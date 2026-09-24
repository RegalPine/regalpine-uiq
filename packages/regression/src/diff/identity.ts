import type { EvaluationResult, Finding, MetricResult } from '@uiq/core';

/**
 * 回归逻辑匹配键（ARCH-01 §6.2：目标 + 规则/指标版本；主题/状态/Scope 不进键——
 * 主题一致性由全局可比性核验承担，状态是差异本身）。
 * 版本变化即不同身份（同 id 不同 version 不会伪判修复，AD-23）。
 */
export function metricKey(
  m: Pick<MetricResult, 'metricId' | 'metricVersion' | 'subjectId'>,
): string {
  return `${m.metricId}@${m.metricVersion}|${m.subjectId}`;
}

export function evaluationKey(
  e: Pick<EvaluationResult, 'ruleId' | 'ruleVersion' | 'subjectId'>,
): string {
  return `${e.ruleId}@${e.ruleVersion}|${e.subjectId}`;
}

/**
 * Finding 逻辑问题键（AD-07：内容指纹与逻辑匹配键分离）：
 * 目标 + 规则版本；**不含 fingerprint/message/数组序号**——
 * 数值变化不打断同一逻辑问题；fingerprint 仅用于内容变化判断（"证据变了 ≠ 新问题"）。
 */
export function findingLogicKey(f: Pick<Finding, 'subjectId' | 'evaluation'>): string {
  return `${f.subjectId}|${f.evaluation.ruleId}@${f.evaluation.ruleVersion}`;
}
