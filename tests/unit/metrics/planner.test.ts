import { describe, expect, it } from 'vitest';
import { buildExecutionPlan } from '@uiq/metrics';
import { MetricDependencyCycleError } from '@uiq/metrics';
import type { MetricDefinition, MetricRegistry } from '@uiq/core';

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

function makeMetric(overrides: Partial<MetricDefinition> = {}): MetricDefinition {
  return {
    id: 'M1',
    version: '1.0.0',
    kind: 'BASE',
    dependencies: [],
    calculate: () => ({
      metricId: 'M1',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      dependencies: [],
      fingerprint: '',
    }),
    ...overrides,
  };
}

describe('buildExecutionPlan', () => {
  it('单节点无依赖', () => {
    const registry = makeRegistry([makeMetric()]);
    const plan = buildExecutionPlan([{ metricId: 'M1', version: '1.0.0' }], registry);
    expect(plan.nodes).toHaveLength(1);
    expect(plan.nodes[0]!.metricId).toBe('M1');
  });

  it('拓扑排序：依赖在前', () => {
    const mA = makeMetric({
      id: 'A',
      dependencies: [{ metricId: 'B', version: '1.0.0', required: true }],
    });
    const mB = makeMetric({ id: 'B', dependencies: [] });
    const registry = makeRegistry([mA, mB]);
    const plan = buildExecutionPlan([{ metricId: 'A', version: '1.0.0' }], registry);
    expect(plan.nodes).toHaveLength(2);
    const bIdx = plan.nodes.findIndex((n) => n.metricId === 'B');
    const aIdx = plan.nodes.findIndex((n) => n.metricId === 'A');
    expect(bIdx).toBeLessThan(aIdx);
  });

  it('DAG 多依赖', () => {
    const mA = makeMetric({
      id: 'A',
      dependencies: [
        { metricId: 'B', version: '1.0.0', required: true },
        { metricId: 'C', version: '1.0.0', required: true },
      ],
    });
    const mB = makeMetric({ id: 'B' });
    const mC = makeMetric({ id: 'C' });
    const registry = makeRegistry([mA, mB, mC]);
    const plan = buildExecutionPlan([{ metricId: 'A', version: '1.0.0' }], registry);
    expect(plan.nodes).toHaveLength(3);
  });

  it('检测环依赖并保留完整路径', () => {
    const mA = makeMetric({
      id: 'A',
      dependencies: [{ metricId: 'B', version: '1.0.0', required: true }],
    });
    const mB = makeMetric({
      id: 'B',
      dependencies: [{ metricId: 'A', version: '1.0.0', required: true }],
    });
    const registry = makeRegistry([mA, mB]);
    expect(() => buildExecutionPlan([{ metricId: 'A', version: '1.0.0' }], registry)).toThrow(
      MetricDependencyCycleError,
    );
  });

  it('缺失依赖抛错', () => {
    const mA = makeMetric({
      id: 'A',
      dependencies: [{ metricId: 'MISSING', version: '1.0.0', required: true }],
    });
    const registry = makeRegistry([mA]);
    expect(() => buildExecutionPlan([{ metricId: 'A', version: '1.0.0' }], registry)).toThrow();
  });

  it('版本不匹配抛错', () => {
    const registry = makeRegistry([makeMetric({ id: 'X', version: '2.0.0' })]);
    expect(() => buildExecutionPlan([{ metricId: 'X', version: '1.0.0' }], registry)).toThrow();
  });

  it('确定性输出：相同输入产生相同输出', () => {
    const mA = makeMetric({
      id: 'A',
      dependencies: [{ metricId: 'C', version: '1.0.0', required: true }],
    });
    const mB = makeMetric({ id: 'B' });
    const mC = makeMetric({ id: 'C' });
    const registry = makeRegistry([mA, mB, mC]);
    const plan1 = buildExecutionPlan(
      [
        { metricId: 'A', version: '1.0.0' },
        { metricId: 'B', version: '1.0.0' },
      ],
      registry,
    );
    const plan2 = buildExecutionPlan(
      [
        { metricId: 'A', version: '1.0.0' },
        { metricId: 'B', version: '1.0.0' },
      ],
      registry,
    );
    expect(plan1.nodes.map((n) => n.metricId)).toEqual(plan2.nodes.map((n) => n.metricId));
  });
});
