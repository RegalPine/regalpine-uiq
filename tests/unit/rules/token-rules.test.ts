import { describe, expect, it } from 'vitest';
import { DefaultRuleRegistry } from '@uiq/core';
import type { ComponentContract, MetricResult } from '@uiq/core';
import { EvaluationEngine, createComponentConformanceRule, createTokenMatchRule } from '@uiq/rules';

const engine = () =>
  new EvaluationEngine({
    engine: { name: 'test-engine', version: '1.0.0' },
    ruleRegistry: registry(),
  });

function registry() {
  const registry = new DefaultRuleRegistry();
  registry.register(createTokenMatchRule());
  registry.register(createComponentConformanceRule({ contract, subjectIdByToken }));
  return registry;
}

const contract: ComponentContract = {
  id: 'contract.button',
  version: '1.0.0',
  requiredTokens: ['button.primary.background', 'button.primary.foreground'],
};
const subjectIdByToken = {
  'button.primary.background': 'el.button.bg',
  'button.primary.foreground': 'el.button.fg',
};

const TOKEN_MATCH_RULE = { id: 'TOKEN.TOKEN_MATCH', version: '1.0.0' };
const CONFORMANCE_RULE = { id: 'TOKEN.COMPONENT_CONFORMANCE', version: '1.0.0' };

function matchResult(
  subjectId: string,
  result: 'MATCH' | 'NO_MATCH' | 'UNKNOWN',
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): MetricResult {
  return {
    metricId: 'TOKEN.MATCH',
    metricVersion: '1.0.0',
    subjectId,
    status,
    ...(status === 'AVAILABLE' ? { value: { result } } : {}),
    dependencies: [],
    fingerprint: 'b'.repeat(64),
  };
}

function evaluateOne(
  subjectId: string,
  rule: { id: string; version: string },
  metricResults: readonly MetricResult[],
) {
  const report = engine().evaluate(
    { snapshotId: 'snap', subjects: [subjectId], rules: [rule], configuration: [] },
    metricResults,
  );
  return report.evaluations[0]!;
}

describe('TOKEN.TOKEN_MATCH@1.0.0（ER-02 §59：EQ MATCH，NO_MATCH → FAIL，UNKNOWN 保持）', () => {
  it('MATCH → PASS', () => {
    const result = evaluateOne('el.button.bg', TOKEN_MATCH_RULE, [
      matchResult('el.button.bg', 'MATCH'),
    ]);
    expect(result.state).toBe('PASS');
    expect(result.severity).toBe('MEDIUM');
  });

  it('NO_MATCH → FAIL（message 保留值事实）', () => {
    const result = evaluateOne('el.button.bg', TOKEN_MATCH_RULE, [
      matchResult('el.button.bg', 'NO_MATCH'),
    ]);
    expect(result.state).toBe('FAIL');
    expect(result.message).toContain('NO_MATCH');
  });

  it('metric UNKNOWN → UNKNOWN（六态传播）', () => {
    const result = evaluateOne('el.button.bg', TOKEN_MATCH_RULE, [
      matchResult('el.button.bg', 'UNKNOWN', 'UNKNOWN'),
    ]);
    expect(result.state).toBe('UNKNOWN');
  });

  it('metric 结果缺失 → UNKNOWN', () => {
    const result = evaluateOne('el.button.bg', TOKEN_MATCH_RULE, []);
    expect(result.state).toBe('UNKNOWN');
  });

  it('value.result 缺失（类型不匹配）→ ERROR', () => {
    const broken: MetricResult = {
      metricId: 'TOKEN.MATCH',
      metricVersion: '1.0.0',
      subjectId: 'el.button.bg',
      status: 'AVAILABLE',
      value: {},
      dependencies: [],
      fingerprint: 'b'.repeat(64),
    };
    const result = evaluateOne('el.button.bg', TOKEN_MATCH_RULE, [broken]);
    expect(result.state).toBe('ERROR');
  });
});

