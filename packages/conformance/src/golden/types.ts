import type { Tolerance } from '@uiq/core';

/**
 * UIQ-IMPL-11 §13：Golden Test 固定 Input / Metric Version / Expected Output /
 * Tolerance / Test ID；必须 deterministic、versioned、reviewable、repeatable（§11）。
 */
export interface GoldenCase<TInput, TOutput> {
  readonly id: string;
  readonly version: string;
  readonly input: TInput;
  readonly expected: TOutput;
  readonly tolerance?: Tolerance;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type GoldenCaseStatus = 'PASS' | 'FAIL' | 'ERROR';

export interface GoldenCaseResult<TOutput = unknown> {
  readonly id: string;
  readonly version: string;
  readonly status: GoldenCaseStatus;
  readonly message?: string;
  readonly expected?: TOutput;
  readonly actual?: TOutput;
}

/** UIQ-IMPL-11 §15：GoldenReport。failed 仅计 status==='FAIL'；ERROR 单独从 cases 派生。 */
export interface GoldenReport<TOutput = unknown> {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly cases: readonly GoldenCaseResult<TOutput>[];
}
