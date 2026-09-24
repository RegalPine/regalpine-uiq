import { describe, expect, it } from 'vitest';

import { calculateImpact, linkDiagnostics, toDiagnosticSummaries } from '@uiq/reporting';

import { makeDiagnostic, makeFinding, makeFacts } from './helpers';

describe('linkDiagnostics（IMPL-17 §33 / AC-RPT-05）', () => {
  it('按 findingId 关联并排序去重诊断 ID', () => {
    const f1 = makeFinding({ id: 'f1' });
    const facts = makeFacts({
      findings: [f1],
      diagnostics: [
        makeDiagnostic({ id: 'd2', findingId: 'f1' }),
        makeDiagnostic({ id: 'd1', findingId: 'f1', cause: 'MEASUREMENT' }),
      ],
    });
    const linked = linkDiagnostics(facts);
    expect(linked.get('f1')).toEqual(['d1', 'd2']);
  });

  it('孤儿诊断（findingId 不存在）不挂到任何 finding，但不影响诊断投影本身', () => {
    const f1 = makeFinding({ id: 'f1' });
    const orphan = makeDiagnostic({ id: 'd-orphan', findingId: 'ghost-finding' });
    const facts = makeFacts({ findings: [f1], diagnostics: [orphan] });
    expect(linkDiagnostics(facts).get('f1')).toBeUndefined();
    expect(toDiagnosticSummaries(facts).map((d) => d.id)).toContain('d-orphan');
  });

  it('输入顺序不影响关联结果', () => {
    const f1 = makeFinding({ id: 'f1' });
    const diagnostics = [
      makeDiagnostic({ id: 'd1', findingId: 'f1' }),
      makeDiagnostic({ id: 'd2', findingId: 'f1' }),
    ];
    const forward = linkDiagnostics(makeFacts({ findings: [f1], diagnostics }));
    const reversed = linkDiagnostics(
      makeFacts({ findings: [f1], diagnostics: [...diagnostics].reverse() }),
    );
    expect([...reversed.entries()]).toEqual([...forward.entries()]);
  });
});

describe('toDiagnosticSummaries（IMPL-17 §7）', () => {
  it('cause/confidence/explanation 原样透传，不重新归因', () => {
    const facts = makeFacts({
      diagnostics: [
        makeDiagnostic({
          id: 'd1',
          cause: 'TOKEN',
          confidence: 'SUPPORTED',
          explanation: 'Token 映射偏差',
        }),
      ],
    });
    const summaries = toDiagnosticSummaries(facts);
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: 'd1',
      findingId: 'finding-default',
      cause: 'TOKEN',
      confidence: 'SUPPORTED',
      explanation: 'Token 映射偏差',
    });
  });
});

describe('calculateImpact（IMPL-17 §27-29）', () => {
  it('空投影得零值', () => {
    expect(
      calculateImpact({ targetType: 'ELEMENT', targetIds: [], affectedSubjectIds: [] }),
    ).toEqual({
      affectedElements: 0,
      affectedComponents: 0,
      affectedTokens: [],
      affectedThemes: [],
      potentialRegressionAreas: [],
    });
  });

  it('TOKEN 目标沿 ImpactTrace 展开 dependents 与 themes 并去重排序（§28-29）', () => {
    const impact = calculateImpact({
      targetType: 'TOKEN',
      targetIds: ['token.semantic.color.primary'],
      affectedSubjectIds: ['btn-1', 'btn-2', 'btn-1'],
      impactTraces: [
        {
          tokenId: 'token.semantic.color.primary',
          dependents: ['token.component.button.fg', 'token.semantic.color.primary'],
          themes: ['dark', 'light', 'dark'],
        },
        {
          tokenId: 'token.semantic.color.primary',
          dependents: ['token.component.button.bg'],
          themes: ['high-contrast'],
        },
      ],
      potentialRegressionAreas: ['ACCESSIBILITY', 'COLOR', 'ACCESSIBILITY'],
    });
    expect(impact).toEqual({
      affectedElements: 2,
      affectedComponents: 0,
      affectedTokens: [
        'token.component.button.bg',
        'token.component.button.fg',
        'token.semantic.color.primary',
      ],
      affectedThemes: ['dark', 'high-contrast', 'light'],
      potentialRegressionAreas: ['ACCESSIBILITY', 'COLOR'],
    });
  });

  it('非 TOKEN 目标不产出 affectedTokens；COMPONENT 目标计 affectedComponents', () => {
    const element = calculateImpact({
      targetType: 'ELEMENT',
      targetIds: ['e1'],
      affectedSubjectIds: ['e1'],
    });
    expect(element.affectedTokens).toEqual([]);
    const component = calculateImpact({
      targetType: 'COMPONENT',
      targetIds: ['Button', 'Card'],
      affectedSubjectIds: [],
    });
    expect(component.affectedComponents).toBe(2);
  });
});
