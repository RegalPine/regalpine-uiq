import { describe, expect, it } from 'vitest';
import { InMemoryMetricCache } from '@uiq/metrics';
import type { MetricResult } from '@uiq/core';

function makeResult(overrides: Partial<MetricResult> = {}): MetricResult {
  return {
    metricId: 'M1',
    metricVersion: '1.0.0',
    subjectId: 'e1',
    status: 'AVAILABLE',
    value: 42,
    dependencies: [],
    fingerprint: 'fp1',
    ...overrides,
  };
}

const key1 = { snapshotId: 'snap1', subjectId: 'e1', metricId: 'M1', metricVersion: '1.0.0' };
const key2 = { snapshotId: 'snap1', subjectId: 'e1', metricId: 'M2', metricVersion: '1.0.0' };
const keySnap2 = { snapshotId: 'snap2', subjectId: 'e1', metricId: 'M1', metricVersion: '1.0.0' };

describe('InMemoryMetricCache', () => {
  it('set + get 命中', () => {
    const cache = new InMemoryMetricCache();
    const result = makeResult();
    cache.set(key1, result);
    expect(cache.get(key1)).toBe(result);
  });

  it('未命中返回 undefined', () => {
    const cache = new InMemoryMetricCache();
    expect(cache.get(key1)).toBeUndefined();
  });

  it('has 判断', () => {
    const cache = new InMemoryMetricCache();
    cache.set(key1, makeResult());
    expect(cache.has(key1)).toBe(true);
    expect(cache.has(key2)).toBe(false);
  });

  it('快照隔离：不同 snapshotId 不串用', () => {
    const cache = new InMemoryMetricCache();
    cache.set(key1, makeResult({ value: 100 }));
    cache.set(keySnap2, makeResult({ value: 200 }));
    expect(cache.get(key1)!.value).toBe(100);
    expect(cache.get(keySnap2)!.value).toBe(200);
  });

  it('clear 清空', () => {
    const cache = new InMemoryMetricCache();
    cache.set(key1, makeResult());
    cache.set(key2, makeResult());
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get(key1)).toBeUndefined();
  });

  it('size 正确', () => {
    const cache = new InMemoryMetricCache();
    expect(cache.size).toBe(0);
    cache.set(key1, makeResult());
    expect(cache.size).toBe(1);
    cache.set(key2, makeResult());
    expect(cache.size).toBe(2);
  });
});
