/**
 * Finding / Diagnostic 摘要投影（IMPL-17 §7）。
 * 原始 Finding 与 Diagnostic 永远保留在输入产物中；报告只携带 Summary。
 */
import type { DiagnosticCause, FindingState, FindingType, Severity } from '@uiq/core';

export interface FindingSummary {
  readonly id: string;
  readonly findingType: FindingType;
  readonly severity: Severity;
  readonly subjectId: string;
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly state: FindingState;
  readonly fingerprint: string;
  readonly diagnosticIds: readonly string[];
}

/** Diagnostic 投影（cause/confidence 原样透传，不重新归因）。 */
export interface DiagnosticSummary {
  readonly id: string;
  readonly findingId: string;
  readonly type: FindingType;
  readonly cause: DiagnosticCause;
  readonly confidence: 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
  readonly explanation: string;
}
