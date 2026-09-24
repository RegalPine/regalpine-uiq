import type { MetricResult } from '@uiq/core';

export interface MetricCacheKey {
  readonly snapshotId: string;
  readonly subjectId: string;
  readonly metricId: string;
  readonly metricVersion: string;
  /** P8 前置修复（P2-03/05）：缓存键加入内容指纹和配置哈希，防止跨采集/配置串用结果。 */
  readonly contentFingerprint?: string;
  readonly configHash?: string;
}

export interface MetricCache {
  get(key: MetricCacheKey): MetricResult | undefined;
  set(key: MetricCacheKey, result: MetricResult): void;
  has(key: MetricCacheKey): boolean;
  clear(): void;
  readonly size: number;
}
