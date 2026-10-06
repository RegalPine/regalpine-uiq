import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

/**
 * Visual Texture Depth 专用诊断器。
 * 规范基线：UIQ-VISUAL-QUALITY-23
 */
export function diagnoseDepth(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const explanation = generateExplanation(finding, ruleId);
  const evidence = collectEvidence(finding);
  const cause = resolveCause(ruleId);

  return {
    id: `diag-vt-depth-${finding.id}`,
    findingId: finding.id,
    type: finding.type,
    cause,
    confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence,
    explanation,
  };
}

function resolveCause(ruleId: string): DiagnosticCause {
  if (ruleId.includes('ELEVATION') || ruleId.includes('LAYER')) return 'THEME';
  if (ruleId.includes('SHADOW')) return 'CONFIGURATION';
  return 'CONFIGURATION';
}

function generateExplanation(finding: Finding, ruleId: string): string {
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;

  if (ruleId.includes('ELEVATION')) {
    const levelCount = (mv?.levelCount as number) ?? 0;
    return state === 'FAIL'
      ? `层级深度不足：仅 ${levelCount} 级。建议通过 elevation token 定义至少 2 级层级以建立视觉层次。`
      : `层级深度良好：${levelCount} 级。`;
  }
  if (ruleId.includes('SHADOW_DEPTH')) {
    return state === 'FAIL'
      ? '阴影深度结构不一致：多个元素的 shadow offset/blur/spread 差异过大。建议统一 shadow scale。'
      : '阴影深度结构一致。';
  }
  if (ruleId.includes('SEPARATION')) {
    return state === 'FAIL'
      ? '视觉分离不足：相邻区域缺少足够的对比度、边框或间距来区分。建议增加视觉分隔手段。'
      : '视觉分离充分。';
  }
  if (ruleId.includes('OVERLAY')) {
    return state === 'FAIL'
      ? '覆盖层质量不佳：overlay 缺少 backdrop 或 z-index 层级不明确。建议检查 overlay 层级和背景透明度。'
      : '覆盖层质量良好。';
  }
  if (ruleId.includes('SPATIAL_PRIORITY')) {
    return state === 'FAIL'
      ? '空间优先级不清晰：重要元素未通过 elevation 或尺寸突出。建议调整层级关系。'
      : '空间优先级清晰。';
  }
  return `Depth 质感评价：${ruleId} → ${state}`;
}

function collectEvidence(finding: Finding): Evidence[] {
  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({
      id: `ev-vt-depth-${metricId}`,
      type: 'METRIC',
      referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`,
      relation: 'DERIVED_FROM',
    });
  }
  return evidence;
}
