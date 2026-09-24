/**
 * 报告生成器（IMPL-17 §33-34）。
 * 管线：validate → aggregate → group → link → recommend → impact → verification → reproducibility。
 * 生成报告不启动浏览器或引擎（PLAN P7 退出条件）；仅测量快照不能暗中扩展成完整分析。
 * 时间与报告 ID 显式注入（AD-04）；同输入生成等价报告（§34 确定性）。
 */
import { fingerprint } from '@uiq/core';
import type {
  ComponentContract,
  Diagnostic,
  EvaluationResult,
  Finding,
  EngineInfo,
  MeasurementSnapshot,
  MetricResult,
  TokenBinding,
} from '@uiq/core';
import type { ConformanceSummary } from '@uiq/conformance';
import type { RegressionReport } from '@uiq/regression';

import { aggregateDimensions } from '../aggregation/dimensions';
import { aggregateSummary } from '../aggregation/summary';
import type { ReportFacts } from '../aggregation/facts';
import { linkDiagnostics } from '../diagnostic/link-diagnostics';
import { toDiagnosticSummaries } from '../diagnostic/root-cause';
import type { ImpactTrace } from '../impact/calculate-impact';
import type { FindingSummary } from '../model/finding';
import { QUALITY_REPORT_SCHEMA_VERSION } from '../model/report';
import type { ReproducibilityMetadata } from '../model/reproducibility';
import type { ReportScope } from '../model/scope';
import type { ThemeProjection } from '../recommendation/context';
import { recommend } from '../recommendation/engine';
import { initialRecommendationRules } from '../recommendation/rules/initial-rules';
import {
  RecommendationRuleRegistry,
  type RecommendationRuleRegistry as Registry,
} from '../recommendation/registry';
import type { UIQualityReport } from '../model/report';

export class ReportInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportInputError';
  }
}

/** 报告输入：分析产物的只读引用（PLAN P7-01 QualityReportInput）。 */
export interface QualityReportInput {
  readonly projectId: string;
  readonly snapshot: MeasurementSnapshot;
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
  readonly engine: EngineInfo;
  readonly themeId?: string;
  readonly tokenBindings?: readonly TokenBinding[];
  readonly components?: readonly ComponentContract[];
  readonly conformance?: ConformanceSummary;
  readonly regression?: RegressionReport;
  readonly configuration?: Readonly<Record<string, unknown>>;
}

export interface GenerateQualityReportOptions {
  /** ISO-8601；调用方注入（AD-04：生成器不取时钟）。 */
  readonly generatedAt: string;
  /** 缺省由报告事实指纹派生（确定性）。 */
  readonly reportId?: string;
  readonly themes?: readonly ThemeProjection[];
  readonly impactTraces?: readonly ImpactTrace[];
  /** 建议规则注册表；缺省注册全部 V1.0 内置规则。 */
  readonly registry?: Registry;
}

function factsOf(input: QualityReportInput): ReportFacts {
  return {
    snapshot: input.snapshot,
    metricResults: input.metricResults,
    evaluations: input.evaluations,
    findings: input.findings,
    diagnostics: input.diagnostics,
  };
}

function scopeOf(input: QualityReportInput): ReportScope {
  const viewport = input.snapshot.environment?.viewport;
  return {
    snapshotIds: [input.snapshot.id],
    subjects: [...new Set(input.snapshot.measurements.map((m) => m.subjectId))].sort(),
    themes: input.themeId !== undefined ? [input.themeId] : [],
    viewports: viewport !== undefined ? [`${viewport.width}x${viewport.height}`] : [],
    generatedFrom: 'ANALYSIS',
  };
}

export function generateQualityReport(
  input: QualityReportInput,
  options: GenerateQualityReportOptions,
): UIQualityReport {
  // validate：仅测量快照不能暗中扩展成完整分析（退出条件）。
  if (input.projectId === '') throw new ReportInputError('projectId 不能为空');
  if (input.snapshot.id === '') throw new ReportInputError('snapshot.id 不能为空');
  if (input.metricResults.length === 0 && input.evaluations.length === 0) {
    throw new ReportInputError(
      '输入缺少指标结果与评价：仅测量快照不能暗中扩展成完整分析（必须先完成指标与规则执行）',
    );
  }

  const facts = factsOf(input);
  const summary = aggregateSummary(facts);
  const dimensions = aggregateDimensions(facts);
  const linked = linkDiagnostics(facts);
  const findingSummaries: readonly FindingSummary[] = [...facts.findings]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((finding) => ({
      id: finding.id,
      findingType: finding.type,
      severity: finding.severity,
      subjectId: finding.subjectId,
      ruleId: finding.evaluation.ruleId,
      ruleVersion: finding.evaluation.ruleVersion,
      state: finding.state,
      fingerprint: finding.fingerprint,
      diagnosticIds: linked.get(finding.id) ?? [],
    }));
  const diagnosticSummaries = toDiagnosticSummaries(facts);

  const effectiveRegistry =
    options.registry ??
    (() => {
      // 缺省注册全部 V1.0 内置规则（每次生成独立注册表，保持纯函数语义）。
      const created = new RecommendationRuleRegistry();
      for (const rule of initialRecommendationRules()) created.register(rule);
      return created;
    })();

  const recommendations = recommend(
    {
      findings: facts.findings,
      diagnostics: facts.diagnostics,
      evaluations: facts.evaluations,
      metrics: facts.metricResults,
      ...(input.tokenBindings !== undefined ? { tokenBindings: input.tokenBindings } : {}),
      ...(input.components !== undefined ? { components: input.components } : {}),
      ...(options.themes !== undefined ? { themes: options.themes } : {}),
      ...(options.impactTraces !== undefined ? { impactTraces: options.impactTraces } : {}),
    },
    effectiveRegistry,
  );

  const reproducibility: ReproducibilityMetadata = {
    deterministic: true,
    engine: input.engine,
    metricVersions: [
      ...new Set(facts.metricResults.map((m) => `${m.metricId}@${m.metricVersion}`)),
    ].sort(),
    ruleVersions: [...new Set(facts.evaluations.map((e) => `${e.ruleId}@${e.ruleVersion}`))].sort(),
    ...(input.configuration !== undefined ? { configuration: input.configuration } : {}),
  };

  const reportWithoutId = {
    version: QUALITY_REPORT_SCHEMA_VERSION,
    projectId: input.projectId,
    generatedAt: options.generatedAt,
    scope: scopeOf(input),
    summary,
    dimensions,
    findings: findingSummaries,
    diagnostics: diagnosticSummaries,
    recommendations,
    ...(input.conformance !== undefined ? { conformance: input.conformance } : {}),
    ...(input.regression !== undefined ? { regression: input.regression } : {}),
    reproducibility,
  };
  const id = options.reportId ?? fingerprint(reportWithoutId);
  return { id, ...reportWithoutId };
}
