import type {
  Finding,
  Diagnostic,
  VisualTextureEvidence,
  VisualTextureDimensionEvidence,
  VisualTextureReproducibility,
  VisualTextureDimension,
} from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { VisualTextureAggregation } from './aggregation';
import type { VisualTextureRecommendation } from './recommend-all';
import type { TextureVerification } from '@uiq/core';
import type { CrossDimensionRelation, SystemicPattern } from '@uiq/core';

/**
 * 组装完整 VisualTextureEvidence JSON。
 *
 * 将所有维度的度量、评价、诊断、建议、验证、跨维度关系、
 * 系统性模式和可复现性信息组装为一个完整的证据对象。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23 §6.4
 */
export function buildVisualTextureReport(params: {
  readonly projectId: string;
  readonly pageId?: string;
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
  readonly recommendations: readonly VisualTextureRecommendation[];
  readonly verification: readonly TextureVerification[];
  readonly aggregation: VisualTextureAggregation;
  readonly crossDimensionRelations: readonly CrossDimensionRelation[];
  readonly systemicPatterns: readonly SystemicPattern[];
  readonly viewport?: string;
  readonly theme?: string;
}): VisualTextureEvidence {
  const {
    projectId,
    pageId,
    findings,
    diagnostics,
    recommendations,
    verification,
    aggregation,
    crossDimensionRelations,
    systemicPatterns,
    viewport = '1440x900',
    theme = 'light',
  } = params;

  const snapshotId = fingerprint({ projectId, pageId, viewport, theme, timestamp: new Date().toISOString().slice(0, 10) });
  const dimensions = buildDimensionEvidence(findings, diagnostics, aggregation);
  const reproducibility: VisualTextureReproducibility[] = [{
    snapshotId,
    viewport,
    theme,
    timestamp: new Date().toISOString(),
  }];

  // 将通用 Recommendation 映射为 TextureRecommendation
  const textureRecommendations = recommendations.map((r) => ({
    id: r.id,
    diagnosticId: `diag-${r.findingId}`,
    dimension: resolveDimensionFromString(r.dimension),
    action: r.action,
    priority: r.priority,
  }));

  // 将 Diagnostic 映射为 TextureDiagnostic
  const textureDiagnostics = diagnostics.map((d) => ({
    id: d.id,
    findingId: d.findingId,
    dimension: resolveDimensionFromRuleId(findings.find((f) => f.id === d.findingId)?.evaluation.ruleId ?? ''),
    explanation: d.explanation,
    rootCause: d.cause,
  }));

  // 将 Finding 映射为 TextureFinding
  const textureFindings = findings.map((f) => ({
    id: f.id,
    ruleId: f.evaluation.ruleId,
    dimension: resolveDimensionFromRuleId(f.evaluation.ruleId),
    state: f.evaluation.state as 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN',
    evidence: f.evidence.map((e) => ({
      id: e.id,
      source: 'measurement',
      type: e.type,
      value: e.referenceId,
    })),
  }));

  return {
    id: `vte-${snapshotId.slice(0, 12)}`,
    version: '1.0.0',
    projectId,
    ...(pageId !== undefined ? { pageId } : {}),
    snapshotId,
    dimensions,
    crossDimensionRelations,
    findings: textureFindings,
    diagnostics: textureDiagnostics,
    recommendations: textureRecommendations,
    verification,
    reproducibility,
  };
}

// --- internals ---

function buildDimensionEvidence(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
  aggregation: VisualTextureAggregation,
): VisualTextureDimensionEvidence[] {
  const allDims: VisualTextureDimension[] = [
    'SURFACE', 'DEPTH', 'COLOR', 'TYPOGRAPHY', 'SPATIAL', 'MOTION', 'MICRO_DETAIL',
  ];

  return allDims.map((dim) => {
    const dimFindings = findings.filter((f) => resolveDimensionFromRuleId(f.evaluation.ruleId) === dim);
    const dimDiagnostics = diagnostics.filter((d) => {
      const f = dimFindings.find((ff) => ff.id === d.findingId);
      return !!f;
    });
    const summary = aggregation.dimensionSummaries.find((s) => s.dimension === dim);

    return {
      dimension: dim,
      metrics: dimFindings.map((f) => ({
        metricId: f.evaluation.metricResult.metricId,
        value: f.evaluation.metricResult.value,
        status: f.evaluation.metricResult.status,
      })),
      evaluations: dimFindings.map((f) => ({
        ruleId: f.evaluation.ruleId,
        state: f.evaluation.state,
        metricId: f.evaluation.metricResult.metricId,
      })),
      findings: dimFindings.map((f) => ({
        id: f.id,
        ruleId: f.evaluation.ruleId,
        state: f.evaluation.state,
      })),
      diagnostics: dimDiagnostics.map((d) => ({
        id: d.id,
        explanation: d.explanation,
        cause: d.cause,
      })),
      ...(summary ? {
        score: summary.score,
        totalFindings: summary.totalFindings,
        passCount: summary.passCount,
        failCount: summary.failCount,
      } : {}),
    };
  });
}

function resolveDimensionFromRuleId(ruleId: string): VisualTextureDimension {
  if (ruleId.includes('SURFACE')) return 'SURFACE';
  if (ruleId.includes('DEPTH')) return 'DEPTH';
  if (ruleId.includes('COLOR')) return 'COLOR';
  if (ruleId.includes('TYPOGRAPHY')) return 'TYPOGRAPHY';
  if (ruleId.includes('SPATIAL')) return 'SPATIAL';
  if (ruleId.includes('MOTION')) return 'MOTION';
  if (ruleId.includes('MICRO')) return 'MICRO_DETAIL';
  return 'SURFACE';
}

function resolveDimensionFromString(dimension: string): VisualTextureDimension {
  const map: Record<string, VisualTextureDimension> = {
    Surface: 'SURFACE',
    Depth: 'DEPTH',
    Color: 'COLOR',
    Typography: 'TYPOGRAPHY',
    Spatial: 'SPATIAL',
    Motion: 'MOTION',
    MicroDetail: 'MICRO_DETAIL',
  };
  return map[dimension] ?? 'SURFACE';
}
