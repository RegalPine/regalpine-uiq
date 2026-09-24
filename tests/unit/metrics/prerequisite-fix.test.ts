import { describe, expect, it } from 'vitest';
import { MetricExecutionEngine, InMemoryMetricCache, MetricExecutionError } from '@uiq/metrics';
import type { MetricDefinition, MeasurementSnapshot } from '@uiq/core';
import { createDefaultMetricRegistry } from '@uiq/metrics';

function makeSnapshot(id: string): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1000,
    source: { type: 'STATIC' },
    measurements: [
      {
        id: 'm1',
        subjectId: 's1',
        type: 'GEOMETRY.WIDTH',
        value: 100,
        status: 'AVAILABLE',
        source: { type: 'STATIC' },
        timestamp: 1000,
      },
    ],
  };
}

const simpleMetric: MetricDefinition<number> = {
  id: 'TEST.METRIC',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    const m = ctx.snapshot.measurements.find(
      (mm) => mm.subjectId === ctx.subjectId && mm.type === 'GEOMETRY.WIDTH',
    );
    return {
      metricId: this.id,
      metricVersion: this.version,
      subjectId: ctx.subjectId,
      status: (m ? 'AVAILABLE' : 'UNKNOWN') as 'AVAILABLE' | 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
      ...(m ? { value: m.value as number } : {}),
    };
  },
};

describe('P8 前置修复: 校验 snapshotId 匹配 (P2-03)', () => {
  it('请求 snapshotId 与实际 snapshot 不一致时抛出错误', () => {
    const registry = createDefaultMetricRegistry();
    registry.register(simpleMetric);
    const engine = new MetricExecutionEngine({
      engine: { name: 'test', version: '1.0.0' },
      registry,
    });

    const snapshot = makeSnapshot('snap-A');
    expect(() =>
      engine.execute(snapshot, {
        snapshotId: 'snap-B', // 不匹配
        subjects: ['s1'],
        metrics: [{ id: 'TEST.METRIC', version: '1.0.0' }],
      }),
    ).toThrow(MetricExecutionError);
    expect(() =>
      engine.execute(snapshot, {
        snapshotId: 'snap-B',
        subjects: ['s1'],
        metrics: [{ id: 'TEST.METRIC', version: '1.0.0' }],
      }),
    ).toThrow('snapshotId 不匹配');
  });

  it('snapshotId 匹配时正常执行', () => {
    const registry = createDefaultMetricRegistry();
    registry.register(simpleMetric);
    const engine = new MetricExecutionEngine({
      engine: { name: 'test', version: '1.0.0' },
      registry,
    });

    const snapshot = makeSnapshot('snap-A');
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-A',
      subjects: ['s1'],
      metrics: [{ id: 'TEST.METRIC', version: '1.0.0' }],
    });
    expect(report.results).toHaveLength(1);
    expect(report.results[0]!.status).toBe('AVAILABLE');
  });
});

describe('P8 前置修复: 配置感知缓存 (P2-03/05)', () => {
  it('不同 configHash 不串用缓存结果', () => {
    let callCount = 0;
    const countingMetric: MetricDefinition<number> = {
      id: 'COUNTING',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        callCount++;
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE' as const,
          value: callCount,
          dependencies: [],
          fingerprint: '',
        };
      },
    };

    const registry = createDefaultMetricRegistry();
    registry.register(countingMetric);
    const cache = new InMemoryMetricCache();
    const engine = new MetricExecutionEngine({
      engine: { name: 'test', version: '1.0.0' },
      registry,
      cache,
    });

    const snapshot = makeSnapshot('snap-1');

    // 第一次执行，configHash=A
    const r1 = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['s1'],
      metrics: [{ id: 'COUNTING', version: '1.0.0' }],
      configHash: 'config-A',
    });
    expect(r1.results[0]!.value).toBe(1);

    // 第二次执行，configHash=B → 应重新计算
    const r2 = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['s1'],
      metrics: [{ id: 'COUNTING', version: '1.0.0' }],
      configHash: 'config-B',
    });
    expect(r2.results[0]!.value).toBe(2);

    // 第三次执行，configHash=A → 应命中缓存
    const r3 = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['s1'],
      metrics: [{ id: 'COUNTING', version: '1.0.0' }],
      configHash: 'config-A',
    });
    expect(r3.results[0]!.value).toBe(1); // 缓存命中，仍为 1
  });
});

describe('P8 前置修复: 版本化依赖 trace (P2-03/05)', () => {
  it('MetricResult.metadata 包含 executionTrace', () => {
    const registry = createDefaultMetricRegistry();
    registry.register(simpleMetric);
    const engine = new MetricExecutionEngine({
      engine: { name: 'test', version: '1.0.0' },
      registry,
    });

    const snapshot = makeSnapshot('snap-trace');
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-trace',
      subjects: ['s1'],
      metrics: [{ id: 'TEST.METRIC', version: '1.0.0' }],
    });

    const result = report.results[0]!;
    expect(result.metadata).toBeDefined();
    const trace = (result.metadata as Record<string, unknown>).executionTrace as Record<
      string,
      unknown
    >;
    expect(trace).toBeDefined();
    expect(trace.schemaVersion).toBe('1.1.0');
    expect(trace.snapshotId).toBe('snap-trace');
    expect(trace.sourceMeasurementIds).toEqual(['m1']);
  });
});
