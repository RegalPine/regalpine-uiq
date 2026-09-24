import { readFileSync } from 'node:fs';
import {
  deserializeBaseline,
  runRegression as executeRegression,
  type Baseline,
  type RegressionReport,
} from '@uiq/regression';
import { buildResponse, type AnalysisArtifact, type CliResponse } from '../artifact';
import { CliError } from '../errors';
import { validateArtifact, formatViolations } from '../validate';

export interface RegressionOptions {
  readonly baselinePath: string;
  readonly currentPath: string;
}

export interface RegressionData {
  readonly status: 'COMPLETED' | 'INCOMPARABLE';
  readonly report?: RegressionReport;
  readonly reasons?: readonly { aspect: string; reason: string }[];
  readonly hasNewFailures: boolean;
}

function loadBaseline(path: string): Baseline {
  let json: string;
  try {
    json = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取 baseline 文件 ${path}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    return deserializeBaseline(json);
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `baseline 文件格式无效：${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function loadCurrentArtifact(path: string): AnalysisArtifact {
  let json: string;
  try {
    json = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取当前分析文件 ${path}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `当前分析文件 JSON 解析失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const violations = validateArtifact(parsed);
  if (violations.length > 0) {
    throw new CliError('INPUT_ERROR', `当前分析文件不符合契约：${formatViolations(violations)}`);
  }
  return parsed as AnalysisArtifact;
}

/**
 * regression：比较 baseline 与当前分析产物，产出回归报告。
 * 不重新执行 Rule（IMPL-11 §44）；只比较两侧已有 EvaluationResult。
 */
export async function runRegression(
  options: RegressionOptions,
): Promise<CliResponse<RegressionData>> {
  const baseline = loadBaseline(options.baselinePath);
  const current = loadCurrentArtifact(options.currentPath);

  const outcome = executeRegression({ baseline, current });

  if (outcome.status === 'INCOMPARABLE') {
    return buildResponse<RegressionData>('regression', {
      status: 'ERROR',
      errors: [
        {
          code: 'EXECUTION_ERROR',
          message: `基线不可比：${outcome.reasons.map((r) => `${r.aspect}: ${r.detail}`).join('; ')}`,
        },
      ],
      data: {
        status: 'INCOMPARABLE',
        reasons: outcome.reasons.map((r) => ({ aspect: r.aspect, reason: r.detail })),
        hasNewFailures: false,
      },
    });
  }

  const hasNewFailures = outcome.report.summary.newFailures > 0;

  return buildResponse<RegressionData>('regression', {
    status: 'COMPLETED',
    data: {
      status: 'COMPLETED',
      report: outcome.report,
      hasNewFailures,
    },
    reproducibility: {
      deterministic: true,
      note: '回归比较确定性：相同双侧输入产出相同分类结论',
    },
  });
}
