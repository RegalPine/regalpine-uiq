import type { MetricResult, EngineInfo } from '@uiq/core';

export interface MetricReference {
  readonly id: string;
  readonly version: string;
}

export interface MetricExecutionRequest {
  readonly snapshotId: string;
  readonly subjects: readonly string[];
  readonly metrics: readonly MetricReference[];
  /** P8 前置修复（P2-03/05）：配置感知缓存，可选内容指纹和配置哈希。 */
  readonly contentFingerprint?: string;
  readonly configHash?: string;
}

export interface MetricExecutionMetadata {
  readonly engine: EngineInfo;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly requestedMetrics: number;
  readonly executedMetrics: number;
  readonly cachedMetrics: number;
  readonly availableMetrics: number;
  readonly unknownMetrics: number;
  readonly errorMetrics: number;
}

export interface MetricExecutionReport {
  readonly snapshotId: string;
  readonly results: readonly MetricResult[];
  readonly execution: MetricExecutionMetadata;
}
