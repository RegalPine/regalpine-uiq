import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

export function diagnoseSpatialTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;
  const cause: DiagnosticCause = ruleId.includes('GRID') || ruleId.includes('ALIGNMENT') || ruleId.includes('SPACING') ? 'TOKEN' : 'CONFIGURATION';

  let explanation: string;
  if (ruleId.includes('GRID')) {
    const score = (mv?.alignmentScore as number) ?? 0;
    explanation = state === 'FAIL'
      ? `网格对齐不佳：对齐分数 ${score.toFixed(2)}。建议采用统一的网格系统。`
      : `网格对齐良好：对齐分数 ${score.toFixed(2)}。`;
  } else if (ruleId.includes('ALIGNMENT')) {
    const deviation = (mv?.deviationCount as number) ?? 0;
    explanation = state === 'FAIL'
      ? `对齐不一致：${deviation} 个元素偏离网格。建议检查布局对齐。`
      : '元素对齐一致性良好。';
  } else if (ruleId.includes('SPACING')) {
    const distinct = (mv?.distinctGaps as number) ?? 0;
    explanation = state === 'FAIL'
      ? `间距节奏碎片化：${distinct} 种不同间距值。建议定义 spacing scale token。`
      : `间距节奏一致：${distinct} 种间距值。`;
  } else if (ruleId.includes('WHITESPACE')) {
    const ratio = (mv?.whitespaceRatio as number) ?? 0;
    explanation = state === 'FAIL'
      ? `留白不足：留白比率 ${ratio.toFixed(2)}。建议增加元素间距和容器内边距。`
      : `留白合理：留白比率 ${ratio.toFixed(2)}。`;
  } else if (ruleId.includes('DENSITY')) {
    explanation = state === 'FAIL'
      ? '密度分布不均：元素面积方差过大。建议统一组件尺寸。'
      : '密度分布均匀。';
  } else if (ruleId.includes('PROPORTION')) {
    const variance = (mv?.ratioVariance as number) ?? 0;
    explanation = state === 'FAIL'
      ? `比例不一致：宽高比方差 ${variance.toFixed(2)}。建议统一组件比例。`
      : '比例一致。';
  } else if (ruleId.includes('COMPOSITION')) {
    const sym = (mv?.symmetryScore as number) ?? 0;
    const dist = (mv?.distributionScore as number) ?? 0;
    explanation = state === 'FAIL'
      ? `构图不平衡：对称性 ${sym.toFixed(2)}，分布均匀度 ${dist.toFixed(2)}。建议调整布局。`
      : `构图平衡：对称性 ${sym.toFixed(2)}，分布均匀度 ${dist.toFixed(2)}。`;
  } else {
    explanation = `Spatial 质感评价：${ruleId} → ${state}`;
  }

  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({ id: `ev-vt-spatial-${metricId}`, type: 'METRIC', referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`, relation: 'DERIVED_FROM' });
  }

  return {
    id: `diag-vt-spatial-${finding.id}`, findingId: finding.id, type: finding.type,
    cause, confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence, explanation,
  };
}
