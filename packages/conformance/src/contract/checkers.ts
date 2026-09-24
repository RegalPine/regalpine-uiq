import type { EvaluationState } from '@uiq/core';

/**
 * 契约符合性纯检查器：actual 由调用方从被测注册表提取（core Registry.list() 形状兼容），
 * 生产 conformance 不 import 被测引擎（ARCH-01 §4.3）。
 */
export interface DeclaredCapability {
  readonly id: string;
  readonly version: string;
}

export type ContractIssueType = 'MISSING' | 'EXTRA' | 'VERSION_MISMATCH';

export interface ContractIssue {
  readonly type: ContractIssueType;
  readonly id: string;
  readonly message: string;
}

export function checkCapabilityContract(
  declared: readonly DeclaredCapability[],
  actual: readonly DeclaredCapability[],
): readonly ContractIssue[] {
  const issues: ContractIssue[] = [];
  const actualById = new Map(actual.map((a) => [a.id, a]));
  for (const d of declared) {
    const a = actualById.get(d.id);
    if (a === undefined) {
      issues.push({ type: 'MISSING', id: d.id, message: `声明的 ${d.id}@${d.version} 未实现` });
    } else if (a.version !== d.version) {
      issues.push({
        type: 'VERSION_MISMATCH',
        id: d.id,
        message: `${d.id} 版本不符：声明 ${d.version}，实际 ${a.version}`,
      });
    }
  }
  const declaredIds = new Set(declared.map((d) => d.id));
  for (const a of actual) {
    if (!declaredIds.has(a.id)) {
      issues.push({
        type: 'EXTRA',
        id: a.id,
        message: `实际存在的 ${a.id}@${a.version} 未在契约中声明`,
      });
    }
  }
  return issues;
}

export const checkMetricContract = checkCapabilityContract;
export const checkRuleContract = checkCapabilityContract;

const ALL_STATES: readonly EvaluationState[] = [
  'PASS',
  'FAIL',
  'WARN',
  'NOT_APPLICABLE',
  'UNKNOWN',
  'ERROR',
];

/** UIQ-IMPL-11 §25 / AC-CONF-06：评价六态覆盖统计（检查工具，非评价器）。 */
export interface StateCoverage {
  readonly covered: readonly EvaluationState[];
  readonly missing: readonly EvaluationState[];
  readonly counts: Readonly<Record<EvaluationState, number>>;
}

export function checkEvaluationStateCoverage(states: readonly string[]): StateCoverage {
  const counts: Record<EvaluationState, number> = {
    PASS: 0,
    FAIL: 0,
    WARN: 0,
    NOT_APPLICABLE: 0,
    UNKNOWN: 0,
    ERROR: 0,
  };
  for (const s of states) {
    if ((ALL_STATES as readonly string[]).includes(s)) {
      counts[s as EvaluationState] += 1;
    }
  }
  const covered = ALL_STATES.filter((s) => counts[s] > 0);
  const missing = ALL_STATES.filter((s) => counts[s] === 0);
  return { covered, missing, counts };
}
