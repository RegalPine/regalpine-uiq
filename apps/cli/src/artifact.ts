import type {
  ComponentContract,
  Diagnostic,
  EngineInfo,
  EvaluationResult,
  Finding,
  MeasurementSnapshot,
  MetricResult,
  Theme,
} from '@uiq/core';
import {
  createDefaultMetricRegistry,
  createTokenDeviationMetric,
  createTokenMatchMetric,
  createTokenResolutionMetric,
  MetricExecutionEngine,
  type TokenResolutionPortResult,
} from '@uiq/metrics';
import {
  createComponentConformanceRule,
  createDefaultRuleRegistry,
  createTokenMatchRule,
  EvaluationEngine,
} from '@uiq/rules';
import { DiagnosticEngine } from '@uiq/diagnostic';

export const SCHEMA_VERSION = '1.0.0';
export const UIQ_VERSION = '1.0.0';
export const CLI_VERSION = '1.0.0';

export interface CLIError {
  readonly code: string;
  readonly message: string;
}

export interface CLIWarning {
  readonly code: string;
  readonly message: string;
}

export interface ReproducibilityMetadata {
  readonly deterministic: boolean;
  readonly snapshotId?: string;
  readonly note?: string;
}

/** UIQ-ARCH-01 §5.3：UIQCLIResponse 单次自动化调用边界。 */
export interface CliResponse<T> {
  readonly schemaVersion: string;
  readonly uiqVersion: string;
  readonly cliVersion: string;
  readonly command: string;
  readonly status: 'COMPLETED' | 'PARTIAL' | 'UNKNOWN' | 'ERROR';
  readonly data?: T;
  readonly errors?: readonly CLIError[];
  readonly warnings?: readonly CLIWarning[];
  readonly reproducibility?: ReproducibilityMetadata;
}

export function buildResponse<T>(
  command: string,
  response: Pick<CliResponse<T>, 'status' | 'data' | 'errors' | 'warnings' | 'reproducibility'>,
): CliResponse<T> {
  return {
    schemaVersion: SCHEMA_VERSION,
    uiqVersion: UIQ_VERSION,
    cliVersion: CLI_VERSION,
    command,
    status: response.status,
    ...(response.data !== undefined ? { data: response.data } : {}),
    ...(response.errors !== undefined ? { errors: response.errors } : {}),
    ...(response.warnings !== undefined ? { warnings: response.warnings } : {}),
    ...(response.reproducibility !== undefined
      ? { reproducibility: response.reproducibility }
      : {}),
  };
}

export const METRICS_ENGINE: EngineInfo = { name: '@uiq/metrics', version: '1.0.0' };
export const RULES_ENGINE: EngineInfo = { name: '@uiq/rules', version: '1.0.0' };
export const DIAGNOSTICS_ENGINE: EngineInfo = { name: '@uiq/diagnostic', version: '1.0.0' };

