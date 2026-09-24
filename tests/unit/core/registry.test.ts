import { describe, expect, it } from 'vitest';
import {
  ExactVersionRegistry,
  DefaultMetricRegistry,
  DefaultRuleRegistry,
  assertExactVersion,
} from '@uiq/core';
import type { MetricDefinition, RuleDefinition } from '@uiq/core';

describe('assertExactVersion', () => {
  it('接受标准 SemVer', () => {
    expect(() => assertExactVersion('1.0.0')).not.toThrow();
    expect(() => assertExactVersion('0.0.1')).not.toThrow();
    expect(() => assertExactVersion('1.2.3-alpha.1')).not.toThrow();
    expect(() => assertExactVersion('1.0.0+build.123')).not.toThrow();
  });

  it('拒绝非精确版本', () => {
    expect(() => assertExactVersion('latest')).toThrow(TypeError);
    expect(() => assertExactVersion('^1.0.0')).toThrow(TypeError);
    expect(() => assertExactVersion('>=1.0.0')).toThrow(TypeError);
    expect(() => assertExactVersion('1.0')).toThrow(TypeError);
    expect(() => assertExactVersion('')).toThrow(TypeError);
  });
});

describe('ExactVersionRegistry', () => {
  const item = { id: 'test', version: '1.0.0', data: 'hello' };

  it('注册并检索定义', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    registry.register(item);
    expect(registry.has('test', '1.0.0')).toBe(true);
    expect(registry.get('test', '1.0.0')).toMatchObject({ id: 'test', version: '1.0.0' });
  });

  it('拒绝重复注册', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    registry.register(item);
    expect(() => registry.register(item)).toThrow('重复注册');
  });

  it('返回不可变副本', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    registry.register(item);
    const result = registry.get('test', '1.0.0')!;
    expect(() => {
      (result as Record<string, unknown>).data = 'mutated';
    }).toThrow();
  });

  it('list 返回冻结数组', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    registry.register(item);
    const list = registry.list();
    expect(Object.isFrozen(list)).toBe(true);
    expect(list).toHaveLength(1);
  });

  it('区分不同版本', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    registry.register(item);
    registry.register({ ...item, version: '2.0.0' });
    expect(registry.has('test', '1.0.0')).toBe(true);
    expect(registry.has('test', '2.0.0')).toBe(true);
    expect(registry.has('test', '3.0.0')).toBe(false);
  });

  it('拒绝循环对象', () => {
    type Item = { id: string; version: string; data: string; self?: unknown };
    const circular: Item = { id: 'x', version: '1.0.0', data: 'test' };
    circular.self = circular;
    const registry = new ExactVersionRegistry<Item>();
    expect(() => registry.register(circular)).toThrow('循环');
  });

  it('拒绝空 id 或含空白 id', () => {
    const registry = new ExactVersionRegistry<typeof item>();
    expect(() => registry.register({ id: '', version: '1.0.0', data: 'x' })).toThrow();
    expect(() => registry.register({ id: ' test ', version: '1.0.0', data: 'x' })).toThrow();
  });
});

describe('DefaultMetricRegistry', () => {
  function createMetric(overrides: Partial<MetricDefinition> = {}): MetricDefinition {
    return {
      id: 'm1',
      version: '1.0.0',
      kind: 'BASE',
      dependencies: [],
      calculate: () => ({
        metricId: 'm1',
        metricVersion: '1.0.0',
        subjectId: 'e1',
        status: 'AVAILABLE',
        dependencies: [],
        fingerprint: 'abc',
      }),
      ...overrides,
    };
  }

  it('注册合法 Metric', () => {
    const registry = new DefaultMetricRegistry();
    registry.register(createMetric());
    expect(registry.has('m1', '1.0.0')).toBe(true);
  });

  it('拒绝缺少 calculate 的 Metric', () => {
    const registry = new DefaultMetricRegistry();
    expect(() =>
      registry.register(
        createMetric({ calculate: undefined as unknown as MetricDefinition['calculate'] }),
      ),
    ).toThrow('缺少 calculate');
  });

  it('验证依赖版本格式', () => {
    const registry = new DefaultMetricRegistry();
    expect(() =>
      registry.register(
        createMetric({
          dependencies: [{ metricId: 'dep', version: 'latest', required: true }],
        }),
      ),
    ).toThrow(TypeError);
  });
});

describe('DefaultRuleRegistry', () => {
  function createRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
    return {
      id: 'r1',
      version: '1.0.0',
      metricId: 'm1',
      metricVersion: '1.0.0',
      severity: 'HIGH',
      applicability: { evaluate: () => 'APPLICABLE' },
      ...overrides,
    };
  }

  it('注册合法 Rule', () => {
    const registry = new DefaultRuleRegistry();
    registry.register(createRule());
    expect(registry.has('r1', '1.0.0')).toBe(true);
  });

  it('拒绝缺少 applicability 的 Rule', () => {
    const registry = new DefaultRuleRegistry();
    expect(() =>
      registry.register(
        createRule({ applicability: undefined as unknown as RuleDefinition['applicability'] }),
      ),
    ).toThrow('缺少适用性函数');
  });

  it('验证关联 Metric 版本格式', () => {
    const registry = new DefaultRuleRegistry();
    expect(() => registry.register(createRule({ metricVersion: '^1.0.0' }))).toThrow(TypeError);
  });
});
