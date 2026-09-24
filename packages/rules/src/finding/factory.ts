import type { EvaluationResult, Finding, FindingType } from '@uiq/core';
import { fingerprint } from '@uiq/core';

/** 从评价结果生成 Finding 记录。 */
export class FindingFactory {
  private readonly timestamp: number;

  constructor(timestamp?: number) {
    this.timestamp = timestamp ?? Date.now();
  }

  /** 按 ER-01 §31 规则生成 Finding：FAIL/WARN/ERROR 产生 Finding，其余不产生。 */
  createFindings(evaluations: readonly EvaluationResult[]): Finding[] {
    const findings: Finding[] = [];

    for (const evaluation of evaluations) {
      if (
        evaluation.state !== 'FAIL' &&
        evaluation.state !== 'WARN' &&
        evaluation.state !== 'ERROR'
      ) {
        continue;
      }

      const findingType = resolveFindingType(evaluation);
      const idSource = `${evaluation.ruleId}:${evaluation.subjectId}:${evaluation.metricResult.metricId}`;
      const id = `F-${fingerprint(idSource).slice(0, 8)}`;
      const fp = fingerprint({
        ruleId: evaluation.ruleId,
        ruleVersion: evaluation.ruleVersion,
        subjectId: evaluation.subjectId,
        metricId: evaluation.metricResult.metricId,
        state: evaluation.state,
      });

      findings.push({
        id,
        fingerprint: fp,
        type: findingType,
        state: 'DETECTED',
        severity: evaluation.severity,
        subjectId: evaluation.subjectId,
        evaluation,
        evidence: evaluation.evidence,
        createdAt: this.timestamp,
        updatedAt: this.timestamp,
      });
    }

    return findings;
  }
}

function resolveFindingType(evaluation: EvaluationResult): FindingType {
  if (evaluation.state === 'ERROR') return 'EXECUTION_ERROR';
  const metricId = evaluation.metricResult.metricId;
  if (metricId.startsWith('COLOR.')) return 'COLOR';
  if (metricId.startsWith('TYPOGRAPHY.')) return 'TYPOGRAPHY';
  if (metricId.startsWith('GEOMETRY.')) return 'VALUE_VIOLATION';
  if (metricId.startsWith('TOKEN.')) return 'TOKEN_DEVIATION';
  return 'VALUE_VIOLATION';
}
