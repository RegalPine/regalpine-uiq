import { describe, expect, it } from 'vitest';
import type { MetricResult, RuleDefinition } from '@uiq/core';
import { EvaluationEngine, createDefaultRuleRegistry } from '@uiq/rules';

function makeMetricResult(
  subjectId: string,
  metricId: string,
  value: unknown,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): MetricResult {
  return {
    metricId,
    metricVersion: '1.0.0',
    subjectId,
    status,
    value,
    dependencies: [],
    fingerprint: '',
  };
}

describe('EvaluationEngine', () => {
  const engine = new EvaluationEngine({
    engine: { name: 'test', version: '1.0.0' },
    ruleRegistry: createDefaultRuleRegistry(),
  });

  describe('PASS', () => {
    it('对比度 >= 4.5 通过', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7.1 })],
      );
      expect(report.evaluations).toHaveLength(1);
      expect(report.evaluations[0]!.state).toBe('PASS');
    });
  });

  describe('FAIL', () => {
    it('对比度 < 4.5 失败', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 3.2 })],
      );
      expect(report.evaluations[0]!.state).toBe('FAIL');
    });

    it('FAIL 生成 Finding', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 3.2 })],
      );
      expect(report.findings).toHaveLength(1);
      expect(report.findings[0]!.state).toBe('DETECTED');
      expect(report.findings[0]!.severity).toBe('HIGH');
    });
  });

  describe('WARN', () => {
    it('对比度在 4.5 和 5.0 之间得到 WARN', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.6 })],
      );
      expect(report.evaluations[0]!.state).toBe('WARN');
    });
  });

  describe('UNKNOWN', () => {
    it('Metric 缺失时为 UNKNOWN', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [],
      );
      expect(report.evaluations[0]!.state).toBe('UNKNOWN');
    });

    it('Metric 状态为 UNKNOWN 时结果为 UNKNOWN', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', undefined, 'UNKNOWN')],
      );
      expect(report.evaluations[0]!.state).toBe('UNKNOWN');
    });

    it('UNKNOWN 不生成 Finding', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [],
      );
      expect(report.findings).toHaveLength(0);
    });
  });

  describe('ERROR', () => {
    it('Rule 不存在时为 ERROR', () => {
      const report = engine.evaluate(
        { snapshotId: 's1', subjects: ['el-1'], rules: [{ id: 'NONEXISTENT', version: '1.0.0' }] },
        [],
      );
      expect(report.evaluations[0]!.state).toBe('ERROR');
    });

    it('ERROR 生成 Finding', () => {
      const report = engine.evaluate(
        { snapshotId: 's1', subjects: ['el-1'], rules: [{ id: 'NONEXISTENT', version: '1.0.0' }] },
        [],
      );
      expect(report.findings).toHaveLength(1);
      expect(report.findings[0]!.type).toBe('EXECUTION_ERROR');
    });
  });

  describe('NOT_APPLICABLE', () => {
    it('不适用规则返回 NOT_APPLICABLE', () => {
      const alwaysNA: RuleDefinition = {
        id: 'TEST.NA',
        version: '1.0.0',
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        operator: 'GTE',
        threshold: 4.5,
        severity: 'LOW',
        applicability: { evaluate: () => 'NOT_APPLICABLE' },
      };
      const registry = createDefaultRuleRegistry();
      registry.register(alwaysNA);
      const eng = new EvaluationEngine({
        engine: { name: 'test', version: '1.0.0' },
        ruleRegistry: registry,
      });
      const report = eng.evaluate(
        { snapshotId: 's1', subjects: ['el-1'], rules: [{ id: 'TEST.NA', version: '1.0.0' }] },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7 })],
      );
      expect(report.evaluations[0]!.state).toBe('NOT_APPLICABLE');
    });

    it('NOT_APPLICABLE 不生成 Finding', () => {
      const alwaysNA: RuleDefinition = {
        id: 'TEST.NA2',
        version: '1.0.0',
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        operator: 'GTE',
        threshold: 4.5,
        severity: 'LOW',
        applicability: { evaluate: () => 'NOT_APPLICABLE' },
      };
      const registry = createDefaultRuleRegistry();
      registry.register(alwaysNA);
      const eng = new EvaluationEngine({
        engine: { name: 'test', version: '1.0.0' },
        ruleRegistry: registry,
      });
      const report = eng.evaluate(
        { snapshotId: 's1', subjects: ['el-1'], rules: [{ id: 'TEST.NA2', version: '1.0.0' }] },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7 })],
      );
      expect(report.findings).toHaveLength(0);
    });
  });

  describe('确定性', () => {
    it('相同输入产生相同输出', () => {
      const request = {
        snapshotId: 's1',
        subjects: ['el-1'],
        rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
      };
      const metrics = [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 3.2 })];
      const r1 = engine.evaluate(request, metrics);
      const r2 = engine.evaluate(request, metrics);
      expect(r1.evaluations[0]!.fingerprint).toBe(r2.evaluations[0]!.fingerprint);
      expect(r1.evaluations[0]!.state).toBe(r2.evaluations[0]!.state);
    });
  });

  describe('多 subject × 多 rule', () => {
    it('结果按 subjectId → ruleId 排序', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['b', 'a'],
          rules: [
            { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
            { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
          ],
        },
        [
          makeMetricResult('a', 'COLOR.CONTRAST', { ratio: 7 }),
          makeMetricResult('a', 'TYPOGRAPHY.FONT_SIZE', 16),
          makeMetricResult('b', 'COLOR.CONTRAST', { ratio: 3 }),
          makeMetricResult('b', 'TYPOGRAPHY.FONT_SIZE', 10),
        ],
      );
      expect(report.evaluations).toHaveLength(4);
      expect(report.evaluations[0]!.subjectId).toBe('a');
      expect(report.evaluations[1]!.subjectId).toBe('a');
      expect(report.evaluations[2]!.subjectId).toBe('b');
      expect(report.evaluations[3]!.subjectId).toBe('b');
    });
  });

  describe('Summary', () => {
    it('六态统计正确', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [
            { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
            { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
          ],
        },
        [
          makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7 }),
          makeMetricResult('el-1', 'TYPOGRAPHY.FONT_SIZE', 10),
        ],
      );
      expect(report.summary.total).toBe(2);
      expect(
        report.summary.pass +
          report.summary.fail +
          report.summary.warn +
          report.summary.notApplicable +
          report.summary.unknown +
          report.summary.error,
      ).toBe(2);
    });
  });

  describe('valueKey 数值提取', () => {
    it('对象值按 valueKey 提取后参与比较', () => {
      // CONTRAST_WCAG_AA 声明 valueKey: 'ratio'，对象 { ratio } 可正常求值
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7.1 })],
      );
      expect(report.evaluations[0]!.state).toBe('PASS');
    });

    it('对象缺少声明字段时为 ERROR', () => {
      const report = engine.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { other: 7.1 })],
      );
      expect(report.evaluations[0]!.state).toBe('ERROR');
      expect(report.evaluations[0]!.message).toContain('类型与操作符不匹配');
    });
  });

  describe('Tolerance', () => {
    it('ABSOLUTE 容差降低有效阈值', () => {
      const tolerantRule: RuleDefinition = {
        id: 'TEST.TOLERANT',
        version: '1.0.0',
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        operator: 'GTE',
        threshold: 4.5,
        severity: 'LOW',
        tolerance: { type: 'ABSOLUTE', value: 0.1 },
        applicability: { evaluate: () => 'APPLICABLE' },
      };
      const registry = createDefaultRuleRegistry();
      registry.register(tolerantRule);
      const eng = new EvaluationEngine({
        engine: { name: 'test', version: '1.0.0' },
        ruleRegistry: registry,
      });
      // 4.45 < 4.5 但 >= 4.5 - 0.1 → PASS
      const report = eng.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [{ id: 'TEST.TOLERANT', version: '1.0.0' }],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', 4.45)],
      );
      expect(report.evaluations[0]!.state).toBe('PASS');
    });
  });

  describe('错误隔离', () => {
    it('单 Rule 异常不影响其他 Rule', () => {
      const throwingRule: RuleDefinition = {
        id: 'TEST.THROW',
        version: '1.0.0',
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        operator: 'GTE',
        threshold: 4.5,
        severity: 'LOW',
        applicability: {
          evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
            throw new Error('boom');
          },
        },
      };
      const registry = createDefaultRuleRegistry();
      registry.register(throwingRule);
      const eng = new EvaluationEngine({
        engine: { name: 'test', version: '1.0.0' },
        ruleRegistry: registry,
      });
      const report = eng.evaluate(
        {
          snapshotId: 's1',
          subjects: ['el-1'],
          rules: [
            { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
            { id: 'TEST.THROW', version: '1.0.0' },
          ],
        },
        [makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 7 })],
      );
      const contrast = report.evaluations.find(
        (e) => e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      );
      const thrown = report.evaluations.find((e) => e.ruleId === 'TEST.THROW');
      expect(contrast!.state).toBe('PASS');
      expect(thrown!.state).toBe('ERROR');
    });
  });
});
