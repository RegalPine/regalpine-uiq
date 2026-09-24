import type { EngineInfo, EvaluationResult, Finding, RuleConfiguration } from '@uiq/core';

export interface RuleReference {
  readonly id: string;
  readonly version: string;
}

export interface EvaluationRequest {
  readonly snapshotId: string;
  readonly subjects: readonly string[];
  readonly rules: readonly RuleReference[];
  readonly configuration?: readonly RuleConfiguration[];
}

export interface EvaluationSummary {
  readonly total: number;
  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly notApplicable: number;
  readonly unknown: number;
  readonly error: number;
}

export interface EvaluationReport {
  readonly snapshotId: string;
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly summary: EvaluationSummary;
  readonly engine: EngineInfo;
}
