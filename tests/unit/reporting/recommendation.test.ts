import { describe, expect, it } from 'vitest';

import {
  initialRecommendationRules,
  RecommendationRuleRegistry,
  RecommendationRuleRegistryError,
  recommend,
  type RecommendationContext,
  type RecommendationRule,
} from '@uiq/reporting';
import type { Finding, TokenBinding } from '@uiq/core';

import { makeDiagnostic, makeEvaluation, makeFinding, makeMetric } from './helpers';

function contextFrom(parts: {
  findings?: readonly Finding[];
  tokenBindings?: readonly TokenBinding[];
  themes?: readonly { id: string; name: string }[];
  evaluations?: Parameters<typeof makeEvaluation>[0][];
}): RecommendationContext {
  const evaluations =
    parts.evaluations?.map((o) => makeEvaluation(o)) ??
    parts.findings?.map((f) => f.evaluation) ??
    [];
  return {
    findings: parts.findings ?? [],
    diagnostics: (parts.findings ?? []).map((f, i) =>
      makeDiagnostic({ id: `diag-${i}`, findingId: f.id, cause: 'TOKEN' }),
    ),
    evaluations,
    metrics: evaluations.map((e) => e.metricResult),
    ...(parts.tokenBindings !== undefined ? { tokenBindings: parts.tokenBindings } : {}),
    ...(parts.themes !== undefined ? { themes: parts.themes } : {}),
  };
}

function registryWithInitial(): RecommendationRuleRegistry {
  const registry = new RecommendationRuleRegistry();
  for (const rule of initialRecommendationRules()) registry.register(rule);
  return registry;
}

const buttonBinding: TokenBinding = {
  subjectId: 'button.primary',
  tokenId: 'token.semantic.color.primary',
  bindingType: 'EXPLICIT',
  confidence: 'DIRECT',
};

describe('RecommendationRuleRegistry（IMPL-17 §15）', () => {
  it('精确 id+version 寻址；latest 不存在', () => {
    const registry = registryWithInitial();
    expect(registry.get('REC-ACCESSIBILITY-001', '1.0.0').id).toBe('REC-ACCESSIBILITY-001');
    // get 签名强制双参，无 latest 回退：未注册版本抛错。
    expect(() => registry.get('REC-ACCESSIBILITY-001', '2.0.0')).toThrow(
      RecommendationRuleRegistryError,
    );
  });

  it('重复注册抛错；list 稳定排序', () => {
    const registry = registryWithInitial();
    expect(() => registry.register(initialRecommendationRules()[0]!)).toThrow(/重复注册/);
    const ids = registry.list().map((r) => `${r.id}@${r.version}`);
    expect(ids).toEqual([...ids].sort());
    expect(registry.list()).toHaveLength(8);
  });
});

