import type { Finding, Diagnostic, TextureVerification } from '@uiq/core';
import { fingerprint } from '@uiq/core';

/**
 * 为每个 FAIL/WARN Recommendation 生成 VerificationCriterion。
 *
 * 验证标准用于回归对比：当修复后重新运行时，
 * 通过比较 baselineFingerprint 判断是否真正修复。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23 §6
 */
export function generateVerification(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): TextureVerification[] {
  const diagnosticMap = new Map<string, Diagnostic>();
  for (const d of diagnostics) {
    diagnosticMap.set(d.findingId, d);
  }

  return findings
    .filter((f) => f.evaluation.state === 'FAIL' || f.evaluation.state === 'WARN')
    .map((f) => {
      const diagnostic = diagnosticMap.get(f.id);
      const expectedState = f.evaluation.state === 'FAIL' ? 'PASS' as const : 'PASS' as const;
      const baselineFingerprint = computeBaselineFingerprint(f);

      return {
        id: `verify-${f.id}`,
        findingId: f.id,
        criterion: buildCriterionText(f, diagnostic),
        expectedState,
        baselineFingerprint,
      };
    });
}

function buildCriterionText(finding: Finding, diagnostic: Diagnostic | undefined): string {
  const ruleId = finding.evaluation.ruleId;
  const currentState = finding.evaluation.state;

  if (diagnostic) {
    return `修复 ${ruleId}：当前状态 ${currentState}，诊断：${diagnostic.explanation}`;
  }
  return `修复 ${ruleId}：当前状态 ${currentState}，需达到 PASS 状态`;
}

function computeBaselineFingerprint(finding: Finding): string {
  const baseline = {
    ruleId: finding.evaluation.ruleId,
    metricId: finding.evaluation.metricResult.metricId,
    metricVersion: finding.evaluation.metricResult.metricVersion,
    value: finding.evaluation.metricResult.value,
    state: finding.evaluation.state,
  };
  return fingerprint(baseline);
}