describe('TOKEN.COMPONENT_CONFORMANCE@1.0.0（ER-02 §60、IMPL-09 §47）', () => {
  it('全部 required MATCH → PASS，聚合事实完整', () => {
    const result = evaluateOne('contract.button', CONFORMANCE_RULE, [
      matchResult('el.button.bg', 'MATCH'),
      matchResult('el.button.fg', 'MATCH'),
    ]);
    expect(result.state).toBe('PASS');
    const aggregate = result.metricResult.value as { requiredTotal: number; matched: number };
    expect(aggregate.requiredTotal).toBe(2);
    expect(aggregate.matched).toBe(2);
    // 聚合事实有真实指纹（64 hex）。
    expect(result.metricResult.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    // evidence 保留契约与 metric 两个来源。
    expect(result.evidence.map((e) => e.type).sort()).toEqual(['METRIC', 'RULE_CONFIGURATION']);
  });

  it('个别 NO_MATCH → FAIL（TOKEN_MATCH 大部分 PASS ≠ 契约满足）', () => {
    const result = evaluateOne('contract.button', CONFORMANCE_RULE, [
      matchResult('el.button.bg', 'MATCH'),
      matchResult('el.button.fg', 'NO_MATCH'),
    ]);
    expect(result.state).toBe('FAIL');
    expect(result.message).toContain('未匹配');
    const aggregate = result.metricResult.value as { noMatch: number; matched: number };
    expect(aggregate.noMatch).toBe(1);
    expect(aggregate.matched).toBe(1);
  });

  it('tokenId 无 subject 映射 → FAIL（missing）', () => {
    const partial = createComponentConformanceRule({
      contract: {
        ...contract,
        requiredTokens: ['button.primary.background', 'button.ghost.border'],
      },
      subjectIdByToken,
    });
    const r = new DefaultRuleRegistry();
    r.register(partial);
    const report = new EvaluationEngine({
      engine: { name: 't', version: '1.0.0' },
      ruleRegistry: r,
    }).evaluate(
      {
        snapshotId: 'snap',
        subjects: ['contract.button'],
        rules: [CONFORMANCE_RULE],
        configuration: [],
      },
      [matchResult('el.button.bg', 'MATCH')],
    );
    const result = report.evaluations[0]!;
    expect(result.state).toBe('FAIL');
    expect(result.message).toContain('缺失');
    const aggregate = result.metricResult.value as { missing: number };
    expect(aggregate.missing).toBe(1);
  });

  it('映射存在但 metric 结果缺失 → FAIL（missing）', () => {
    const result = evaluateOne('contract.button', CONFORMANCE_RULE, [
      matchResult('el.button.bg', 'MATCH'),
    ]);
    expect(result.state).toBe('FAIL');
    const aggregate = result.metricResult.value as { missing: number };
    expect(aggregate.missing).toBe(1);
  });

  it('匹配结果 UNKNOWN → UNKNOWN（有未知且无明确 FAIL）', () => {
    const result = evaluateOne('contract.button', CONFORMANCE_RULE, [
      matchResult('el.button.bg', 'MATCH'),
      matchResult('el.button.fg', 'UNKNOWN'),
    ]);
    expect(result.state).toBe('UNKNOWN');
    const aggregate = result.metricResult.value as { unresolved: number };
    expect(aggregate.unresolved).toBe(1);
  });

  it('requiredTokens 为空 → NOT_APPLICABLE；其他 subject → NOT_APPLICABLE', () => {
    const empty = createComponentConformanceRule({
      contract: { ...contract, requiredTokens: [] },
      subjectIdByToken: {},
    });
    const r = new DefaultRuleRegistry();
    r.register(empty);
    const report = new EvaluationEngine({
      engine: { name: 't', version: '1.0.0' },
      ruleRegistry: r,
    }).evaluate(
      {
        snapshotId: 'snap',
        subjects: ['contract.button'],
        rules: [CONFORMANCE_RULE],
        configuration: [],
      },
      [],
    );
    expect(report.evaluations[0]!.state).toBe('NOT_APPLICABLE');

    const other = evaluateOne('el.button.bg', CONFORMANCE_RULE, [
      matchResult('el.button.bg', 'MATCH'),
    ]);
    expect(other.state).toBe('NOT_APPLICABLE');
  });

  it('customEvaluate 抛异常 → ERROR（引擎隔离）', () => {
    const throwing = {
      ...createComponentConformanceRule({ contract, subjectIdByToken }),
      customEvaluate: () => {
        throw new Error('聚合故障');
      },
    };
    const r = new DefaultRuleRegistry();
    r.register(throwing);
    const report = new EvaluationEngine({
      engine: { name: 't', version: '1.0.0' },
      ruleRegistry: r,
    }).evaluate(
      {
        snapshotId: 'snap',
        subjects: ['contract.button'],
        rules: [CONFORMANCE_RULE],
        configuration: [],
      },
      [matchResult('el.button.bg', 'MATCH')],
    );
    expect(report.evaluations[0]!.state).toBe('ERROR');
  });
});
