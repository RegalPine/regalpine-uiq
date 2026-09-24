/**
 * P9：面板数据格式化辅助（纯函数，便于测试）。
 */
import type { MetricResult, EvaluationResult, Finding, Diagnostic } from '@uiq/core';

/** 按领域分组 Metric（COLOR / TYPOGRAPHY / GEOMETRY / ...）。 */
export function groupMetricsByDomain(
  metrics: readonly MetricResult[],
): Map<string, MetricResult[]> {
  const groups = new Map<string, MetricResult[]>();
  for (const metric of metrics) {
    const domain = metric.metricId.split('.')[0] ?? 'UNKNOWN';
    const list = groups.get(domain) ?? [];
    list.push(metric);
    groups.set(domain, list);
  }
  return groups;
}

/** 格式化 Metric 值显示。 */
export function formatMetricValue(metric: MetricResult): string {
  if (metric.value === undefined || metric.value === null) {
    return metric.status;
  }
  const val = typeof metric.value === 'number' ? metric.value.toString() : String(metric.value);
  return metric.unit !== undefined ? `${val} ${metric.unit}` : val;
}

/** 格式化 Evaluation 状态。 */
export function formatEvaluationState(evaluation: EvaluationResult): string {
  return evaluation.state;
}

/** 格式化 Finding 标识。 */
export function formatFindingId(finding: Finding): string {
  return finding.id;
}

/** 格式化 Severity 显示。 */
export function formatSeverity(severity: string): string {
  return severity;
}

/** 获取 Diagnostic 的 observed/expected/difference。 */
export function extractDiagnosticSummary(
  diagnostic: Diagnostic,
  metric?: MetricResult,
): { observed: string; expected: string; difference: string } {
  return {
    observed: metric !== undefined ? formatMetricValue(metric) : 'N/A',
    expected: diagnostic.explanation,
    difference: diagnostic.cause,
  };
}

/** 构建 Evidence Trace 路径（Finding → Evaluation → Rule → Metric → Measurement → DOM）。 */
export function buildEvidenceTrace(finding: Finding): readonly string[] {
  const trace: string[] = [];
  trace.push(`Finding: ${finding.id}`);
  trace.push(`Evaluation: ${finding.evaluation.ruleId}@${finding.evaluation.ruleVersion}`);
  trace.push(
    `Metric: ${finding.evaluation.metricResult.metricId}@${finding.evaluation.metricResult.metricVersion}`,
  );
  trace.push(`Subject: ${finding.subjectId}`);
  return trace;
}
