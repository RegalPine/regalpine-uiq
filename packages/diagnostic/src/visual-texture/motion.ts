import type { Diagnostic, DiagnosticCause, Evidence, Finding } from '@uiq/core';

export function diagnoseMotionTexture(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((f) => diagnoseOne(f));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const mv = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;
  const cause: DiagnosticCause = ruleId.includes('CONSISTENCY') || ruleId.includes('DURATION') ? 'TOKEN' : 'CONFIGURATION';

  let explanation: string;
  if (ruleId.includes('TRANSITION')) {
    const avgDuration = (mv?.avgDuration as number) ?? 0;
    explanation = state === 'FAIL'
      ? `过渡时长过长：平均 ${avgDuration.toFixed(0)}ms。建议控制在 300ms 以内。`
      : `过渡时长合理：平均 ${avgDuration.toFixed(0)}ms。`;
  } else if (ruleId.includes('EASING')) {
    const distinct = (mv?.distinctEasings as number) ?? 0;
    explanation = state === 'FAIL'
      ? `缓动函数碎片化：${distinct} 种不同缓动。建议统一为 1-2 种 easing 并通过 motion token 约束。`
      : `缓动函数一致：${distinct} 种缓动。`;
  } else if (ruleId.includes('SMOOTHNESS') || ruleId.includes('STATE')) {
    explanation = state === 'FAIL'
      ? '状态变化不平滑：交互状态切换缺少过渡效果。建议添加 transition。'
      : '状态变化平滑。';
  } else if (ruleId.includes('CONSISTENCY')) {
    const variance = (mv?.durationVariance as number) ?? 0;
    explanation = state === 'FAIL'
      ? `动效时长不一致：方差 ${variance.toFixed(0)}。建议通过 motion token 统一时长。`
      : '动效时长一致。';
  } else if (ruleId.includes('LOADING')) {
    explanation = state === 'FAIL'
      ? '加载动效缺失：页面或组件加载时无动画反馈。建议添加 loading animation。'
      : '加载动效完整。';
  } else if (ruleId.includes('DURATION')) {
    const consistency = (mv?.consistency as number) ?? 0;
    explanation = state === 'FAIL'
      ? `时长一致性不足：一致性分数 ${consistency.toFixed(2)}。建议统一 transition/animation 时长。`
      : `时长一致性良好：${consistency.toFixed(2)}。`;
  } else {
    explanation = `Motion 质感评价：${ruleId} → ${state}`;
  }

  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({ id: `ev-vt-motion-${metricId}`, type: 'METRIC', referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`, relation: 'DERIVED_FROM' });
  }

  return {
    id: `diag-vt-motion-${finding.id}`, findingId: finding.id, type: finding.type,
    cause, confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence, explanation,
  };
}
