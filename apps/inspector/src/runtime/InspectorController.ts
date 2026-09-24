/**
 * P9：Inspector 控制器（IMPL-10 §53）。
 *
 * 编排 BrowserMeasurementAdapter → MetricEngine → RuleEngine → FindingFactory → DiagnosticEngine。
 * 每次分析递增 requestSequence，旧结果到达时比对 sequence 丢弃（AD-20）。
 * 不重新实现领域算法；消费 @uiq/metrics、@uiq/rules、@uiq/diagnostic 公共 API。
 */
import type {
  Diagnostic,
  EvaluationResult,
  Finding,
  MeasurementSnapshot,
  MetricResult,
} from '@uiq/core';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';
import { DiagnosticEngine } from '@uiq/diagnostic';
import { createInspectorSessionManager, type InspectorSessionManager } from './InspectorSession';
import { createAnalysisCache, computeConfigHash, type AnalysisCache } from './AnalysisCache';

const METRICS_ENGINE = { name: '@uiq/metrics', version: '1.0.0' } as const;
const RULES_ENGINE = { name: '@uiq/rules', version: '1.0.0' } as const;
const DIAGNOSTICS_ENGINE = { name: '@uiq/diagnostic', version: '1.0.0' } as const;

/** IMPL-10 §6：Inspector 单次分析结果。 */
export interface InspectionResult {
  readonly subjectId: string | null;
  readonly snapshot: MeasurementSnapshot;
  readonly metrics: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
  readonly engine: {
    readonly metrics: typeof METRICS_ENGINE;
    readonly rules: typeof RULES_ENGINE;
    readonly diagnostics: typeof DIAGNOSTICS_ENGINE;
  };
}

export interface InspectorControllerOptions {
  /** 默认分析指标集合。 */
  readonly metrics?: readonly { id: string; version: string }[];
  /** 默认分析规则集合。 */
  readonly rules?: readonly { id: string; version: string }[];
}

const DEFAULT_METRICS: readonly { id: string; version: string }[] = [
  { id: 'COLOR.SRGB', version: '1.0.0' },
  { id: 'COLOR.CONTRAST', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
  { id: 'TYPOGRAPHY.LINE_HEIGHT', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_WEIGHT', version: '1.0.0' },
  { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
  { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
  { id: 'GEOMETRY.OVERLAP', version: '1.0.0' },
];

const DEFAULT_RULES: readonly { id: string; version: string }[] = [
  { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
  { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
  { id: 'TYPOGRAPHY.LINE_HEIGHT.MINIMUM', version: '1.0.0' },
  { id: 'GEOMETRY.OVERLAP.NONE', version: '1.0.0' },
];

export interface InspectorController {
  /** 会话管理器（暴露给 UI 层监听）。 */
  readonly session: InspectorSessionManager;
  /** 分析缓存。 */
  readonly cache: AnalysisCache;
  /** 对快照执行完整分析链。旧会话结果自动丢弃。 */
  analyze(
    snapshot: MeasurementSnapshot,
    subjectId?: string,
    config?: Record<string, unknown>,
  ): Promise<InspectionResult>;
  /** 取消当前分析。 */
  cancel(): void;
}

/** 创建 Inspector 控制器。 */
export function createInspectorController(
  options: InspectorControllerOptions = {},
): InspectorController {
  const sessionManager = createInspectorSessionManager();
  const cache = createAnalysisCache();
  const metricIds = options.metrics ?? DEFAULT_METRICS;
  const ruleIds = options.rules ?? DEFAULT_RULES;

  return {
    session: sessionManager,
    cache,

    async analyze(
      snapshot: MeasurementSnapshot,
      subjectId?: string,
      config?: Record<string, unknown>,
    ): Promise<InspectionResult> {
      const session = sessionManager.startSession();
      const configHash = computeConfigHash({ metricIds, ruleIds, config });

      // 检查缓存
      const cached = cache.get<InspectionResult>({
        snapshotId: snapshot.id,
        themeId: null,
        configHash,
      });
      if (cached !== null) {
        return cached.value;
      }

      // 检查是否已被取消
      if (session.isCancelled) {
        throw new Error('Session was cancelled before analysis started');
      }

      const subjects = [...new Set(snapshot.measurements.map((m) => m.subjectId))].sort();

      // Metric 执行
      const metricRegistry = createDefaultMetricRegistry();
      const metricEngine = new MetricExecutionEngine({
        engine: METRICS_ENGINE,
        registry: metricRegistry,
      });
      const metricReport = metricEngine.execute(snapshot, {
        snapshotId: snapshot.id,
        subjects,
        metrics: [...metricIds],
      });

      // 检查取消
      if (sessionManager.isCurrent(session.requestSequence) === false) {
        throw new StaleResultError(session.requestSequence);
      }

      // Rule 执行
      const ruleRegistry = createDefaultRuleRegistry();
      const ruleEngine = new EvaluationEngine({
        engine: RULES_ENGINE,
        ruleRegistry,
      });
      const ruleReport = ruleEngine.evaluate(
        {
          snapshotId: snapshot.id,
          subjects,
          rules: [...ruleIds],
        },
        metricReport.results,
      );

      // 检查取消
      if (sessionManager.isCurrent(session.requestSequence) === false) {
        throw new StaleResultError(session.requestSequence);
      }

      // Diagnostic
      const diagnosticEngine = new DiagnosticEngine();
      const diagnostics = diagnosticEngine.diagnose(ruleReport.findings, metricReport.results);

      const result: InspectionResult = {
        subjectId: subjectId ?? null,
        snapshot,
        metrics: metricReport.results,
        evaluations: ruleReport.evaluations,
        findings: ruleReport.findings,
        diagnostics,
        engine: {
          metrics: METRICS_ENGINE,
          rules: RULES_ENGINE,
          diagnostics: DIAGNOSTICS_ENGINE,
        },
      };

      // 缓存结果
      cache.set({ snapshotId: snapshot.id, themeId: null, configHash }, result);

      return result;
    },

    cancel(): void {
      sessionManager.cancelCurrent();
    },
  };
}

/** 旧结果错误：当异步结果到达时会话已切换。 */
export class StaleResultError extends Error {
  readonly staleSequence: number;
  constructor(sequence: number) {
    super(`Result for sequence ${sequence} is stale; session has moved on`);
    this.staleSequence = sequence;
    this.name = 'StaleResultError';
  }
}
