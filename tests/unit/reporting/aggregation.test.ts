import { describe, expect, it } from 'vitest';

import {
  aggregateDimensions,
  aggregateSummary,
  dimensionForRule,
  DimensionMappingError,
  groupFindings,
  SummaryInvariantError,
} from '@uiq/reporting';

import { makeDiagnostic, makeEvaluation, makeFinding, makeFacts, makeSnapshot } from './helpers';

describe('aggregateSummary（IMPL-17 §5）', () => {
  it('六态计数、measuredElements 去重与 findings 计数正确', () => {
    const facts = makeFacts({
      snapshot: makeSnapshot(['a', 'b', 'a']),
      metricResults: [],
      evaluations: [
        makeEvaluation({ subjectId: 'a', state: 'PASS' }),
        makeEvaluation({ subjectId: 'b', state: 'FAIL', severity: 'HIGH' }),
        makeEvaluation({ subjectId: 'a', state: 'WARN', severity: 'MEDIUM' }),
        makeEvaluation({ subjectId: 'b', state: 'UNKNOWN' }),
        makeEvaluation({ subjectId: 'a', state: 'NOT_APPLICABLE' }),
        makeEvaluation({ subjectId: 'b', state: 'ERROR' }),
      ],
      findings: [makeFinding({ id: 'f1' })],
    });
    expect(aggregateSummary(facts)).toEqual({
      measuredElements: 2,
      metricResults: 0,
      evaluations: 6,
      pass: 1,
      fail: 1,
      warn: 1,
      unknown: 1,
      notApplicable: 1,
      error: 1,
      findings: 1,
    });
  });

  it('输入顺序改变输出统计完全一致（IMPL-17 §6 确定性）', () => {
    const evaluations = [
      makeEvaluation({ subjectId: 'a', state: 'PASS' }),
      makeEvaluation({ subjectId: 'b', state: 'FAIL', severity: 'HIGH' }),
      makeEvaluation({ subjectId: 'a', state: 'PASS' }),
    ];
    const findings = [makeFinding({ id: 'f1' }), makeFinding({ id: 'f2' })];
    const forward = aggregateSummary(makeFacts({ evaluations, findings }));
    const reversed = aggregateSummary(
      makeFacts({ evaluations: [...evaluations].reverse(), findings: [...findings].reverse() }),
    );
    expect(reversed).toEqual(forward);
  });

  it('未知评价状态抛 SummaryInvariantError（六态不变式防护）', () => {
    const facts = makeFacts({
      evaluations: [
        makeEvaluation({ state: 'PASS' }),
        { ...makeEvaluation(), state: 'MAYBE' as never },
      ],
    });
    expect(() => aggregateSummary(facts)).toThrow(SummaryInvariantError);
  });
});

describe('aggregateDimensions / dimensionForRule（IMPL-17 §6 / REPORT-01 §12）', () => {
  it('规则域显式映射到维度（TOKEN → DESIGN_SYSTEM）', () => {
    expect(dimensionForRule('ACCESSIBILITY.CONTRAST.WCAG_AA')).toBe('ACCESSIBILITY');
    expect(dimensionForRule('COLOR.GAMUT')).toBe('COLOR');
    expect(dimensionForRule('TYPOGRAPHY.FONT_SIZE')).toBe('TYPOGRAPHY');
    expect(dimensionForRule('SPACING.SCALE_CONFORMANCE')).toBe('SPACING');
    expect(dimensionForRule('TOKEN.TOKEN_MATCH')).toBe('DESIGN_SYSTEM');
    expect(dimensionForRule('GEOMETRY.ALIGNMENT')).toBe('GEOMETRY');
  });

  it('未登记域抛 DimensionMappingError（不得猜测维度）', () => {
    expect(() => dimensionForRule('MYSTERY.RULE')).toThrow(DimensionMappingError);
    expect(() => dimensionForRule('MYSTERY.RULE')).toThrow(/未登记维度映射/);
  });

  it('维度聚合按评价与 Finding 计数，输出按固定维度顺序', () => {
    const facts = makeFacts({
      evaluations: [
        makeEvaluation({ subjectId: 'a', state: 'PASS' }),
        makeEvaluation({ subjectId: 'b', state: 'FAIL', severity: 'HIGH' }),
        makeEvaluation({ subjectId: 'a', state: 'PASS', ruleId: 'TOKEN.TOKEN_MATCH' }),
      ],
      findings: [makeFinding({ id: 'f1' })],
    });
    const dimensions = aggregateDimensions(facts);
    expect(dimensions.map((d) => d.dimension)).toEqual(['ACCESSIBILITY', 'DESIGN_SYSTEM']);
    expect(dimensions[0]).toMatchObject({ evaluations: 2, pass: 1, fail: 1, findings: 1 });
    expect(dimensions[1]).toMatchObject({ evaluations: 1, pass: 1, findings: 0 });
  });

  it('输入乱序维度输出逐字段相等', () => {
    const evaluations = [
      makeEvaluation({ subjectId: 'a', state: 'FAIL', severity: 'HIGH' }),
      makeEvaluation({ subjectId: 'b', state: 'PASS', ruleId: 'COLOR.GAMUT' }),
      makeEvaluation({ subjectId: 'a', state: 'PASS' }),
    ];
    const forward = aggregateDimensions(makeFacts({ evaluations }));
    const reversed = aggregateDimensions(makeFacts({ evaluations: [...evaluations].reverse() }));
    expect(reversed).toEqual(forward);
  });
});

