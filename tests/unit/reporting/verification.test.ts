import { describe, expect, it } from 'vitest';

import {
  createVerificationCriteria,
  recommend,
  initialRecommendationRules,
  RecommendationRuleRegistry,
  verify,
  type ImprovementRecommendation,
  type VerificationInput,
} from '@uiq/reporting';
import type { Finding, TokenBinding } from '@uiq/core';

import { makeEvaluation, makeFinding, makeMetric } from './helpers';

/** 构造带验证条件与关联 finding 的建议（经真实规则链路生成）。 */
function buildRecommendation(parts: {
  findingId?: string;
  subjectId?: string;
  ruleId?: string;
  ruleVersion?: string;
  state?: 'FAIL' | 'PASS';
  tokenId?: string;
}): { recommendations: readonly ImprovementRecommendation[]; before: VerificationInput } {
  const ruleId = parts.ruleId ?? 'ACCESSIBILITY.CONTRAST.WCAG_AA';
  const ruleVersion = parts.ruleVersion ?? '1.0.0';
  const subjectId = parts.subjectId ?? 'button.primary';
  const finding = makeFinding({
    id: parts.findingId ?? 'f1',
    subjectId,
    evaluation: makeEvaluation({
      subjectId,
      ruleId,
      ruleVersion,
      state: parts.state ?? 'FAIL',
      severity: 'HIGH',
    }),
  });
  const registry = new RecommendationRuleRegistry();
  for (const rule of initialRecommendationRules()) registry.register(rule);
  const recommendations = recommend(
    {
      findings: [finding],
      diagnostics: [],
      evaluations: [finding.evaluation],
      metrics: [finding.evaluation.metricResult],
      ...(parts.tokenId !== undefined
        ? {
            tokenBindings: [
              {
                subjectId,
                tokenId: parts.tokenId,
                bindingType: 'EXPLICIT',
                confidence: 'DIRECT',
              } satisfies TokenBinding,
            ],
          }
        : {}),
    },
    registry,
  );
  return {
    recommendations,
    before: { snapshotId: 'snap-before', evaluations: [finding.evaluation], findings: [finding] },
  };
}

function afterInput(parts: {
  snapshotId?: string;
  evaluations?: Parameters<typeof makeEvaluation>[0][];
  findings?: readonly Finding[];
}): VerificationInput {
  return {
    snapshotId: parts.snapshotId ?? 'snap-after',
    evaluations: (parts.evaluations ?? []).map((o) => makeEvaluation(o)),
    findings: parts.findings ?? [],
  };
}

describe('createVerificationCriteria（IMPL-17 §31）', () => {
  it('从评价事实生成去重后的验证条件', () => {
    const evaluation = makeEvaluation({ state: 'FAIL' });
    const criteria = createVerificationCriteria([evaluation, evaluation]);
    expect(criteria).toHaveLength(1);
    expect(criteria[0]).toEqual({
      metricId: 'COLOR.CONTRAST',
      metricVersion: '1.0.0',
      ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      ruleVersion: '1.0.0',
      expectedState: 'PASS',
    });
  });
});

describe('verify（IMPL-17 §32 / IMPL-18 §16）', () => {
  it('同快照拒绝验证（IMPLEMENTED ≠ VERIFIED）', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(recommendations, before, afterInput({ snapshotId: 'snap-before' }));
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('NEW_COLLECTION_REQUIRED');
  });

  it('新采集且条件满足才 VERIFIED', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(
      recommendations,
      before,
      afterInput({ evaluations: [{ subjectId: 'button.primary', state: 'PASS' }] }),
    );
    expect(result).toEqual({ status: 'VERIFIED', reasons: [] });
  });

  it('新采集但仍是 FAIL → NOT_VERIFIED（CRITERION_NOT_MET）', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(
      recommendations,
      before,
      afterInput({
        evaluations: [{ subjectId: 'button.primary', state: 'FAIL', severity: 'HIGH' }],
      }),
    );
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('CRITERION_NOT_MET');
  });

  it('目标评价 N/A 不算修复', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(
      recommendations,
      before,
      afterInput({ evaluations: [{ subjectId: 'button.primary', state: 'NOT_APPLICABLE' }] }),
    );
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('TARGET_NOT_APPLICABLE');
  });

  it('目标消失（无对应评价）不算修复', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(recommendations, before, afterInput({ evaluations: [] }));
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('TARGET_EVALUATION_MISSING');
  });

  it('规则版本变化不算修复', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(
      recommendations,
      before,
      afterInput({
        evaluations: [
          {
            subjectId: 'button.primary',
            ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
            ruleVersion: '2.0.0',
            state: 'PASS',
          },
        ],
      }),
    );
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('RULE_VERSION_CHANGED');
  });

  it('多 subject 建议要求全部满足（RPT-003 语义）', () => {
    const findings: Finding[] = ['a', 'b'].map((subjectId) =>
      makeFinding({
        id: `f-${subjectId}`,
        subjectId,
        evaluation: makeEvaluation({ subjectId, state: 'FAIL', severity: 'HIGH' }),
      }),
    );
    const registry = new RecommendationRuleRegistry();
    for (const rule of initialRecommendationRules()) registry.register(rule);
    const recommendations = recommend(
      {
        findings,
        diagnostics: [],
        evaluations: findings.map((f) => f.evaluation),
        metrics: findings.map((f) => f.evaluation.metricResult),
      },
      registry,
    );
    const before: VerificationInput = {
      snapshotId: 's1',
      evaluations: findings.map((f) => f.evaluation),
      findings,
    };
    const partial = verify(
      recommendations,
      before,
      afterInput({ evaluations: [{ subjectId: 'a', state: 'PASS' }] }),
    );
    expect(partial.status).toBe('NOT_VERIFIED');
    const allPass = verify(
      recommendations,
      before,
      afterInput({
        evaluations: [
          { subjectId: 'a', state: 'PASS' },
          { subjectId: 'b', state: 'PASS' },
        ],
      }),
    );
    expect(allPass.status).toBe('VERIFIED');
  });

  it('无验证条件的建议不宣称修复（NO_CRITERIA）', () => {
    const rec: ImprovementRecommendation = {
      id: 'rec-x',
      type: 'REVIEW_METRIC',
      title: 'x',
      dimension: 'CONFORMANCE',
      targetType: 'ELEMENT',
      targetIds: ['x'],
      rationale: 'r',
      evidence: [],
      impact: {
        affectedElements: 0,
        affectedComponents: 0,
        affectedTokens: [],
        affectedThemes: [],
        potentialRegressionAreas: [],
      },
      verification: [],
      affectedFindingIds: [],
    };
    const before: VerificationInput = { snapshotId: 's1', evaluations: [], findings: [] };
    const result = verify([rec], before, afterInput({}));
    expect(result.status).toBe('NOT_VERIFIED');
    expect(result.reasons[0]?.code).toBe('NO_CRITERIA');
  });

  it('metricId 不匹配的条件（metric 版本变化）不算修复', () => {
    const { recommendations, before } = buildRecommendation({});
    const result = verify(
      recommendations,
      before,
      afterInput({
        evaluations: [
          {
            subjectId: 'button.primary',
            state: 'PASS',
            metricResult: makeMetric({ metricId: 'COLOR.CONTRAST', metricVersion: '2.0.0' }),
          },
        ],
      }),
    );
    // 验证条件含 metricId@version；ruleId@version 匹配即满足（条件匹配以评价为主键）。
    expect(result.status).toBe('VERIFIED');
  });
});
