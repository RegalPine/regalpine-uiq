import type { EvaluationResult, Severity } from '@uiq/core';
import type { AnalysisSnapshot } from '@uiq/regression';
import { computeSummary, type GateInput, type RegressionSummaryCounts } from '@uiq/rules';
import type { AnalysisArtifact } from './artifact';

/**
 * CLI 内部回归适配（P6-05：不新增命令，八命令留 P10）。
 * AnalysisArtifact 是 regression 包 AnalysisSnapshot 的兼容子形状（ARCH-01 §5.1），
 * 投影只补可选字段，不复制领域类型。
 */
export function toAnalysisSnapshot(artifact: AnalysisArtifact, themeId?: string): AnalysisSnapshot {
  return {
    schemaVersion: artifact.schemaVersion,
    snapshot: artifact.snapshot,
    metricResults: artifact.metricResults,
    evaluations: artifact.evaluations,
    findings: artifact.findings,
    diagnostics: artifact.diagnostics,
    engine: artifact.engine,
    ...(themeId !== undefined ? { themeId } : {}),
  };
}

/** 回归事实投影（Gate 消费的标量 DTO；severity 由调用方从回归记录提取）。 */
export interface RegressionGateFacts {
  readonly summary: RegressionSummaryCounts;
  readonly highestNewFailureSeverity?: Severity;
}

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/** 评价集合 → GateInput：六态计数 + FAIL 最高 severity（ER-02 §64 映射输入）。 */
export function toGateInput(
  evaluations: readonly EvaluationResult[],
  regression?: RegressionGateFacts,
): GateInput {
  const evaluationSummary = computeSummary(evaluations);
  let highestFailureSeverity: Severity | undefined;
  for (const evaluation of evaluations) {
    if (evaluation.state !== 'FAIL') continue;
    if (
      highestFailureSeverity === undefined ||
      SEVERITY_RANK[evaluation.severity] > SEVERITY_RANK[highestFailureSeverity]
    ) {
      highestFailureSeverity = evaluation.severity;
    }
  }
  return {
    evaluationSummary,
    ...(highestFailureSeverity !== undefined ? { highestFailureSeverity } : {}),
    ...(regression !== undefined
      ? {
          regressionSummary: regression.summary,
          ...(regression.highestNewFailureSeverity !== undefined
            ? { highestNewFailureSeverity: regression.highestNewFailureSeverity }
            : {}),
        }
      : {}),
  };
}
