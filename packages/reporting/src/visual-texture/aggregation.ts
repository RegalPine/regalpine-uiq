import type { Finding, Diagnostic } from '@uiq/core';
import type {
  VisualTextureDimension,
  CrossDimensionRelation,
  SystemicPattern,
} from '@uiq/core';

/**
 * Visual Texture 跨维度聚合结果。
 */
export interface VisualTextureAggregation {
  readonly dimensionSummaries: readonly DimensionSummary[];
  readonly crossDimensionRelations: readonly CrossDimensionRelation[];
  readonly systemicPatterns: readonly SystemicPattern[];
  readonly overallScore: number;
  readonly totalFindings: number;
  readonly passRate: number;
}

export interface DimensionSummary {
  readonly dimension: VisualTextureDimension;
  readonly totalFindings: number;
  readonly passCount: number;
  readonly warnCount: number;
  readonly failCount: number;
  readonly score: number;
}

/**
 * 跨维度聚合：汇总所有 7 个维度的 Finding 并检测系统性模式。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-18 §3-5
 */
export function aggregateVisualTexture(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): VisualTextureAggregation {
  const dimensionSummaries = computeDimensionSummaries(findings);
  const crossDimensionRelations = detectCrossDimensionRelations(findings, diagnostics);
  const systemicPatterns = detectSystemicPatterns(findings, dimensionSummaries);

  const totalFindings = findings.length;
  const passCount = findings.filter((f) => f.evaluation.state === 'PASS').length;
  const passRate = totalFindings > 0 ? passCount / totalFindings : 1;
  const overallScore = computeOverallScore(dimensionSummaries);

  return {
    dimensionSummaries,
    crossDimensionRelations,
    systemicPatterns,
    overallScore,
    totalFindings,
    passRate,
  };
}

// --- Dimension Summaries ---

function computeDimensionSummaries(findings: readonly Finding[]): DimensionSummary[] {
  const dimensionMap = new Map<VisualTextureDimension, Finding[]>();
  const allDimensions: VisualTextureDimension[] = [
    'SURFACE', 'DEPTH', 'COLOR', 'TYPOGRAPHY', 'SPATIAL', 'MOTION', 'MICRO_DETAIL',
  ];
  for (const dim of allDimensions) {
    dimensionMap.set(dim, []);
  }

  for (const f of findings) {
    const dim = resolveDimension(f);
    const arr = dimensionMap.get(dim);
    if (arr) arr.push(f);
  }

  return allDimensions.map((dim) => {
    const dimFindings = dimensionMap.get(dim) ?? [];
    const passCount = dimFindings.filter((f) => f.evaluation.state === 'PASS').length;
    const warnCount = dimFindings.filter((f) => f.evaluation.state === 'WARN').length;
    const failCount = dimFindings.filter((f) => f.evaluation.state === 'FAIL').length;
    const total = dimFindings.length;
    const score = total > 0 ? passCount / total : 1;
    return { dimension: dim, totalFindings: total, passCount, warnCount, failCount, score };
  });
}

function resolveDimension(finding: Finding): VisualTextureDimension {
  const ruleId = finding.evaluation.ruleId;
  if (ruleId.includes('SURFACE')) return 'SURFACE';
  if (ruleId.includes('DEPTH')) return 'DEPTH';
  if (ruleId.includes('COLOR')) return 'COLOR';
  if (ruleId.includes('TYPOGRAPHY')) return 'TYPOGRAPHY';
  if (ruleId.includes('SPATIAL')) return 'SPATIAL';
  if (ruleId.includes('MOTION')) return 'MOTION';
  if (ruleId.includes('MICRO')) return 'MICRO_DETAIL';
  return 'SURFACE'; // fallback
}

// --- Cross-Dimension Relations (架构 §10.3) ---

function detectCrossDimensionRelations(
  findings: readonly Finding[],
  _diagnostics: readonly Diagnostic[],
): CrossDimensionRelation[] {
  const relations: CrossDimensionRelation[] = [];
  const failDimensions = new Set<VisualTextureDimension>();
  for (const f of findings) {
    if (f.evaluation.state === 'FAIL') {
      failDimensions.add(resolveDimension(f));
    }
  }

  // Surface ↔ Color: SHARES_TOKEN — 共享 Token 导致一致性问题
  if (failDimensions.has('SURFACE') && failDimensions.has('COLOR')) {
    relations.push({
      sourceDimension: 'SURFACE',
      targetDimension: 'COLOR',
      sourceEvidenceId: 'SURFACE.FAIL',
      targetEvidenceId: 'COLOR.FAIL',
      relation: 'SHARES_TOKEN',
      confidence: 'SUPPORTED',
    });
  }

  // Depth ↔ Spatial: CORRELATED — 层级结构关联
  if (failDimensions.has('DEPTH') && failDimensions.has('SPATIAL')) {
    relations.push({
      sourceDimension: 'DEPTH',
      targetDimension: 'SPATIAL',
      sourceEvidenceId: 'DEPTH.FAIL',
      targetEvidenceId: 'SPATIAL.FAIL',
      relation: 'CORRELATED',
      confidence: 'SUPPORTED',
    });
  }

  // Motion → Micro Detail: DEPENDS_ON — 动效依赖微细节状态
  if (failDimensions.has('MOTION') && failDimensions.has('MICRO_DETAIL')) {
    relations.push({
      sourceDimension: 'MOTION',
      targetDimension: 'MICRO_DETAIL',
      sourceEvidenceId: 'MOTION.FAIL',
      targetEvidenceId: 'MICRO_DETAIL.FAIL',
      relation: 'DEPENDS_ON',
      confidence: 'INFERRED',
    });
  }

  // Typography ↔ Color: CONTRIBUTES_TO — 字体色彩互相影响层级
  if (failDimensions.has('TYPOGRAPHY') && failDimensions.has('COLOR')) {
    relations.push({
      sourceDimension: 'TYPOGRAPHY',
      targetDimension: 'COLOR',
      sourceEvidenceId: 'TYPOGRAPHY.FAIL',
      targetEvidenceId: 'COLOR.FAIL',
      relation: 'CONTRIBUTES_TO',
      confidence: 'INFERRED',
    });
  }

  // Surface → Depth: CONSTRAINS — 表面约束深度表达
  if (failDimensions.has('SURFACE') && failDimensions.has('DEPTH')) {
    relations.push({
      sourceDimension: 'SURFACE',
      targetDimension: 'DEPTH',
      sourceEvidenceId: 'SURFACE.FAIL',
      targetEvidenceId: 'DEPTH.FAIL',
      relation: 'CONSTRAINS',
      confidence: 'SUPPORTED',
    });
  }

  return relations;
}

