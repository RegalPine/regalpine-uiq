/**
 * Finding Group 模型（IMPL-17 §8 / REPORT-01 §14）。
 * 分组键 = findingType + ruleId@ruleVersion + severity + diagnostic cause（上下文），
 * 不得仅按文本 message 聚类（ARCH-01 §5.6）。
 */
import type { FindingType, Severity } from '@uiq/core';

export interface FindingGroup {
  /** 由分组事实（type/ruleId/ruleVersion/severity/causes）指纹派生，确定性。 */
  readonly id: string;
  readonly findingType: FindingType;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly severity: Severity;
  readonly affectedSubjects: readonly string[];
  readonly count: number;
  readonly representativeFindingId: string;
}