describe('recommend（IMPL-17 §12/§17-24）', () => {
  it('RPT-002：单按钮 WCAG FAIL → 1 建议 + 1 验证条件', () => {
    const finding = makeFinding({
      id: 'f1',
      subjectId: 'button.primary',
      evaluation: makeEvaluation({ subjectId: 'button.primary', state: 'FAIL', severity: 'HIGH' }),
    });
    const recommendations = recommend(contextFrom({ findings: [finding] }), registryWithInitial());
    expect(recommendations).toHaveLength(1);
    const rec = recommendations[0];
    expect(rec).toMatchObject({
      type: 'REVIEW_ACCESSIBILITY',
      dimension: 'ACCESSIBILITY',
      targetType: 'ELEMENT',
      targetIds: ['button.primary'],
      rationale: 'Review accessibility color relationship.',
    });
    expect(rec?.verification).toHaveLength(1);
    expect(rec?.verification[0]).toMatchObject({
      metricId: 'COLOR.CONTRAST',
      metricVersion: '1.0.0',
      ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      ruleVersion: '1.0.0',
      expectedState: 'PASS',
    });
    expect(rec?.affectedFindingIds).toEqual(['f1']);
  });

  it('Token Trace 存在时升级为 token 映射建议并收敛到 TOKEN 目标（§17）', () => {
    const finding = makeFinding({
      id: 'f1',
      subjectId: 'button.primary',
      evaluation: makeEvaluation({ subjectId: 'button.primary', state: 'FAIL', severity: 'HIGH' }),
    });
    const recommendations = recommend(
      contextFrom({ findings: [finding], tokenBindings: [buttonBinding] }),
      registryWithInitial(),
    );
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      targetType: 'TOKEN',
      targetIds: ['token.semantic.color.primary'],
      rationale: 'Review semantic/component color token mapping.',
    });
  });

  it('RPT-003：37 个同 token 同失败 → 1 建议，affectedFindingIds=37，affectedElements=37', () => {
    const findings = Array.from({ length: 37 }, (_, i) =>
      makeFinding({
        id: `finding-${String(i).padStart(2, '0')}`,
        subjectId: `button-${i}`,
        evaluation: makeEvaluation({ subjectId: `button-${i}`, state: 'FAIL', severity: 'HIGH' }),
      }),
    );
    const bindings: TokenBinding[] = findings.map((f) => ({
      subjectId: f.subjectId,
      tokenId: 'token.semantic.color.primary',
      bindingType: 'EXPLICIT',
      confidence: 'DIRECT',
    }));
    const recommendations = recommend(
      contextFrom({ findings, tokenBindings: bindings }),
      registryWithInitial(),
    );
    expect(recommendations).toHaveLength(1);
    const rec = recommendations[0];
    expect(rec?.affectedFindingIds).toHaveLength(37);
    expect(rec?.impact.affectedElements).toBe(37);
    expect(rec?.targetType).toBe('TOKEN');
    expect(rec?.targetIds).toEqual(['token.semantic.color.primary']);
  });

  it('RPT-004：UNKNOWN 评价 → REVIEW_MEASUREMENT，不转 FAIL', () => {
    const recommendations = recommend(
      contextFrom({
        evaluations: [{ subjectId: 'card.gradient', state: 'UNKNOWN', severity: 'INFO' }],
        findings: [],
      }),
      registryWithInitial(),
    );
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      type: 'REVIEW_MEASUREMENT',
      targetIds: ['card.gradient'],
      rationale: 'Review measurement coverage or provide a supported background representation.',
    });
  });

  it('RPT-005：Token Deviation FAIL + Accessibility PASS → 仅 DESIGN_SYSTEM 建议', () => {
    const deviation = makeFinding({
      id: 'f-dev',
      type: 'TOKEN_DEVIATION',
      subjectId: 'button.primary',
      evaluation: makeEvaluation({
        subjectId: 'button.primary',
        ruleId: 'TOKEN.TOKEN_DEVIATION',
        state: 'FAIL',
        severity: 'MEDIUM',
        metricResult: makeMetric({ metricId: 'TOKEN.DEVIATION', value: '13px' }),
      }),
    });
    const pass = makeFinding({
      id: 'f-pass',
      evaluation: makeEvaluation({ subjectId: 'button.primary', state: 'PASS' }),
    });
    const recommendations = recommend(
      contextFrom({ findings: [deviation, pass] }),
      registryWithInitial(),
    );
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toMatchObject({
      type: 'REVIEW_TOKEN',
      dimension: 'DESIGN_SYSTEM',
      rationale: 'Review deviation between rendered value and declared design token.',
    });
  });

  it('REC-COLOR-001 不产生替换色值文本（§18）', () => {
    const finding = makeFinding({
      id: 'f-gamut',
      type: 'COLOR',
      evaluation: makeEvaluation({
        subjectId: 'swatch.1',
        ruleId: 'COLOR.GAMUT',
        state: 'FAIL',
        severity: 'LOW',
        metricResult: makeMetric({ metricId: 'COLOR.GAMUT' }),
      }),
    });
    const recommendations = recommend(contextFrom({ findings: [finding] }), registryWithInitial());
    const text = recommendations.map((r) => `${r.title} ${r.rationale}`).join(' ');
    expect(text).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(recommendations[0]).toMatchObject({
      rationale: 'Review color gamut compatibility for the target rendering space.',
    });
  });

  it('REC-THEME-001：每主题独立建议（主题不平均，§23）', () => {
    const finding = makeFinding({
      id: 'f-token',
      type: 'TOKEN_DEVIATION',
      evaluation: makeEvaluation({
        subjectId: 'button.primary',
        ruleId: 'TOKEN.TOKEN_MATCH',
        state: 'FAIL',
        severity: 'MEDIUM',
        metricResult: makeMetric({ metricId: 'TOKEN.MATCH' }),
      }),
    });
    const recommendations = recommend(
      contextFrom({
        findings: [finding],
        themes: [
          { id: 'theme.light', name: 'Light' },
          { id: 'theme.dark', name: 'Dark' },
        ],
      }),
      registryWithInitial(),
    );
    const themeRecs = recommendations.filter((r) => r.type === 'REVIEW_THEME');
    expect(themeRecs).toHaveLength(2);
    expect(themeRecs.map((r) => r.targetIds[0])).toEqual(['theme.dark', 'theme.light']); // targetIds 排序
    expect(themeRecs.map((r) => r.rationale).sort()).toEqual([
      'Review Dark theme semantic token mapping.',
      'Review Light theme semantic token mapping.',
    ]);
  });

  it('无匹配时返回空数组；PASS finding 不产生建议', () => {
    const pass = makeFinding({ id: 'f-pass', evaluation: makeEvaluation({ state: 'PASS' }) });
    expect(recommend(contextFrom({ findings: [pass] }), registryWithInitial())).toEqual([]);
    expect(
      recommend(contextFrom({ findings: [], evaluations: [] }), registryWithInitial()),
    ).toEqual([]);
  });

  it('同输入乱序生成等价建议集合（确定性，§34）', () => {
    const findings = [
      makeFinding({
        id: 'f1',
        subjectId: 'a',
        evaluation: makeEvaluation({ subjectId: 'a', state: 'FAIL', severity: 'HIGH' }),
      }),
      makeFinding({
        id: 'f2',
        subjectId: 'b',
        evaluation: makeEvaluation({ subjectId: 'b', state: 'FAIL', severity: 'HIGH' }),
      }),
      makeFinding({
        id: 'f3',
        subjectId: 'c',
        evaluation: makeEvaluation({
          subjectId: 'c',
          ruleId: 'COLOR.GAMUT',
          state: 'FAIL',
          severity: 'LOW',
          metricResult: makeMetric({ metricId: 'COLOR.GAMUT' }),
        }),
      }),
    ];
    const forward = recommend(contextFrom({ findings }), registryWithInitial());
    const reversed = recommend(
      contextFrom({ findings: [...findings].reverse() }),
      registryWithInitial(),
    );
    expect(reversed).toEqual(forward);
  });

  it('REC ID 稳定（同事实同 ID，§26）', () => {
    const build = () => {
      const finding = makeFinding({
        id: 'f1',
        evaluation: makeEvaluation({ state: 'FAIL', severity: 'HIGH' }),
      });
      return recommend(contextFrom({ findings: [finding] }), registryWithInitial())[0]?.id;
    };
    expect(build()).toBe(build());
    expect(build()).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('自定义规则注册（§14）', () => {
  it('自定义规则参与引擎执行', () => {
    const custom: RecommendationRule = {
      id: 'REC-CUSTOM-001',
      version: '1.0.0',
      matches: () => true,
      generate: () => [
        {
          type: 'REVIEW_METRIC',
          title: 'Custom',
          dimension: 'CONFORMANCE',
          targetType: 'ELEMENT',
          targetIds: ['x'],
          rationale: 'Review custom condition.',
          evidence: [],
          verification: [],
          affectedFindingIds: [],
        },
      ],
    };
    const registry = registryWithInitial();
    registry.register(custom);
    const recommendations = recommend(contextFrom({ findings: [], evaluations: [] }), registry);
    expect(recommendations.map((r) => r.type)).toContain('REVIEW_METRIC');
  });
});