// --- Systemic Patterns (架构 §10.4) ---

function detectSystemicPatterns(
  findings: readonly Finding[],
  dimensionSummaries: readonly DimensionSummary[],
): SystemicPattern[] {
  const patterns: SystemicPattern[] = [];

  // Pattern 1: TOKEN_SYSTEMIC — 多维度 FAIL 表明 Token 级系统性问题
  const failDims = dimensionSummaries.filter((s) => s.failCount > 0);
  if (failDims.length >= 3) {
    const dimensions = failDims.map((s) => s.dimension);
    const findingIds = findings
      .filter((f) => f.evaluation.state === 'FAIL' && dimensions.includes(resolveDimension(f)))
      .map((f) => f.id);
    patterns.push({
      id: 'sp-token-systemic',
      type: 'TOKEN_SYSTEMIC',
      scope: 'PROJECT',
      dimensions,
      findingIds,
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Pattern 2: TYPOGRAPHY_SYSTEMIC — Typography 维度 FAIL
  const typoFails = findings.filter(
    (f) => resolveDimension(f) === 'TYPOGRAPHY' && f.evaluation.state === 'FAIL',
  );
  if (typoFails.length >= 2) {
    patterns.push({
      id: 'sp-typography-systemic',
      type: 'TYPOGRAPHY_SYSTEMIC',
      scope: 'PROJECT',
      dimensions: ['TYPOGRAPHY'],
      findingIds: typoFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Pattern 3: COLOR_SYSTEMIC — Color 维度 FAIL
  const colorFails = findings.filter(
    (f) => resolveDimension(f) === 'COLOR' && f.evaluation.state === 'FAIL',
  );
  if (colorFails.length >= 2) {
    patterns.push({
      id: 'sp-color-systemic',
      type: 'COLOR_SYSTEMIC',
      scope: 'PROJECT',
      dimensions: ['COLOR'],
      findingIds: colorFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Pattern 4: LAYOUT_SYSTEMIC — Depth + Spatial 同时 FAIL
  const depthFails = findings.filter(
    (f) => resolveDimension(f) === 'DEPTH' && f.evaluation.state === 'FAIL',
  );
  const spatialFails = findings.filter(
    (f) => resolveDimension(f) === 'SPATIAL' && f.evaluation.state === 'FAIL',
  );
  if (depthFails.length > 0 && spatialFails.length > 0) {
    patterns.push({
      id: 'sp-layout-systemic',
      type: 'LAYOUT_SYSTEMIC',
      scope: 'PAGE',
      dimensions: ['DEPTH', 'SPATIAL'],
      findingIds: [...depthFails, ...spatialFails].map((f) => f.id),
      evidence: [],
      confidence: 'SUPPORTED',
    });
  }

  // Pattern 5: MOTION_SYSTEMIC — Motion 维度 FAIL
  const motionFails = findings.filter(
    (f) => resolveDimension(f) === 'MOTION' && f.evaluation.state === 'FAIL',
  );
  if (motionFails.length >= 2) {
    patterns.push({
      id: 'sp-motion-systemic',
      type: 'MOTION_SYSTEMIC',
      scope: 'COMPONENT',
      dimensions: ['MOTION'],
      findingIds: motionFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Pattern 6: CROSS_DIMENSION_SYSTEMIC — 3+ 维度 FAIL 的跨维度系统性问题
  if (failDims.length >= 4) {
    const allFailFindings = findings
      .filter((f) => f.evaluation.state === 'FAIL')
      .map((f) => f.id);
    patterns.push({
      id: 'sp-cross-dimension-systemic',
      type: 'CROSS_DIMENSION_SYSTEMIC',
      scope: 'PROJECT',
      dimensions: failDims.map((s) => s.dimension),
      findingIds: allFailFindings,
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  return patterns;
}

function computeOverallScore(dimensionSummaries: readonly DimensionSummary[]): number {
  if (dimensionSummaries.length === 0) return 1;
  const total = dimensionSummaries.reduce((sum, s) => sum + s.score, 0);
  return total / dimensionSummaries.length;
}
