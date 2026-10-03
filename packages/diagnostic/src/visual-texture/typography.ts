import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

export function diagnoseTypographyTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;
  const cause: DiagnosticCause = ruleId.includes('FONT') || ruleId.includes('SCALE') ? 'TOKEN' : 'CONFIGURATION';

  let explanation: string;
  if (ruleId.includes('FONT')) {
    const families = (mv?.distinctFamilies as number) ?? 0;
    explanation = state === 'FAIL'
      ? `字体族过多：${families} 种。建议控制在 2-3 种以内，通过 typography token 约束。`
      : `字体族一致性良好：${families} 种。`;
  } else if (ruleId.includes('SCALE')) {
    const distinct = (mv?.distinctSizes as number) ?? 0;
    explanation = state === 'FAIL'
      ? `字体缩放系统碎片化：${distinct} 种不同尺寸。建议定义 type scale token。`
      : `字体缩放系统一致：${distinct} 种尺寸。`;
  } else if (ruleId.includes('WEIGHT')) {
    const distinct = (mv?.distinctWeights as number) ?? 0;
    explanation = state === 'FAIL'
      ? `字重层次混乱：${distinct} 种不同字重。建议精简为 3-4 级 (regular/medium/semibold/bold)。`
      : `字重层次清晰：${distinct} 种字重。`;
  } else if (ruleId.includes('LINEHEIGHT')) {
    const distinct = (mv?.distinctRatios as number) ?? 0;
    explanation = state === 'FAIL'
      ? `行高节奏不一致：${distinct} 种不同行高/字号比。建议统一行高节奏。`
      : `行高节奏一致：${distinct} 种比率。`;
  } else if (ruleId.includes('SPACING')) {
    explanation = state === 'FAIL'
      ? '字间距质量不佳：letter-spacing 不一致。建议通过 token 约束字间距。'
      : '字间距质量良好。';
  } else if (ruleId.includes('DENSITY')) {
    const ratio = (mv?.densityRatio as number) ?? 0;
    explanation = state === 'FAIL'
      ? `排版密度失衡：行高/字号比 ${ratio.toFixed(2)}。建议调整行高或字号以改善可读性。`
      : `排版密度合理：行高/字号比 ${ratio.toFixed(2)}。`;
  } else if (ruleId.includes('HIERARCHY')) {
    const levels = (mv?.levelCount as number) ?? 0;
    explanation = state === 'FAIL'
      ? `文本层次不足：仅 ${levels} 级。建议定义至少 3 级文本层次 (heading/body/caption)。`
      : `文本层次清晰：${levels} 级。`;
  } else {
    explanation = `Typography 质感评价：${ruleId} → ${state}`;
  }

  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({ id: `ev-vt-typo-${metricId}`, type: 'METRIC', referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`, relation: 'DERIVED_FROM' });
  }

  return {
    id: `diag-vt-typography-${finding.id}`, findingId: finding.id, type: finding.type,
    cause, confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence, explanation,
  };
}
