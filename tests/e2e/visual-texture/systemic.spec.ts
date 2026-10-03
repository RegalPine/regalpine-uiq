import { describe, expect, it } from 'vitest';
import type { Finding, Diagnostic, SystemicPattern } from '@uiq/core';
import { detectSystemicPatterns, detectCrossDimensionRelations, aggregateVisualTexture, buildVisualTextureReport, recommendVisualTexture, generateVerification } from '@uiq/reporting';
import { diagnoseAllVisualTexture } from '@uiq/diagnostic';

function makeFinding(id: string, ruleId: string, state: 'PASS' | 'FAIL' | 'WARN'): Finding {
  return {
    id, ruleId,
    evaluation: { ruleId, ruleVersion: '1.0.0', state, metricId: '', metricVersion: '1.0.0', subjectId: 'page-1' },
    evidence: [],
  } as unknown as Finding;
}

describe('Systemic E2E', () => {
  it('无问题时返回空', () => {
    expect(detectSystemicPatterns([])).toHaveLength(0);
  });

  it('全部 PASS 不产生系统性模式', () => {
    const findings = [
      makeFinding('f1', 'SURFACE.RADIUS.CONSISTENCY', 'PASS'),
      makeFinding('f2', 'DEPTH.ELEVATION.HIERARCHY', 'PASS'),
    ];
    expect(detectSystemicPatterns(findings)).toHaveLength(0);
  });

  it('3+ 维度 FAIL 触发 TOKEN_SYSTEMIC', () => {
    const findings = [
      makeFinding('f1', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'DEPTH.ELEVATION.HIERARCHY', 'FAIL'),
      makeFinding('f3', 'COLOR.LIGHTNESS.HIERARCHY', 'FAIL'),
    ];
    const patterns = detectSystemicPatterns(findings);
    expect(patterns.some((p: SystemicPattern) => p.type === 'TOKEN_SYSTEMIC')).toBe(true);
  });

  it('同一 ruleId 3+ 次 FAIL 触发 COMPONENT_SYSTEMIC', () => {
    const findings = [
      makeFinding('f1', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL'),
      makeFinding('f3', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL'),
    ];
    const patterns = detectSystemicPatterns(findings);
    expect(patterns.some((p: SystemicPattern) => p.type === 'COMPONENT_SYSTEMIC')).toBe(true);
  });

  it('MICRO_DETAIL FAIL 触发 STATE_SYSTEMIC', () => {
    const findings = [makeFinding('f1', 'MICRO_DETAIL.STATE.COMPLETENESS', 'FAIL')];
    const patterns = detectSystemicPatterns(findings);
    expect(patterns.some((p: SystemicPattern) => p.type === 'STATE_SYSTEMIC')).toBe(true);
  });

  it('2+ 维度 FAIL 触发 CROSS_DIMENSION_SYSTEMIC', () => {
    const findings = [
      makeFinding('f1', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'MOTION.EASING.QUALITY', 'FAIL'),
    ];
    const patterns = detectSystemicPatterns(findings);
    expect(patterns.some((p: SystemicPattern) => p.type === 'CROSS_DIMENSION_SYSTEMIC')).toBe(true);
  });
});

describe('Cross-Dimension E2E', () => {
  it('无 Finding 时无跨维度关系', () => {
    expect(detectCrossDimensionRelations([], [])).toHaveLength(0);
  });

  it('单维度 FAIL 不产生跨维度关系', () => {
    const findings = [makeFinding('f1', 'SURFACE.RADIUS.CONSISTENCY', 'FAIL')];
    const relations = detectCrossDimensionRelations(findings, []);
    expect(relations).toHaveLength(0);
  });
});

describe('Report Pipeline E2E', () => {
  it('diagnoseAllVisualTexture → aggregateVisualTexture 管道', () => {
    const diagnostics = diagnoseAllVisualTexture([]);
    const agg = aggregateVisualTexture([], diagnostics);
    expect(agg.totalFindings).toBe(0);
    expect(agg.overallScore).toBe(1);
  });

  it('recommendVisualTexture 空输入返回空', () => {
    const recs = recommendVisualTexture([], []);
    expect(recs).toHaveLength(0);
  });

  it('generateVerification 空输入返回空', () => {
    const v = generateVerification([], []);
    expect(v).toHaveLength(0);
  });

  it('buildVisualTextureReport 空输入生成有效结构', () => {
    const agg = aggregateVisualTexture([], []);
    const report = buildVisualTextureReport({
      projectId: 'test', findings: [], diagnostics: [],
      recommendations: [], verification: [], aggregation: agg,
      crossDimensionRelations: [], systemicPatterns: [],
    });
    expect(report).toBeDefined();
    expect(report.dimensions).toBeDefined();
  });
});