/** 分析默认执行的指标集合（覆盖内置 Rule 所需及其依赖）。 */
export const ANALYSIS_METRICS: readonly { id: string; version: string }[] = [
  { id: 'COLOR.SRGB', version: '1.0.0' },
  { id: 'COLOR.CONTRAST', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
  { id: 'TYPOGRAPHY.LINE_HEIGHT', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_WEIGHT', version: '1.0.0' },
  { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
  { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
  { id: 'GEOMETRY.OVERLAP', version: '1.0.0' },
];

/** 分析默认执行的政策规则集合（内置 4 条；--tokens 时追加 TOKEN 两规则）。 */
export const ANALYSIS_RULES: readonly { id: string; version: string }[] = [
  { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
  { id: 'TYPOGRAPHY.LINE_HEIGHT.MINIMUM', version: '1.0.0' },
  { id: 'GEOMETRY.OVERLAP.NONE', version: '1.0.0' },
];

/**
 * P5：Token 分析上下文（应用编排层构造，plan Task 6）。
 * resolveToken 为解析端口实现（@uiq/tokens resolver 适配）；artifact 层负责
 * 绑定感知的 subjectId → tokenId 投影（IMPL-09 §38-41）。
 */
export interface TokenAnalysisContext {
  readonly assetId: string;
  readonly assetVersion: string;
  readonly theme?: Theme;
  readonly contract?: ComponentContract;
  readonly resolveToken: (tokenId: string) => TokenResolutionPortResult;
}

/**
 * V1.0 编排投影约定：token 声明的是组件表面属性，实际值取背景测量
 * （与 COLOR.CONTRAST 直读 color.srgb.background 同一先例；不新造指标 ID，AD-17）。
 */
const TOKEN_MEASUREMENT_TYPE = 'color.srgb.background';

/** ARCH-01 §5.1：AnalysisSnapshot / 分析产物 —— 应用组装的回归交换契约。 */
export interface AnalysisArtifact {
  readonly schemaVersion: string;
  readonly snapshot: MeasurementSnapshot;
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
  readonly engine: {
    readonly metrics: EngineInfo;
    readonly rules: EngineInfo;
    readonly diagnostics: EngineInfo;
  };
}

/** 离线确定性分析：Snapshot → Metric → Rule → Finding → Diagnostic（不访问网络/浏览器）。 */
export function runAnalysis(
  snapshot: MeasurementSnapshot,
  token?: TokenAnalysisContext,
): AnalysisArtifact {
  // 绑定投影（IMPL-09 §41）：subjectId → tokenId（首绑定优先，快照顺序确定）；
  // tokenId → subjectId 反向映射供 COMPONENT_CONFORMANCE 聚合。
  const tokenIdBySubject = new Map<string, string>();
  const subjectIdByToken = new Map<string, string>();
  if (token !== undefined && snapshot.bindings !== undefined) {
    for (const binding of snapshot.bindings) {
      if (binding.tokenId === undefined) continue;
      if (!tokenIdBySubject.has(binding.subjectId)) {
        tokenIdBySubject.set(binding.subjectId, binding.tokenId);
      }
      if (!subjectIdByToken.has(binding.tokenId)) {
        subjectIdByToken.set(binding.tokenId, binding.subjectId);
      }
    }
  }

  const subjects = [
    ...new Set([
      ...snapshot.measurements.map((m) => m.subjectId),
      ...(snapshot.bindings ?? []).map((b) => b.subjectId),
      ...(token?.contract !== undefined ? [token.contract.id] : []),
    ]),
  ].sort();

  const metricRegistry = createDefaultMetricRegistry();
  const requestedMetrics = [...ANALYSIS_METRICS];
  const ruleRegistry = createDefaultRuleRegistry();
  const requestedRules = [...ANALYSIS_RULES];

  // P5：TOKEN 三指标两规则显式注册（关键决策 7：不进 default registry）。
  if (token !== undefined) {
    // 端口适配：绑定感知的 subjectId → tokenId；无绑定的 subject 回退为 tokenId 语义。
    const port = {
      resolve(subjectId: string): TokenResolutionPortResult {
        return token.resolveToken(tokenIdBySubject.get(subjectId) ?? subjectId);
      },
    };
    metricRegistry.register(createTokenResolutionMetric(port));
    metricRegistry.register(
      createTokenMatchMetric({ actualMeasurementType: TOKEN_MEASUREMENT_TYPE }),
    );
    metricRegistry.register(
      createTokenDeviationMetric({ actualMeasurementType: TOKEN_MEASUREMENT_TYPE }),
    );
    requestedMetrics.push(
      { id: 'TOKEN.RESOLUTION', version: '1.0.0' },
      { id: 'TOKEN.MATCH', version: '1.0.0' },
      { id: 'TOKEN.DEVIATION', version: '1.0.0' },
    );

    ruleRegistry.register(createTokenMatchRule());
    requestedRules.push({ id: 'TOKEN.TOKEN_MATCH', version: '1.0.0' });
    if (token.contract !== undefined) {
      const subjectIdByTokenMap: Record<string, string> = {};
      for (const [tokenId, subjectId] of subjectIdByToken) {
        subjectIdByTokenMap[tokenId] = subjectId;
      }
      ruleRegistry.register(
        createComponentConformanceRule({
          contract: token.contract,
          subjectIdByToken: subjectIdByTokenMap,
        }),
      );
      requestedRules.push({ id: 'TOKEN.COMPONENT_CONFORMANCE', version: '1.0.0' });
    }
  }

  const metricEngine = new MetricExecutionEngine({
    engine: METRICS_ENGINE,
    registry: metricRegistry,
  });
  const metricReport = metricEngine.execute(snapshot, {
    snapshotId: snapshot.id,
    subjects,
    metrics: requestedMetrics,
  });

  const ruleEngine = new EvaluationEngine({
    engine: RULES_ENGINE,
    ruleRegistry,
  });
  const ruleReport = ruleEngine.evaluate(
    {
      snapshotId: snapshot.id,
      subjects,
      rules: requestedRules,
    },
    metricReport.results,
  );

  const diagnosticEngine = new DiagnosticEngine();
  const diagnostics = diagnosticEngine.diagnose(ruleReport.findings, metricReport.results);

  return {
    schemaVersion: SCHEMA_VERSION,
    snapshot,
    metricResults: metricReport.results,
    evaluations: ruleReport.evaluations,
    findings: ruleReport.findings,
    diagnostics,
    engine: { metrics: METRICS_ENGINE, rules: RULES_ENGINE, diagnostics: DIAGNOSTICS_ENGINE },
  };
}
