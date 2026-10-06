import type { Finding, Diagnostic } from '@uiq/core';

/**
 * Visual Texture Surface 建议。
 */
export interface SurfaceRecommendation {
  readonly id: string;
  readonly findingId: string;
  readonly ruleId: string;
  readonly action: string;
  readonly priority: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly rationale: string;
}

/**
 * 为 Surface Finding 生成改进建议。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23 §5
 */
export function recommendSurface(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): SurfaceRecommendation[] {
  const diagnosticMap = new Map<string, Diagnostic>();
  for (const d of diagnostics) {
    diagnosticMap.set(d.findingId, d);
  }

  return findings
    .filter((f) => f.evaluation.state === 'FAIL' || f.evaluation.state === 'WARN')
    .map((f) => {
      const diagnostic = diagnosticMap.get(f.id);
      return generateRecommendation(f, diagnostic);
    });
}

function generateRecommendation(
  finding: Finding,
  diagnostic: Diagnostic | undefined,
): SurfaceRecommendation {
  const ruleId = finding.evaluation.ruleId;
  const metricValue = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;

  if (ruleId === 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY') {
    const dominantValue = (metricValue?.dominantValue as number) ?? 8;
    return {
      id: `rec-vt-surface-radius-${finding.id}`,
      findingId: finding.id,
      ruleId,
      action: `将不一致的圆角统一为 ${dominantValue}px，或建立明确的圆角 Token 层级（如 sm=4px, md=8px, lg=12px）`,
      priority: 'MEDIUM',
      rationale: diagnostic?.explanation ?? '圆角值不一致会导致视觉碎片化',
    };
  }

  if (ruleId === 'VISUAL_TEXTURE.SURFACE.RADIUS_FRAGMENTATION') {
    const distinctValues = (metricValue?.distinctValues as number) ?? 0;
    return {
      id: `rec-vt-surface-frag-${finding.id}`,
      findingId: finding.id,
      ruleId,
      action: `将 ${distinctValues} 种圆角值精简为 2-3 种标准值，通过 Design Token 约束`,
      priority: 'LOW',
      rationale: diagnostic?.explanation ?? '圆角碎片化过高，影响设计系统一致性',
    };
  }

  return {
    id: `rec-vt-surface-${finding.id}`,
    findingId: finding.id,
    ruleId,
    action: '检查 Surface 属性一致性',
    priority: 'LOW',
    rationale: diagnostic?.explanation ?? 'Surface 质感评价未通过',
  };
}
