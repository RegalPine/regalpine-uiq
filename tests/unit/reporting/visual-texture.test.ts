import { describe, expect, it } from 'vitest';
import type { Finding, Diagnostic, MetricResult } from '@uiq/core';
import { aggregateVisualTexture } from '@uiq/reporting';
import { generateVerification } from '@uiq/reporting';
import { detectCrossDimensionRelations } from '@uiq/reporting';
import { detectSystemicPatterns } from '@uiq/reporting';
import { recommendVisualTexture } from '@uiq/reporting';

function makeMetricResult(metricId: string): MetricResult {
  return { metricId, metricVersion: '1.0.0', subjectId: 'page-1', status: 'AVAILABLE', value: {}, dependencies: [], fingerprint: '' };
}

function makeFinding(id: string, ruleId: string, state: 'PASS' | 'FAIL' | 'WARN'): Finding {
  const metricResult = makeMetricResult(ruleId.replace('VISUAL_TEXTURE.', ''));
  const evidence = [{ id: `ev-${id}`, type: 'METRIC' as const, referenceId: `${ruleId}@1.0.0`, relation: 'EVALUATED_BY' as const }];
  return {
    id, fingerprint: 'fp', type: 'TOKEN_DEVIATION', state: 'DETECTED', severity: 'MEDIUM',
    subjectId: 'page-1',
    evaluation: {
      ruleId, ruleVersion: '1.0.0', subjectId: 'page-1', state, severity: 'MEDIUM',
      metricResult, evidence, fingerprint: 'fp', message: `${ruleId}: ${state}`,
    },
    evidence, createdAt: 1000, updatedAt: 1000,
  };
}

function makeDiagnostic(findingId: string): Diagnostic {
  return {
    id: `diag-${findingId}`, findingId, type: 'TOKEN_DEVIATION',
    cause: 'CONFIGURATION', confidence: 'DIRECT',
    evidence: [], explanation: 'test explanation',
  };
}

describe('aggregateVisualTexture', () => {
  it('汇总 7 个维度', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'PASS'),
      makeFinding('f2', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'FAIL'),
      makeFinding('f3', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'PASS'),
    ];
    const diagnostics = findings.map((f) => makeDiagnostic(f.id));
    const agg = aggregateVisualTexture(findings, diagnostics);
    expect(agg.dimensionSummaries).toHaveLength(7);
    expect(agg.totalFindings).toBe(3);
    expect(agg.passRate).toBeCloseTo(2 / 3);
  });

  it('空输入返回默认值', () => {
    const agg = aggregateVisualTexture([], []);
    expect(agg.totalFindings).toBe(0);
    expect(agg.passRate).toBe(1);
    expect(agg.overallScore).toBe(1);
  });
});

describe('generateVerification', () => {
  it('为 FAIL/WARN Finding 生成验证标准', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'PASS'),
      makeFinding('f3', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'WARN'),
    ];
    const diagnostics = findings.map((f) => makeDiagnostic(f.id));
    const verification = generateVerification(findings, diagnostics);
    expect(verification).toHaveLength(2); // only FAIL and WARN
    expect(verification[0].expectedState).toBe('PASS');
    expect(verification[0].baselineFingerprint).toBeTruthy();
  });
});

describe('detectCrossDimensionRelations', () => {
  it('检测 Surface + Color 同时 FAIL 的关系', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'FAIL'),
    ];
    const diagnostics = findings.map((f) => makeDiagnostic(f.id));
    const relations = detectCrossDimensionRelations(findings, diagnostics);
    expect(relations.length).toBeGreaterThan(0);
    const surfaceColor = relations.find((r) => r.sourceDimension === 'SURFACE' && r.targetDimension === 'COLOR');
    expect(surfaceColor).toBeDefined();
    expect(surfaceColor!.relation).toBe('SHARES_TOKEN');
  });

  it('无 FAIL 时无关系', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'PASS'),
    ];
    const relations = detectCrossDimensionRelations(findings, []);
    expect(relations).toHaveLength(0);
  });
});

describe('detectSystemicPatterns', () => {
  it('检测 TOKEN_SYSTEMIC (3+ 维度 FAIL)', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'FAIL'),
      makeFinding('f3', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'FAIL'),
    ];
    const patterns = detectSystemicPatterns(findings);
    const tokenSystemic = patterns.find((p) => p.type === 'TOKEN_SYSTEMIC');
    expect(tokenSystemic).toBeDefined();
  });

  it('无系统性问题时返回空', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'PASS'),
    ];
    const patterns = detectSystemicPatterns(findings);
    expect(patterns).toHaveLength(0);
  });
});

describe('recommendVisualTexture', () => {
  it('为 FAIL Finding 生成建议', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL'),
      makeFinding('f2', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'PASS'),
    ];
    const diagnostics = findings.map((f) => makeDiagnostic(f.id));
    const recs = recommendVisualTexture(findings, diagnostics);
    expect(recs).toHaveLength(1);
    expect(recs[0].findingId).toBe('f1');
    expect(recs[0].action).toBeTruthy();
  });
});
