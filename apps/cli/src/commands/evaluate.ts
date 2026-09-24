import type { MeasurementSnapshot, MetricResult, EvaluationResult } from '@uiq/core';
import { readFileSync } from 'node:fs';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';
import {
  ANALYSIS_METRICS,
  ANALYSIS_RULES,
  METRICS_ENGINE,
  RULES_ENGINE,
  buildResponse,
  type CliResponse,
} from '../artifact';
import { CliError } from '../errors';
import { formatViolations, validateSnapshot } from '../validate';

export interface EvaluateOptions {
  readonly target: string;
  readonly subjects?: string;
}

export interface EvaluateData {
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly hasFailures: boolean;
}

function isSnapshotFile(target: string): boolean {
  if (
    target.startsWith('file://') ||
    target.startsWith('http://') ||
    target.startsWith('https://')
  ) {
    return false;
  }
  return target.endsWith('.json');
}

function loadSnapshot(target: string): MeasurementSnapshot {
  if (!isSnapshotFile(target)) {
    throw new CliError(
      'INPUT_ERROR',
      'evaluate 仅支持离线快照文件（.json）；浏览器目标请先使用 measure 或 snapshot 命令采集',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(target, 'utf-8')) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取快照文件 ${target}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const violations = validateSnapshot(parsed);
  if (violations.length > 0) {
    throw new CliError(
      'INPUT_ERROR',
      `输入不是有效的 MeasurementSnapshot：${formatViolations(violations)}`,
    );
  }
  return parsed as MeasurementSnapshot;
}

/**
 * evaluate：Metric → Rule 执行（不生成 Finding/Diagnostic）。
 * 用于快速检查指标值与规则评价，不进入诊断链。
 */
export async function runEvaluate(options: EvaluateOptions): Promise<CliResponse<EvaluateData>> {
  const snapshot = loadSnapshot(options.target);

  const subjects = [...new Set(snapshot.measurements.map((m) => m.subjectId))].sort();

  const metricRegistry = createDefaultMetricRegistry();
  const metricEngine = new MetricExecutionEngine({
    engine: METRICS_ENGINE,
    registry: metricRegistry,
  });
  const metricReport = metricEngine.execute(snapshot, {
    snapshotId: snapshot.id,
    subjects,
    metrics: [...ANALYSIS_METRICS],
  });

  const ruleRegistry = createDefaultRuleRegistry();
  const ruleEngine = new EvaluationEngine({
    engine: RULES_ENGINE,
    ruleRegistry,
  });
  const ruleReport = ruleEngine.evaluate(
    {
      snapshotId: snapshot.id,
      subjects,
      rules: [...ANALYSIS_RULES],
    },
    metricReport.results,
  );

  const hasFailures = ruleReport.evaluations.some((e) => e.state === 'FAIL');

  return buildResponse<EvaluateData>('evaluate', {
    status: 'COMPLETED',
    data: {
      metricResults: metricReport.results,
      evaluations: ruleReport.evaluations,
      hasFailures,
    },
    reproducibility: {
      deterministic: true,
      snapshotId: snapshot.id,
      note: '离线评价确定性：相同快照产生相同评价结果',
    },
  });
}
