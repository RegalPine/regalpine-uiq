import type { MetricResult } from '@uiq/core';
import type { MetricCache, MetricCacheKey } from './types';

function cacheKeyString(key: MetricCacheKey): string {
  let k = `${key.snapshotId}::${key.subjectId}::${key.metricId}@${key.metricVersion}`;
  // P8 前置修复（P2-03/05）：配置感知缓存键
  if (key.contentFingerprint !== undefined) k += `::cf=${key.contentFingerprint}`;
  if (key.configHash !== undefined) k += `::ch=${key.configHash}`;
  return k;
}

export class InMemoryMetricCache implements MetricCache {
  private readonly store = new Map<string, MetricResult>();

  get(key: MetricCacheKey): MetricResult | undefined {
    return this.store.get(cacheKeyString(key));
  }

  set(key: MetricCacheKey, result: MetricResult): void {
    this.store.set(cacheKeyString(key), result);
  }

  has(key: MetricCacheKey): boolean {
    return this.store.has(cacheKeyString(key));
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
