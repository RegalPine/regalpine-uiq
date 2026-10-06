import type { Diagnostic, Evidence, Finding, MetricResult } from '@uiq/core';
import { fingerprint } from '@uiq/core';

/**
 * Visual Texture Surface 诊断器。
 *
 * 为 Surface 维度的 Finding 生成 Diagnostic：
 * - Finding → Root Cause → Token Trace → Explanation
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23
 */
export function diagnoseSurface(findings: readonly Finding[]): Diagnostic[] {
  return findings.map((finding) => diagnoseOne(finding));
}

function diagnoseOne(finding: Finding): Diagnostic {
  const ruleId = finding.evaluation.ruleId;
  const explanation = generateSurfaceExplanation(finding, ruleId);
  const evidence = collectSurfaceEvidence(finding);

  return {
    id: `diag-vt-surface-${finding.id}`,
    findingId: finding.id,
    type: finding.type,
    cause: 'CONFIGURATION',
    confidence: finding.evaluation.metricResult.status === 'AVAILABLE' ? 'DIRECT' : 'INFERRED',
    evidence,
    explanation,
  };
}

function generateSurfaceExplanation(finding: Finding, ruleId: string): string {
  const metricValue = finding.evaluation.metricResult.value as Record<string, unknown> | undefined;
  const state = finding.evaluation.state;

  if (ruleId === 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY') {
    const deviationCount = (metricValue?.deviationCount as number) ?? 0;
    const dominantValue = (metricValue?.dominantValue as number) ?? 'N/A';
    const populationSize = (metricValue?.populationSize as number) ?? 0;
    if (state === 'FAIL') {
      return `圆角不一致：${populationSize} 个元素中有 ${deviationCount} 个偏离主值 ${dominantValue}px。建议统一使用同一圆角值。`;
    }
    return `圆角一致性良好：${populationSize} 个元素统一使用 ${dominantValue}px。`;
  }

  if (ruleId === 'VISUAL_TEXTURE.SURFACE.RADIUS_FRAGMENTATION') {
    const fragmentationRatio = (metricValue?.fragmentationRatio as number) ?? 0;
    const distinctValues = (metricValue?.distinctValues as number) ?? 0;
    if (state === 'FAIL') {
      return `圆角碎片化过高：${distinctValues} 种不同圆角值，碎片化比率 ${fragmentationRatio.toFixed(2)}。建议减少圆角变体。`;
    }
    return `圆角碎片化在可接受范围内：${distinctValues} 种圆角值。`;
  }

  return `Surface 质感评价：${ruleId} → ${state}`;
}

function collectSurfaceEvidence(finding: Finding): Evidence[] {
  const evidence: Evidence[] = [...finding.evidence];
  const metricId = finding.evaluation.metricResult.metricId;
  if (!evidence.some((e) => e.referenceId.includes(metricId))) {
    evidence.push({
      id: `ev-vt-surface-${metricId}`,
      type: 'METRIC',
      referenceId: `${metricId}@${finding.evaluation.metricResult.metricVersion}`,
      relation: 'DERIVED_FROM',
    });
  }
  return evidence;
}
