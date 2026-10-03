import type { Diagnostic, Evidence, Finding } from '@uiq/core';

/**
 * Visual Texture 通用诊断器。
 *
 * 为所有 7 个维度的 Finding 生成 Diagnostic。
 * Surface 维度使用专用诊断器（diagnoseSurface），其余 6 维度使用通用诊断器。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23
 */
export function diagnoseDepth(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'Depth', explainDepth));
}

export function diagnoseColorTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'Color', explainColor));
}

export function diagnoseTypographyTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'Typography', explainTypography));
}

export function diagnoseSpatialTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'Spatial', explainSpatial));
}

export function diagnoseMotionTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'Motion', explainMotion));
}

export function diagnoseMicroDetailTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => createGenericDiagnostic(f, 'MicroDetail', explainMicro));
}

export function diagnoseAllVisualTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => {
    const dimension = resolveDimension(f);
    return createGenericDiagnostic(f, dimension, explainGeneric);
  });
}

// --- internals ---

type ExplainFn = (finding: Finding, ruleId: string) => string;

function createGenericDiagnostic(
  finding: Finding,
  dimension: string,
  explain: ExplainFn,
): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const explanation = explain(finding, ruleId);
  const evidence = collectGenericEvidence(finding);

  return {
    id: `diag-vt-${dimension.toLowerCase()}-${finding.id}`,
    findingId: finding.id,
    type: finding.type,
    cause: 'CONFIGURATION',
    confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence,
    explanation,
  };
}

function collectGenericEvidence(finding: Finding): Evidence[] {
  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({
      id: `ev-vt-${metricId}`,
      type: 'METRIC',
      referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`,
      relation: 'DERIVED_FROM',
    });
  }
  return evidence;
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

function explainDepth(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY') {
    const levelCount = (mv?.levelCount as number) ?? 0;
    return state === 'FAIL'
      ? `层级深度不足：仅 ${levelCount} 级。建议增加至少 2 级层级以建立视觉层次。`
      : `层级深度良好：${levelCount} 级。`;
  }
  return `Depth 质感评价：${ruleId} → ${state}`;
}

function explainColor(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY') {
    const failCount = (mv?.failCount as number) ?? 0;
    return state === 'FAIL'
      ? `有 ${failCount} 个元素对比度不达标。建议检查前景/背景色组合。`
      : '所有元素对比度达标。';
  }
  if (ruleId === 'VISUAL_TEXTURE.COLOR.TOKEN_CONSISTENCY') {
    const deviationCount = (mv?.deviationCount as number) ?? 0;
    return state === 'FAIL'
      ? `颜色 Token 不一致：${deviationCount} 个偏离值。建议统一使用 Design Token。`
      : '颜色 Token 一致性良好。';
  }
  return `Color 质感评价：${ruleId} → ${state}`;
}

function explainTypography(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.TYPOGRAPHY.FONT_CONSISTENCY') {
    const distinctFamilies = (mv?.distinctFamilies as number) ?? 0;
    return state === 'FAIL'
      ? `字体族过多：${distinctFamilies} 种。建议控制在 2-3 种以内。`
      : `字体族一致性良好：${distinctFamilies} 种。`;
  }
  return `Typography 质感评价：${ruleId} → ${state}`;
}

function explainSpatial(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.SPATIAL.ALIGNMENT_CONSISTENCY') {
    const deviationCount = (mv?.deviationCount as number) ?? 0;
    return state === 'FAIL'
      ? `对齐不一致：${deviationCount} 个元素偏离网格。建议检查布局对齐。`
      : '元素对齐一致性良好。';
  }
  return `Spatial 质感评价：${ruleId} → ${state}`;
}

function explainMotion(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.MOTION.TRANSITION_QUALITY') {
    const avgDuration = (mv?.avgDuration as number) ?? 0;
    return state === 'FAIL'
      ? `过渡时长过长：平均 ${avgDuration}ms。建议控制在 300ms 以内。`
      : `过渡时长合理：平均 ${avgDuration}ms。`;
  }
  return `Motion 质感评价：${ruleId} → ${state}`;
}

function explainMicro(finding: Finding, ruleId: string): string {
  const state = finding.evaluation.state;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  if (ruleId === 'VISUAL_TEXTURE.MICRO.FOCUS_QUALITY') {
    return state === 'FAIL'
      ? '焦点指示器缺失或不可见。建议为所有可交互元素添加可见的 focus 样式。'
      : '焦点指示器质量良好。';
  }
  return `Micro Detail 质感评价：${ruleId} → ${state}`;
}

function explainGeneric(finding: Finding, ruleId: string): string {
  return `Visual Texture 评价：${ruleId} → ${finding.evaluation.state}`;
}
