import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  generateQualityReport,
  renderJson,
  renderMarkdown,
  renderHtml,
  type UIQualityReport,
} from '@uiq/reporting';
import { buildResponse, type AnalysisArtifact, type CliResponse } from '../artifact';
import { CliError } from '../errors';
import { formatViolations, validateArtifact } from '../validate';

export type ReportFormat = 'json' | 'markdown' | 'html';

export interface ReportOptions {
  readonly target: string;
  readonly format: ReportFormat;
  readonly outputPath?: string;
  readonly projectId?: string;
}

export interface ReportData {
  readonly report: UIQualityReport;
  readonly renderedFormat: ReportFormat;
  readonly outputPath?: string;
}

function loadAnalysisArtifact(target: string): AnalysisArtifact {
  let json: string;
  try {
    json = readFileSync(target, 'utf-8');
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取分析产物文件 ${target}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `分析产物 JSON 解析失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const violations = validateArtifact(parsed);
  if (violations.length > 0) {
    throw new CliError('INPUT_ERROR', `分析产物不符合契约：${formatViolations(violations)}`);
  }
  return parsed as AnalysisArtifact;
}

function parseFormat(format: string): ReportFormat {
  const normalized = format.toLowerCase();
  if (normalized === 'json' || normalized === 'markdown' || normalized === 'html') {
    return normalized;
  }
  throw new CliError('INPUT_ERROR', `无效的 report 格式：${format}。有效值：json, markdown, html`);
}

/**
 * report：从已有分析产物生成质量报告（不暗中执行分析 —— P10-02 退出条件）。
 * 输入必须是 AnalysisArtifact（含 metricResults/evaluations/findings/diagnostics）。
 * 仅 MeasurementSnapshot（无分析结果）不构成合法输入。
 */
export async function runReport(options: ReportOptions): Promise<CliResponse<ReportData>> {
  const format = parseFormat(options.format);
  const artifact = loadAnalysisArtifact(options.target);

  const report = generateQualityReport(
    {
      projectId: options.projectId ?? 'uiq-project',
      snapshot: artifact.snapshot,
      metricResults: artifact.metricResults,
      evaluations: artifact.evaluations,
      findings: artifact.findings,
      diagnostics: artifact.diagnostics,
      engine: artifact.engine.metrics,
    },
    {
      generatedAt: new Date().toISOString(),
    },
  );

  const rendered =
    format === 'json'
      ? renderJson(report)
      : format === 'markdown'
        ? renderMarkdown(report)
        : renderHtml(report);

  let outputPath: string | undefined;
  if (options.outputPath !== undefined) {
    outputPath = resolve(options.outputPath);
    writeFileSync(outputPath, rendered, 'utf-8');
  }

  return buildResponse<ReportData>('report', {
    status: 'COMPLETED',
    data: {
      report,
      renderedFormat: format,
      ...(outputPath !== undefined ? { outputPath } : {}),
    },
    reproducibility: {
      deterministic: true,
      note: '报告生成确定性：相同分析产物与 generatedAt 产出相同报告',
    },
  });
}