describe('groupFindings（IMPL-17 §8 / REPORT-01 §14）', () => {
  it('37 个同 token 同失败 Finding 聚合为 1 组（RPT-003 雏形）', () => {
    const findings = Array.from({ length: 37 }, (_, i) =>
      makeFinding({
        id: `finding-${String(i).padStart(2, '0')}`,
        subjectId: `button-${i}`,
        evaluation: makeEvaluation({ subjectId: `button-${i}`, state: 'FAIL', severity: 'HIGH' }),
      }),
    );
    const diagnostics = findings.map((f, i) =>
      makeDiagnostic({ id: `diag-${i}`, findingId: f.id }),
    );
    const groups = groupFindings(findings, diagnostics);
    expect(groups).toHaveLength(1);
    const group = groups[0];
    expect(group).toBeDefined();
    expect(group?.count).toBe(37);
    expect(group?.affectedSubjects).toHaveLength(37);
    expect(group?.representativeFindingId).toBe('finding-00');
    expect(group?.ruleId).toBe('ACCESSIBILITY.CONTRAST.WCAG_AA');
  });

  it('不同 severity 分为不同组（分组键含 severity）', () => {
    const fail = makeFinding({
      id: 'f-fail',
      severity: 'HIGH',
      evaluation: makeEvaluation({ state: 'FAIL', severity: 'HIGH' }),
    });
    const warn = makeFinding({
      id: 'f-warn',
      severity: 'MEDIUM',
      evaluation: makeEvaluation({ state: 'FAIL', severity: 'MEDIUM' }),
    });
    const groups = groupFindings([fail, warn], []);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.severity).sort()).toEqual(['HIGH', 'MEDIUM']);
  });

  it('同 cause 的多诊断不改变分组；不同 cause 分组', () => {
    const f1 = makeFinding({ id: 'f1', subjectId: 'a' });
    const f2 = makeFinding({ id: 'f2', subjectId: 'b' });
    const tokenForF1 = makeDiagnostic({ id: 'd1', findingId: 'f1', cause: 'TOKEN' });
    const tokenForF2 = makeDiagnostic({ id: 'd2', findingId: 'f2', cause: 'TOKEN' });
    const configForF2 = makeDiagnostic({ id: 'd3', findingId: 'f2', cause: 'CONFIGURATION' });
    expect(groupFindings([f1, f2], [tokenForF1, tokenForF2])).toHaveLength(1);
    expect(groupFindings([f1, f2], [tokenForF1, configForF2])).toHaveLength(2);
  });

  it('组 ID 稳定（同事实同 ID）', () => {
    const build = () =>
      groupFindings(
        [makeFinding({ id: 'f1', subjectId: 'a' })],
        [makeDiagnostic({ id: 'd1', findingId: 'f1', cause: 'TOKEN' })],
      )[0]?.id;
    expect(build()).toBe(build());
  });
});
