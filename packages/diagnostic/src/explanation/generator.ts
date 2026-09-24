import type { ComparisonOperator, Finding, MetricResult } from '@uiq/core';

/**
 * 为 Finding 生成人类可读的解释。
 * 格式：Observed / Expected / Difference / Reason
 * 不加入无证据结论。
 */
export function generateExplanation(finding: Finding, metricResult: MetricResult): string {
  const evaluation = finding.evaluation;
  const metricId = metricResult.metricId;
  const actual = metricResult.value;

  if (evaluation.state === 'ERROR') {
    return `执行 ${evaluation.ruleId} 时发生错误：${evaluation.message ?? '未知错误'}`;
  }

  if (evaluation.state === 'UNKNOWN') {
    return `${metricId} 无法获得足够证据进行评价`;
  }

  const operator = evaluation.metricResult.metricId ? resolveOperator(evaluation) : '';
  const threshold = resolveThreshold(evaluation);

  const parts: string[] = [];

  parts.push(`Measured ${metricId} = ${formatActual(actual)}`);

  if (threshold !== undefined) {
    parts.push(`required ${operator} ${formatActual(threshold)}`);
  }

  if (evaluation.state === 'FAIL') {
    parts.push(`${describeMetric(metricId)} is below the required threshold`);
  } else if (evaluation.state === 'WARN') {
    parts.push(`${describeMetric(metricId)} meets minimum but is near the warning boundary`);
  }

  return parts.join('. ') + '.';
}

function resolveOperator(evaluation: Finding['evaluation']): string {
  const rule = evaluation;
  if (rule.message) {
    const match = rule.message.match(/(\b(?:EQ|NE|GT|GTE|LT|LTE|IN|NOT_IN)\b)/);
    if (match) return match[1] as ComparisonOperator;
  }
  return 'GTE';
}

function resolveThreshold(evaluation: Finding['evaluation']): unknown {
  if (evaluation.message) {
    const match = evaluation.message.match(/(?:阈值|要求|minimum)\s+([\d.]+)/);
    if (match) return parseFloat(match[1]!);
  }
  return undefined;
}

function formatActual(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (value === undefined) return 'N/A';
  return JSON.stringify(value);
}

function describeMetric(metricId: string): string {
  if (metricId.startsWith('COLOR.CONTRAST')) return 'Contrast ratio';
  if (metricId.startsWith('COLOR.')) return 'Color value';
  if (metricId.startsWith('TYPOGRAPHY.FONT_SIZE')) return 'Font size';
  if (metricId.startsWith('TYPOGRAPHY.LINE_HEIGHT')) return 'Line height';
  if (metricId.startsWith('TYPOGRAPHY.')) return 'Typography value';
  if (metricId.startsWith('GEOMETRY.')) return 'Geometry value';
  return metricId;
}
