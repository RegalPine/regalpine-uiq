import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

export function diagnoseMicroDetailTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;
  const cause: DiagnosticCause = ruleId.includes('STATE') || ruleId.includes('FOCUS') || ruleId.includes('HOVER') ? 'COMPONENT' : 'CONFIGURATION';

  let explanation: string;
  if (ruleId.includes('STATE_COMPLETENESS')) {
    explanation = state === 'FAIL'
      ? '交互状态不完整：元素缺少必要的 hover/focus/disabled 状态样式。建议为所有可交互元素实现完整状态。'
      : '交互状态完整。';
  } else if (ruleId.includes('COMPONENT_CONSISTENCY')) {
    const coverage = (mv?.stateCoverage as number) ?? 0;
    const missing = (mv?.missingStates as string[]) ?? [];
    explanation = state === 'FAIL'
      ? `组件状态不一致：覆盖率 ${coverage.toFixed(2)}，缺失状态：${missing.join(', ')}。建议统一组件状态实现。`
      : `组件状态一致：覆盖率 ${coverage.toFixed(2)}。`;
  } else if (ruleId.includes('ICON_CONSISTENCY')) {
    const distinct = (mv?.distinctSizes as number) ?? 0;
    explanation = state === 'FAIL'
      ? `图标尺寸不一致：${distinct} 种不同尺寸。建议统一为 16/20/24px 等标准尺寸。`
      : `图标尺寸一致：${distinct} 种尺寸。`;
  } else if (ruleId.includes('FOCUS')) {
    const withOutline = (mv?.hasOutline as number) ?? 0;
    explanation = state === 'FAIL'
      ? `焦点指示器缺失：${withOutline} 个元素有 outline。建议为所有可交互元素添加可见的 focus 样式。`
      : '焦点指示器质量良好。';
  } else if (ruleId.includes('HOVER')) {
    const feedback = (mv?.withHoverFeedback as number) ?? 0;
    const total = (mv?.populationSize as number) ?? 0;
    explanation = state === 'FAIL'
      ? `hover 反馈不完整：${total} 个元素中仅 ${feedback} 个有 hover 视觉反馈。建议添加 cursor/背景色变化。`
      : 'hover 反馈完整。';
  } else if (ruleId.includes('DISABLED')) {
    explanation = state === 'FAIL'
      ? '禁用状态视觉指示不足：disabled 元素缺少明显的视觉区分。建议降低 opacity 或改变背景色。'
      : '禁用状态视觉指示充分。';
  } else if (ruleId.includes('BORDER_DETAIL')) {
    const consistency = (mv?.consistency as number) ?? 0;
    explanation = state === 'FAIL'
      ? `边框细节不一致：一致性 ${consistency.toFixed(2)}。建议通过 border token 统一边框样式。`
      : `边框细节一致：一致性 ${consistency.toFixed(2)}。`;
  } else if (ruleId.includes('RADIUS_DETAIL')) {
    const consistency = (mv?.consistency as number) ?? 0;
    explanation = state === 'FAIL'
      ? `圆角细节不一致：一致性 ${consistency.toFixed(2)}。建议通过 radius token 统一圆角。`
      : `圆角细节一致：一致性 ${consistency.toFixed(2)}。`;
  } else if (ruleId.includes('FRAGMENTATION')) {
    const frag = (mv?.overallFragmentation as number) ?? 0;
    explanation = state === 'FAIL'
      ? `微细节碎片化：碎片化指数 ${frag.toFixed(2)}。建议统一 state/icon/border/radius 规范。`
      : `微细节碎片化在可接受范围内：${frag.toFixed(2)}。`;
  } else {
    explanation = `Micro Detail 质感评价：${ruleId} → ${state}`;
  }

  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({ id: `ev-vt-micro-${metricId}`, type: 'METRIC', referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`, relation: 'DERIVED_FROM' });
  }

  return {
    id: `diag-vt-micro-${finding.id}`, findingId: finding.id, type: finding.type,
    cause, confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence, explanation,
  };
}
