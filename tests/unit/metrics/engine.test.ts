import { describe, expect, it } from 'vitest';
import { MetricExecutionEngine, InMemoryMetricCache, MetricNotFoundError } from '@uiq/metrics';
import type { MetricDefinition, MetricRegistry, MeasurementSnapshot, EngineInfo } from '@uiq/core';

const engineInfo: EngineInfo = { name: 'test-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

function makeRegistry(metrics: MetricDefinition[]): MetricRegistry {
  const map = new Map<string, MetricDefinition>();
  for (const m of metrics) {
    map.set(`${m.id}@${m.version}`, m);
  }
  return {
    register: () => {
      throw new Error('readonly');
    },
    get: (id, version) => map.get(`${id}@${version}`),
    has: (id, version) => map.has(`${id}@${version}`),
    list: () => [...map.values()],
  };
}

function makeSnapshot(
  measurements: Array<{
    subjectId: string;
    type: string;
    value: unknown;
    status?: 'AVAILABLE' | 'UNKNOWN' | 'ERROR';
  }>,
): MeasurementSnapshot {
  return {
    id: 'snap-1',
    capturedAt: 1000,
    source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`,
      subjectId: m.subjectId,
      type: m.type,
      value: m.value,
      status: m.status ?? 'AVAILABLE',
      source,
      timestamp: 1000,
    })),
  };
}

describe('MetricExecutionEngine', () => {
  it('单指标执行', () => {
    const metric: MetricDefinition<number> = {
      id: 'TEST.VALUE',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        const m = ctx.snapshot.measurements.find(
          (x) => x.subjectId === ctx.subjectId && x.type === 'test.value',
        );
        if (!m || m.status !== 'AVAILABLE') {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: m.value as number,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([metric]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([{ subjectId: 'e1', type: 'test.value', value: 42 }]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'TEST.VALUE', version: '1.0.0' }],
    });

    expect(report.results).toHaveLength(1);
    expect(report.results[0]!.status).toBe('AVAILABLE');
    expect(report.results[0]!.value).toBe(42);
    expect(report.results[0]!.fingerprint).toBeTruthy();
  });

  it('依赖指标执行', () => {
    const base: MetricDefinition<number> = {
      id: 'BASE',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        const m = ctx.snapshot.measurements.find(
          (x) => x.subjectId === ctx.subjectId && x.type === 'base',
        );
        if (!m || m.status !== 'AVAILABLE') {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: m.value as number,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const derived: MetricDefinition<number> = {
      id: 'DERIVED',
      version: '1.0.0',
      kind: 'DERIVED',
      dependencies: [{ metricId: 'BASE', version: '1.0.0', required: true }],
      calculate(ctx) {
        const dep = ctx.dependencies.get('BASE@1.0.0');
        if (!dep || dep.status !== 'AVAILABLE') {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: (dep.value as number) * 2,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([base, derived]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([{ subjectId: 'e1', type: 'base', value: 10 }]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'DERIVED', version: '1.0.0' }],
    });

    const derivedResult = report.results.find((r) => r.metricId === 'DERIVED');
    expect(derivedResult).toBeDefined();
    expect(derivedResult!.value).toBe(20);
  });

  it('UNKNOWN 传播', () => {
    const base: MetricDefinition<number> = {
      id: 'BASE',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate: () => ({
        metricId: 'BASE',
        metricVersion: '1.0.0',
        subjectId: 'e1',
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: '',
      }),
    };
    const derived: MetricDefinition<number> = {
      id: 'DERIVED',
      version: '1.0.0',
      kind: 'DERIVED',
      dependencies: [{ metricId: 'BASE', version: '1.0.0', required: true }],
      calculate(ctx) {
        const dep = ctx.dependencies.get('BASE@1.0.0');
        if (!dep || dep.status !== 'AVAILABLE') {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: (dep.value as number) * 2,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([base, derived]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'DERIVED', version: '1.0.0' }],
    });

    const baseResult = report.results.find((r) => r.metricId === 'BASE');
    const derivedResult = report.results.find((r) => r.metricId === 'DERIVED');
    expect(baseResult!.status).toBe('UNKNOWN');
    expect(derivedResult!.status).toBe('UNKNOWN');
  });

  it('ERROR 隔离：单指标异常不崩溃', () => {
    const throwing: MetricDefinition = {
      id: 'THROW',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate() {
        throw new Error('boom');
      },
    };
    const safe: MetricDefinition<number> = {
      id: 'SAFE',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: 1,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([throwing, safe]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [
        { id: 'THROW', version: '1.0.0' },
        { id: 'SAFE', version: '1.0.0' },
      ],
    });

    expect(report.results).toHaveLength(2);
    const throwResult = report.results.find((r) => r.metricId === 'THROW');
    expect(throwResult!.status).toBe('ERROR');
    const safeResult = report.results.find((r) => r.metricId === 'SAFE');
    expect(safeResult!.status).toBe('AVAILABLE');
  });

  it('未注册指标抛 MetricNotFoundError', () => {
    const registry = makeRegistry([]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([]);
    expect(() =>
      engine.execute(snapshot, {
        snapshotId: 'snap-1',
        subjects: ['e1'],
        metrics: [{ id: 'MISSING', version: '1.0.0' }],
      }),
    ).toThrow(MetricNotFoundError);
  });

  it('缓存命中减少执行次数', () => {
    const metric: MetricDefinition<number> = {
      id: 'CACHED',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: 99,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([metric]);
    const cache = new InMemoryMetricCache();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry, cache });
    const snapshot = makeSnapshot([]);

    // 第一次执行
    engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'CACHED', version: '1.0.0' }],
    });
    expect(engine['cache'].size).toBe(1);

    // 第二次执行（缓存命中）
    const report2 = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'CACHED', version: '1.0.0' }],
    });
    expect(report2.execution.cachedMetrics).toBe(1);
    expect(report2.execution.executedMetrics).toBe(0);
  });

  it('确定性排序输出', () => {
    const mA: MetricDefinition<number> = {
      id: 'Z_METRIC',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: 1,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const mB: MetricDefinition<number> = {
      id: 'A_METRIC',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: 2,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([mA, mB]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [
        { id: 'Z_METRIC', version: '1.0.0' },
        { id: 'A_METRIC', version: '1.0.0' },
      ],
    });

    // 结果应按 metricId 排序
    expect(report.results[0]!.metricId).toBe('A_METRIC');
    expect(report.results[1]!.metricId).toBe('Z_METRIC');
  });

  it('多主体执行', () => {
    const metric: MetricDefinition<number> = {
      id: 'MULTI',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        const m = ctx.snapshot.measurements.find(
          (x) => x.subjectId === ctx.subjectId && x.type === 'multi',
        );
        if (!m || m.status !== 'AVAILABLE') {
          return {
            metricId: this.id,
            metricVersion: this.version,
            subjectId: ctx.subjectId,
            status: 'UNKNOWN',
            dependencies: [],
            fingerprint: '',
          };
        }
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: m.value as number,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([metric]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([
      { subjectId: 'e1', type: 'multi', value: 10 },
      { subjectId: 'e2', type: 'multi', value: 20 },
    ]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1', 'e2'],
      metrics: [{ id: 'MULTI', version: '1.0.0' }],
    });

    expect(report.results).toHaveLength(2);
    // 按 subjectId 排序
    expect(report.results[0]!.subjectId).toBe('e1');
    expect(report.results[0]!.value).toBe(10);
    expect(report.results[1]!.subjectId).toBe('e2');
    expect(report.results[1]!.value).toBe(20);
  });

  it('执行元数据完整', () => {
    const metric: MetricDefinition<number> = {
      id: 'META',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate(ctx) {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: 1,
          dependencies: [],
          fingerprint: '',
        };
      },
    };
    const registry = makeRegistry([metric]);
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = makeSnapshot([]);
    const report = engine.execute(snapshot, {
      snapshotId: 'snap-1',
      subjects: ['e1'],
      metrics: [{ id: 'META', version: '1.0.0' }],
    });

    expect(report.execution.engine).toEqual(engineInfo);
    expect(report.execution.startedAt).toBeTruthy();
    expect(report.execution.completedAt).toBeTruthy();
    expect(typeof report.execution.durationMs).toBe('number');
    expect(report.execution.requestedMetrics).toBe(1);
    expect(report.execution.executedMetrics).toBe(1);
    expect(report.execution.availableMetrics).toBe(1);
  });
});
