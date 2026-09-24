/**
 * 全局摘要聚合（IMPL-17 §5）。
 * 不变式：六态总和必须等于评价总数（PLAN P7-01 验证要求）。
 */
import type { QualitySummary } from '../model/quality';
import type { ReportFacts } from './facts';

export class SummaryInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SummaryInvariantError';
  }
}

export function aggregateSummary(facts: ReportFacts): QualitySummary {
  const counts = { pass: 0, fail: 0, warn: 0, unknown: 0, notApplicable: 0, error: 0 };
  for (const evaluation of facts.evaluations) {
    switch (evaluation.state) {
      case 'PASS':
        counts.pass += 1;
        break;
      case 'FAIL':
        counts.fail += 1;
        break;
      case 'WARN':
        counts.warn += 1;
        break;
      case 'UNKNOWN':
        counts.unknown += 1;
        break;
      case 'NOT_APPLICABLE':
        counts.notApplicable += 1;
        break;
      case 'ERROR':
        counts.error += 1;
        break;
      default:
        throw new SummaryInvariantError(
          `评价出现未知状态 "${(evaluation as { state: unknown }).state}"，拒绝聚合（六态不变式无法成立）`,
        );
    }
  }
  const total =
    counts.pass + counts.fail + counts.warn + counts.unknown + counts.notApplicable + counts.error;
  if (total !== facts.evaluations.length) {
    throw new SummaryInvariantError(
      `六态总和 ${total} 不等于评价总数 ${facts.evaluations.length}，摘要不变式被破坏`,
    );
  }
  return {
    measuredElements: new Set(facts.snapshot.measurements.map((m) => m.subjectId)).size,
    metricResults: facts.metricResults.length,
    evaluations: facts.evaluations.length,
    ...counts,
    findings: facts.findings.length,
  };
}
