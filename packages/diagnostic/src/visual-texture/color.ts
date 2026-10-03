import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

/**
 * Visual Texture Color 专用诊断器。
 * 规范基线：UIQ-VISUAL-QUALITY-23
 */
export function diagnoseColorTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const explanation = generateExplanation(finding, ruleId);
  const evidence = collectEvidence(finding);
  const cause = resolveCause(ruleId);

  return {
    id: `diag-vt-color-${finding.id}`,
    findingId: finding.id,
    type: finding.type,
    cause,
    confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence,
    explanation,
  };
}

function resolveCause(ruleId: string): DiagnosticCause {
  if (ruleId.includes('TOKEN')) return 'TOKEN';
  if (ruleId.includes('NOISE') || ruleId.includes('HARMONY')) return 'CONFIGURATION';
  if (ruleId.includes('CONTRAST')) return 'THEME';
  return 'CONFIGURATION';
}

function generateExplanation(finding: Finding, ruleId: string): string {
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;

  if (ruleId.includes('LIGHTNESS')) {
    const depth = (mv?.hierarchyDepth as number) ?? 0;
    return state === 'FAIL'
      ? `亮度层次不足：仅 ${depth} 级。建议通过 OKLab L 定义至少 3 级亮度层次 (heading/body/muted)。`
      : `亮度层次良好：${depth} 级。`;
  }
  if (ruleId.includes('CHROMA')) {
    const stdDev = (mv?.stdDev as number) ?? 0;
    return state === 'FAIL'
      ? `色度分布离散：标准差 ${stdDev.toFixed(3)}。建议统一色彩饱和度范围。`
      : '色度分布集中。';
  }
  if (ruleId.includes('HUE')) {
    const avgDist = mv?.avgHueDistance;
    return state === 'FAIL'
      ? `色相关系混乱：平均色相距离 ${avgDist}°。建议限制色相范围或采用色彩和谐方案。`
      : '色相关系统一。';
  }
  if (ruleId.includes('NOISE')) {
    const noiseRatio = (mv?.noiseRatio as number) ?? 0;
    return state === 'FAIL'
      ? `色彩噪声过高：噪声比 ${noiseRatio.toFixed(2)}，同语义角色内存在过多未约束颜色。建议统一使用 Design Token。`
      : '色彩噪声在可接受范围内。';
  }
  if (ruleId.includes('TOKEN')) {
    const deviationCount = (mv?.deviationCount as number) ?? 0;
    return state === 'FAIL'
      ? `颜色 Token 不一致：${deviationCount} 个偏离值。建议统一使用 Design Token 绑定颜色。`
      : '颜色 Token 一致性良好。';
  }
  if (ruleId.includes('CONTRAST')) {
    const failCount = (mv?.failCount as number) ?? 0;
    return state === 'FAIL'
      ? `有 ${failCount} 个元素对比度不达标 (WCAG AA < 4.5:1)。建议检查前景/背景色组合。`
      : '所有元素对比度达标。';
  }
  return `Color 质感评价：${ruleId} → ${state}`;
}

function collectEvidence(finding: Finding): Evidence[] {
  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({
      id: `ev-vt-color-${metricId}`,
      type: 'METRIC',
      referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`,
      relation: 'DERIVED_FROM',
    });
  }
  return evidence;
}
