import type { Finding, Diagnostic } from '@uiq/core';

/**
 * Visual Texture 通用建议。
 */
export interface VisualTextureRecommendation {
  readonly id: string;
  readonly findingId: string;
  readonly ruleId: string;
  readonly dimension: string;
  readonly action: string;
  readonly priority: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly rationale: string;
}

/**
 * 为所有 7 个维度的 Finding 生成改进建议。
 */
export function recommendVisualTexture(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): VisualTextureRecommendation[] {
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
): VisualTextureRecommendation {
  const ruleId = finding.evaluation.ruleId;
  const dimension = resolveDimension(finding);
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;

  // Dimension-specific recommendations
  if (dimension === 'Depth') {
    return recommendDepth(finding, ruleId, dimension, diagnostic, mv);
  }
  if (dimension === 'Color') {
    return recommendColor(finding, ruleId, dimension, diagnostic, mv);
  }
  if (dimension === 'Typography') {
    return recommendTypography(finding, ruleId, dimension, diagnostic, mv);
  }
  if (dimension === 'Spatial') {
    return recommendSpatial(finding, ruleId, dimension, diagnostic, mv);
  }
  if (dimension === 'Motion') {
    return recommendMotion(finding, ruleId, dimension, diagnostic, mv);
  }
  if (dimension === 'MicroDetail') {
    return recommendMicro(finding, ruleId, dimension, diagnostic, mv);
  }

  return {
    id: `rec-vt-${finding.id}`,
    findingId: finding.id,
    ruleId,
    dimension,
    action: '检查 Visual Texture 属性一致性',
    priority: 'LOW',
    rationale: diagnostic?.explanation ?? 'Visual Texture 评价未通过',
  };
}

function resolveDimension(finding: Finding): string {
  const ruleId = finding.evaluation.ruleId;
  if (ruleId.includes('SURFACE')) return 'Surface';
  if (ruleId.includes('DEPTH')) return 'Depth';
  if (ruleId.includes('COLOR')) return 'Color';
  if (ruleId.includes('TYPOGRAPHY')) return 'Typography';
  if (ruleId.includes('SPATIAL')) return 'Spatial';
  if (ruleId.includes('MOTION')) return 'Motion';
  if (ruleId.includes('MICRO')) return 'MicroDetail';
  return 'Unknown';
}

function recommendDepth(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY') {
    const levelCount = (mv?.levelCount as number) ?? 0;
    return {
      id: `rec-vt-depth-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: `增加层级深度至至少 2 级（当前 ${levelCount} 级），通过 elevation token 定义层级`,
      priority: 'MEDIUM', rationale: diagnostic?.explanation ?? '层级深度不足',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function recommendColor(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY') {
    return {
      id: `rec-vt-color-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: '调整前景/背景色组合以满足 WCAG AA 对比度要求（4.5:1 正文，3:1 大文本）',
      priority: 'HIGH', rationale: diagnostic?.explanation ?? '对比度不达标',
    };
  }
  if (ruleId === 'VISUAL_TEXTURE.COLOR.TOKEN_CONSISTENCY') {
    const deviationCount = (mv?.deviationCount as number) ?? 0;
    return {
      id: `rec-vt-color-token-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: `将 ${deviationCount} 个偏离的颜色值统一为 Design Token`,
      priority: 'MEDIUM', rationale: diagnostic?.explanation ?? '颜色 Token 不一致',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function recommendTypography(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.TYPOGRAPHY.FONT_CONSISTENCY') {
    const distinctFamilies = (mv?.distinctFamilies as number) ?? 0;
    return {
      id: `rec-vt-typo-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: `将 ${distinctFamilies} 种字体族精简为 2-3 种，通过 typography token 约束`,
      priority: 'MEDIUM', rationale: diagnostic?.explanation ?? '字体族过多',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function recommendSpatial(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.SPATIAL.ALIGNMENT_CONSISTENCY') {
    const deviationCount = (mv?.deviationCount as number) ?? 0;
    return {
      id: `rec-vt-spatial-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: `修正 ${deviationCount} 个偏离网格的元素，确保对齐一致性`,
      priority: 'MEDIUM', rationale: diagnostic?.explanation ?? '对齐不一致',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function recommendMotion(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.MOTION.TRANSITION_QUALITY') {
    const avgDuration = (mv?.avgDuration as number) ?? 0;
    return {
      id: `rec-vt-motion-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: `将过渡时长从 ${avgDuration}ms 缩短至 300ms 以内`,
      priority: 'LOW', rationale: diagnostic?.explanation ?? '过渡时长过长',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function recommendMicro(
  finding: Finding, ruleId: string, dimension: string,
  diagnostic: Diagnostic | undefined, _mv: Record<string, unknown> | undefined,
): VisualTextureRecommendation {
  if (ruleId === 'VISUAL_TEXTURE.MICRO.FOCUS_QUALITY') {
    return {
      id: `rec-vt-micro-${finding.id}`, findingId: finding.id, ruleId, dimension,
      action: '为所有可交互元素添加可见的 focus 指示器样式',
      priority: 'HIGH', rationale: diagnostic?.explanation ?? '焦点指示器缺失',
    };
  }
  return genericRecommendation(finding, dimension, diagnostic);
}

function genericRecommendation(
  finding: Finding, dimension: string, diagnostic: Diagnostic | undefined,
): VisualTextureRecommendation {
  return {
    id: `rec-vt-${finding.id}`, findingId: finding.id,
    ruleId: finding.evaluation.ruleId, dimension,
    action: `检查 ${dimension} 属性一致性`,
    priority: 'LOW',
    rationale: diagnostic?.explanation ?? `${dimension} 质感评价未通过`,
  };
}
