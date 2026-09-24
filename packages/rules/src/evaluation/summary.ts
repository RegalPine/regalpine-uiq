import type { EvaluationResult } from '@uiq/core';
import type { EvaluationSummary } from './types';

/** 从评价结果数组计算汇总统计。 */
export function computeSummary(evaluations: readonly EvaluationResult[]): EvaluationSummary {
  let pass = 0;
  let fail = 0;
  let warn = 0;
  let notApplicable = 0;
  let unknown = 0;
  let error = 0;

  for (const evaluation of evaluations) {
    switch (evaluation.state) {
      case 'PASS':
        pass++;
        break;
      case 'FAIL':
        fail++;
        break;
      case 'WARN':
        warn++;
        break;
      case 'NOT_APPLICABLE':
        notApplicable++;
        break;
      case 'UNKNOWN':
        unknown++;
        break;
      case 'ERROR':
        error++;
        break;
    }
  }

  return {
    total: evaluations.length,
    pass,
    fail,
    warn,
    notApplicable,
    unknown,
    error,
  };
}
