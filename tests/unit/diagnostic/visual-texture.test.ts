import { describe, expect, it } from 'vitest';
import type { Finding, MetricResult } from '@uiq/core';
import {
  diagnoseSurface,
  diagnoseDepth,
  diagnoseColorTexture,
  diagnoseTypographyTexture,
  diagnoseSpatialTexture,
  diagnoseMotionTexture,
  diagnoseMicroDetailTexture,
  diagnoseAllVisualTexture,
} from '@uiq/diagnostic';

function makeMetricResult(metricId: string, value: unknown, status: 'AVAILABLE' | 'UNKNOWN' = 'AVAILABLE'): MetricResult {
  return {
    metricId, metricVersion: '1.0.0', subjectId: 'page-1', status, value,
    dependencies: [], fingerprint: '',
  };
}

function makeFinding(id: string, ruleId: string, state: 'PASS' | 'FAIL' | 'WARN', metricId: string, value: unknown = {}): Finding {
  const metricResult = makeMetricResult(metricId, value);
  const evidence = [{ id: `ev-${id}`, type: 'METRIC' as const, referenceId: `${metricId}@1.0.0`, relation: 'EVALUATED_BY' as const }];
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

describe('diagnoseSurface', () => {
  it('生成 Surface 诊断', () => {
    const findings = [makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL', 'SURFACE.RADIUS.CONSISTENCY', { deviationCount: 3, dominantValue: 8 })];
    const diagnostics = diagnoseSurface(findings);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].explanation).toContain('圆角');
    expect(diagnostics[0].findingId).toBe('f1');
  });

  it('PASS 状态生成正面诊断', () => {
    const findings = [makeFinding('f2', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'PASS', 'SURFACE.RADIUS.CONSISTENCY')];
    const diagnostics = diagnoseSurface(findings);
    expect(diagnostics[0].explanation).toContain('良好');
  });
});

describe('diagnoseDepth', () => {
  it('生成 Depth 诊断', () => {
    const findings = [makeFinding('f3', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'FAIL', 'DEPTH.ELEVATION.HIERARCHY', { levelCount: 1 })];
    const diagnostics = diagnoseDepth(findings);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].explanation).toContain('层级');
  });
});

describe('diagnoseColorTexture', () => {
  it('生成 Color 诊断', () => {
    const findings = [makeFinding('f4', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'FAIL', 'COLOR.CONTRAST.QUALITY', { failCount: 5 })];
    const diagnostics = diagnoseColorTexture(findings);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].explanation).toContain('对比度');
  });
});

describe('diagnoseTypographyTexture', () => {
  it('生成 Typography 诊断', () => {
    const findings = [makeFinding('f5', 'VISUAL_TEXTURE.TYPOGRAPHY.FONT_CONSISTENCY', 'FAIL', 'TYPOGRAPHY.FONT.CONSISTENCY', { distinctFamilies: 5 })];
    const diagnostics = diagnoseTypographyTexture(findings);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].explanation).toContain('字体');
  });
});

describe('diagnoseSpatialTexture', () => {
  it('生成 Spatial 诊断', () => {
    const findings = [makeFinding('f6', 'VISUAL_TEXTURE.SPATIAL.GRID_CONSISTENCY', 'FAIL', 'SPATIAL.GRID.CONSISTENCY', { alignmentScore: 0.3 })];
    const diagnostics = diagnoseSpatialTexture(findings);
    expect(diagnostics).toHaveLength(1);
  });
});

describe('diagnoseMotionTexture', () => {
  it('生成 Motion 诊断', () => {
    const findings = [makeFinding('f7', 'VISUAL_TEXTURE.MOTION.TRANSITION_QUALITY', 'FAIL', 'MOTION.TRANSITION.QUALITY', { avgDuration: 500 })];
    const diagnostics = diagnoseMotionTexture(findings);
    expect(diagnostics).toHaveLength(1);
  });
});

describe('diagnoseMicroDetailTexture', () => {
  it('生成 Micro Detail 诊断', () => {
    const findings = [makeFinding('f8', 'VISUAL_TEXTURE.MICRO.STATE_COMPLETENESS', 'FAIL', 'MICRO_DETAIL.STATE.COMPLETENESS', { stateCoverage: 0.5 })];
    const diagnostics = diagnoseMicroDetailTexture(findings);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].explanation).toContain('状态');
  });
});

describe('diagnoseAllVisualTexture', () => {
  it('路由到正确的专用诊断器', () => {
    const findings = [
      makeFinding('f1', 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY', 'FAIL', 'SURFACE.RADIUS.CONSISTENCY'),
      makeFinding('f2', 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', 'FAIL', 'DEPTH.ELEVATION.HIERARCHY'),
      makeFinding('f3', 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', 'FAIL', 'COLOR.CONTRAST.QUALITY'),
    ];
    const diagnostics = diagnoseAllVisualTexture(findings);
    expect(diagnostics).toHaveLength(3);
    expect(diagnostics[0].id).toContain('surface');
    expect(diagnostics[1].id).toContain('depth');
    expect(diagnostics[2].id).toContain('color');
  });

  it('空输入返回空数组', () => {
    expect(diagnoseAllVisualTexture([])).toEqual([]);
  });
});
