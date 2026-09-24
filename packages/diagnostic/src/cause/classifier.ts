import type { DiagnosticCause, Finding, MetricResult } from '@uiq/core';

/**
 * 基于 Finding 和对应 MetricResult 推断原因类别。
 * 不伪造 Token 根因；无绑定时返回 UNKNOWN。
 */
export function classifyCause(finding: Finding, metricResult: MetricResult): DiagnosticCause {
  if (metricResult.status === 'ERROR') return 'METRIC';
  if (metricResult.status === 'UNKNOWN') return 'MEASUREMENT';

  const metricId = metricResult.metricId;
  if (metricId.startsWith('TOKEN.')) return 'TOKEN';
  if (metricId.startsWith('COLOR.')) return 'MEASUREMENT';
  if (metricId.startsWith('TYPOGRAPHY.')) return 'MEASUREMENT';
  if (metricId.startsWith('GEOMETRY.')) return 'MEASUREMENT';

  if (finding.type === 'TOKEN_DEVIATION') return 'TOKEN';
  if (finding.type === 'THEME_DEVIATION') return 'THEME';
  if (finding.type === 'COMPONENT_DEVIATION') return 'COMPONENT';
  if (finding.type === 'EXECUTION_ERROR') return 'CONFIGURATION';

  return 'UNKNOWN';
}
