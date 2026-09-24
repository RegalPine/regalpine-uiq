import { describe, expect, it } from 'vitest';
import { EvaluationEngine } from '@uiq/rules';
import type { MetricResult, RuleDefinition, RuleRegistry, RuleConfiguration } from '@uiq/core';

function makeRegistry(rules: RuleDefinition[]): RuleRegistry {
  const map = new Map<string, RuleDefinition>();
  for (const r of rules) {
    map.set(`${r.id}@${r.version}`, r);
  }
  return {
    register(rule: RuleDefinition) {
      map.set(`${rule.id}@${rule.version}`, rule);
    },
    get(id: string, version: string) {
      return map.get(`${id}@${version}`);
    },
    has(id: string, version: string) {
      return map.has(`${id}@${version}`);
    },
    list() {
      return [...map.values()];
    },
  };
}

const alwaysApplicable: RuleDefinition = {
  id: 'TEST.RULE',
  version: '1.0.0',
  metricId: 'TEST.METRIC',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 10,
  severity: 'MEDIUM',
  applicability: {
    evaluate() {
      return 'APPLICABLE';
    },
  },
};

function makeMetricResult(
  subjectId: string,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR',
  value?: number,
): MetricResult {
  return {
    metricId: 'TEST.METRIC',
    metricVersion: '1.0.0',
    subjectId,
    status,
    dependencies: [],
    fingerprint: 'abc123',
    ...(value !== undefined ? { value } : {}),
  };
}

describe('P8 前置修复: 保留 Metric ERROR (P3-01/02)', () => {
  it('Metric 状态为 ERROR 时，评估结果为 ERROR 而非 UNKNOWN', () => {
    const registry = makeRegistry([alwaysApplicable]);
    const engine = new EvaluationEngine({
      engine: { name: 'test', version: '1.0.0' },
      ruleRegistry: registry,
    });

    const metricResults: MetricResult[] = [makeMetricResult('s1', 'ERROR')];
    const report = engine.evaluate(
      {
        snapshotId: 'snap-1',
        subjects: ['s1'],
        rules: [{ id: 'TEST.RULE', version: '1.0.0' }],
      },
      metricResults,
    );

    expect(report.evaluations).toHaveLength(1);
    expect(report.evaluations[0]!.state).toBe('ERROR');
  });

  it('Metric 缺失时仍为 UNKNOWN', () => {
    const registry = makeRegistry([alwaysApplicable]);
    const engine = new EvaluationEngine({
      engine: { name: 'test', version: '1.0.0' },
      ruleRegistry: registry,
    });

    const report = engine.evaluate(
      {
        snapshotId: 'snap-1',
        subjects: ['s1'],
        rules: [{ id: 'TEST.RULE', version: '1.0.0' }],
      },
      [], // 无 metric results
    );

    expect(report.evaluations).toHaveLength(1);
    expect(report.evaluations[0]!.state).toBe('UNKNOWN');
  });
});

describe('P8 前置修复: 按目标绑定配置 (P3-01/02)', () => {
  it('目标配置优先于全局配置', () => {
    const registry = makeRegistry([alwaysApplicable]);
    const engine = new EvaluationEngine({
      engine: { name: 'test', version: '1.0.0' },
      ruleRegistry: registry,
    });

    const configurations: RuleConfiguration[] = [
      // 全局配置：阈值 10
      {
        ruleId: 'TEST.RULE',
        ruleVersion: '1.0.0',
        values: { threshold: 10 },
      },
      // 目标配置：s1 的阈值为 5
      {
        ruleId: 'TEST.RULE',
        ruleVersion: '1.0.0',
        values: { threshold: 5, subjectId: 's1' },
      },
    ];

    const metricResults: MetricResult[] = [makeMetricResult('s1', 'AVAILABLE', 7)];
    const report = engine.evaluate(
      {
        snapshotId: 'snap-1',
        subjects: ['s1'],
        rules: [{ id: 'TEST.RULE', version: '1.0.0' }],
        configuration: configurations,
      },
      metricResults,
    );

    // s1 使用目标配置 threshold=5，值 7 > 5 → FAIL
    expect(report.evaluations[0]!.state).toBe('FAIL');
  });

  it('无目标配置时回退到全局配置', () => {
    const registry = makeRegistry([alwaysApplicable]);
    const engine = new EvaluationEngine({
      engine: { name: 'test', version: '1.0.0' },
      ruleRegistry: registry,
    });

    const configurations: RuleConfiguration[] = [
      {
        ruleId: 'TEST.RULE',
        ruleVersion: '1.0.0',
        values: { threshold: 10 },
      },
    ];

    const metricResults: MetricResult[] = [makeMetricResult('s1', 'AVAILABLE', 7)];
    const report = engine.evaluate(
      {
        snapshotId: 'snap-1',
        subjects: ['s1'],
        rules: [{ id: 'TEST.RULE', version: '1.0.0' }],
        configuration: configurations,
      },
      metricResults,
    );

    // s1 使用全局配置 threshold=10，值 7 <= 10 → PASS
    expect(report.evaluations[0]!.state).toBe('PASS');
  });

  it('不同 subject 使用不同目标配置', () => {
    const registry = makeRegistry([alwaysApplicable]);
    const engine = new EvaluationEngine({
      engine: { name: 'test', version: '1.0.0' },
      ruleRegistry: registry,
    });

    const configurations: RuleConfiguration[] = [
      {
        ruleId: 'TEST.RULE',
        ruleVersion: '1.0.0',
        values: { threshold: 5, subjectId: 's1' },
      },
      {
        ruleId: 'TEST.RULE',
        ruleVersion: '1.0.0',
        values: { threshold: 20, subjectId: 's2' },
      },
    ];

    const metricResults: MetricResult[] = [
      makeMetricResult('s1', 'AVAILABLE', 7),
      makeMetricResult('s2', 'AVAILABLE', 7),
    ];

    const report = engine.evaluate(
      {
        snapshotId: 'snap-1',
        subjects: ['s1', 's2'],
        rules: [{ id: 'TEST.RULE', version: '1.0.0' }],
        configuration: configurations,
      },
      metricResults,
    );

    // s1: threshold=5, value=7 → FAIL
    const s1Eval = report.evaluations.find((e) => e.subjectId === 's1');
    expect(s1Eval!.state).toBe('FAIL');

    // s2: threshold=20, value=7 → PASS
    const s2Eval = report.evaluations.find((e) => e.subjectId === 's2');
    expect(s2Eval!.state).toBe('PASS');
  });
});
