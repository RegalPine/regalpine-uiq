import type {
  EvaluationResult,
  EvaluationState,
  Evidence,
  MetricResult,
  RuleApplicabilityContext,
  RuleConfiguration,
  RuleDefinition,
  RuleRegistry,
  EngineInfo,
} from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { evaluateOperator } from '../operators';
import { evaluateRange } from '../ranges';
import { applyTolerance } from '../tolerance';
import { FindingFactory } from '../finding/factory';
import { computeSummary } from './summary';
import type { EvaluationRequest, EvaluationReport } from './types';

/** 扩展 Rule 定义，支持可选的 warn 阈值、数值提取字段等元数据。 */
export interface EnrichedRuleDefinition extends RuleDefinition {
  readonly warnThreshold?: number;
  /** 当 MetricResult.value 为对象时，参与比较的字段名（如 ratio/px/result）。 */
  readonly valueKey?: string;
  /**
   * P5：自定义评估钩子（如 TOKEN.COMPONENT_CONFORMANCE 的跨 subject 聚合）。
   * 返回非 null 时完全接管本次评估（在 applicability/操作符路径之前）；
   * 返回 null 时落回通用 operator/range 路径。
   */
  readonly customEvaluate?: (context: CustomEvaluationContext) => CustomEvaluationOutcome | null;
}

export interface CustomEvaluationContext {
  readonly subjectId: string;
  /** 全部 MetricResult（跨 subject），key 为 `${subjectId}::${metricId}@${metricVersion}`。 */
  readonly metricMap: ReadonlyMap<string, MetricResult>;
  readonly configuration?: RuleConfiguration;
}

export interface CustomEvaluationOutcome {
  readonly state: EvaluationState;
  readonly message?: string;
  /** 规则自主提供的事实依据（如聚合结果）；缺省时用主 metric 的占位 stub。 */
  readonly metricResult?: MetricResult;
  readonly evidence?: readonly Evidence[];
}

export interface EvaluationEngineOptions {
  readonly engine: EngineInfo;
  readonly ruleRegistry: RuleRegistry;
}

export class EvaluationEngine {
  private readonly engineInfo: EngineInfo;
  private readonly ruleRegistry: RuleRegistry;

  constructor(options: EvaluationEngineOptions) {
    this.engineInfo = options.engine;
    this.ruleRegistry = options.ruleRegistry;
  }

  evaluate(request: EvaluationRequest, metricResults: readonly MetricResult[]): EvaluationReport {
    const evaluations: EvaluationResult[] = [];
    const metricMap = buildMetricMap(metricResults);

    for (const subjectId of request.subjects) {
      for (const ruleRef of request.rules) {
        const rule = this.ruleRegistry.get(ruleRef.id, ruleRef.version);
        if (!rule) {
          evaluations.push(
            this.errorResult(
              ruleRef.id,
              ruleRef.version,
              subjectId,
              `Rule 未找到：${ruleRef.id}@${ruleRef.version}`,
            ),
          );
          continue;
        }

        const config = findConfiguration(
          request.configuration,
          ruleRef.id,
          ruleRef.version,
          subjectId,
        );
        const result = this.safeEvaluate(rule, subjectId, metricMap, config);
        evaluations.push(result);
      }
    }

    evaluations.sort((a, b) => {
      const subjectCmp = a.subjectId.localeCompare(b.subjectId);
      if (subjectCmp !== 0) return subjectCmp;
      const ruleCmp = a.ruleId.localeCompare(b.ruleId);
      if (ruleCmp !== 0) return ruleCmp;
      return a.ruleVersion.localeCompare(b.ruleVersion);
    });

    const findingFactory = new FindingFactory();
    const findings = findingFactory.createFindings(evaluations);
    const summary = computeSummary(evaluations);

    return {
      snapshotId: request.snapshotId,
      evaluations,
      findings,
      summary,
      engine: this.engineInfo,
    };
  }

  private safeEvaluate(
    rule: RuleDefinition,
    subjectId: string,
    metricMap: Map<string, MetricResult>,
    config: RuleConfiguration | undefined,
  ): EvaluationResult {
    try {
      return this.evaluateRule(rule, subjectId, metricMap, config);
    } catch (cause) {
      return this.errorResult(
        rule.id,
        rule.version,
        subjectId,
        cause instanceof Error ? cause.message : String(cause),
      );
    }
  }

  private evaluateRule(
    rule: RuleDefinition,
    subjectId: string,
    metricMap: Map<string, MetricResult>,
    config: RuleConfiguration | undefined,
  ): EvaluationResult {
    const enriched = rule as EnrichedRuleDefinition;

    // P5：自定义评估钩子优先（跨 subject 聚合等场景）；返回 null 落回通用路径。
    if (enriched.customEvaluate) {
      const outcome = enriched.customEvaluate({
        subjectId,
        metricMap,
        ...(config !== undefined ? { configuration: config } : {}),
      });
      if (outcome !== null) {
        return this.customResult(rule, subjectId, outcome);
      }
    }

    const metricKey = `${rule.metricId}@${rule.metricVersion}`;
    const metricResult = metricMap.get(`${subjectId}::${metricKey}`);

    if (!metricResult) {
      return this.stateResult(rule, subjectId, 'UNKNOWN', '必需 Metric 不可用');
    }
    // P8 前置修复（P3-01/02）：保留 Metric ERROR，不转换为 UNKNOWN
    if (metricResult.status === 'ERROR') {
      return this.stateResult(rule, subjectId, 'ERROR', '必需 Metric 状态为 ERROR');
    }
    if (metricResult.status === 'UNKNOWN') {
      return this.stateResult(rule, subjectId, 'UNKNOWN', 'Metric 状态为 UNKNOWN');
    }

    const applicabilityCtx: RuleApplicabilityContext = {
      subjectId,
      snapshot: { id: '', capturedAt: 0, source: { type: 'OTHER' }, measurements: [] },
      metricResult,
    };
    const applicability = rule.applicability.evaluate(applicabilityCtx);
    if (applicability === 'NOT_APPLICABLE') {
      return this.stateResult(rule, subjectId, 'NOT_APPLICABLE');
    }
    if (applicability === 'UNKNOWN') {
      return this.stateResult(rule, subjectId, 'UNKNOWN', '适用性未知');
    }

    const effectiveThreshold = this.resolveThreshold(rule, config);
    // P5：threshold 为字符串时提取字符串值（EQ/NE）；否则走数值提取。
    const thresholdIsString = typeof effectiveThreshold === 'string';
    const comparableValue = thresholdIsString
      ? extractStringValue(metricResult.value, enriched.valueKey)
      : extractNumericValue(metricResult.value, enriched.valueKey);

    let state: EvaluationState;
    let message: string | undefined;

    if (rule.operator !== undefined && effectiveThreshold !== undefined) {
      if (comparableValue === undefined) {
        return this.errorResult(rule.id, rule.version, subjectId, 'Metric 值类型与操作符不匹配');
      }

      const operatorResult = evaluateOperator(rule.operator, comparableValue, effectiveThreshold);
      if (operatorResult === null) {
        return this.errorResult(rule.id, rule.version, subjectId, 'Metric 值类型与操作符不匹配');
      }

      if (operatorResult) {
        const comfortable =
          enriched.warnThreshold !== undefined
            ? evaluateOperator(rule.operator, comparableValue, enriched.warnThreshold)
            : true;
        if (comfortable === false) {
          state = 'WARN';
          message = `${rule.id}: 值 ${formatValue(comparableValue)} 满足要求 ${formatValue(effectiveThreshold)}，但未达警告阈值 ${formatValue(enriched.warnThreshold)}`;
        } else {
          state = 'PASS';
        }
      } else {
        state = 'FAIL';
        message = `${rule.id}: 值 ${formatValue(comparableValue)} 未达要求 ${rule.operator} ${formatValue(effectiveThreshold)}`;
      }
    } else if (rule.range !== undefined) {
      if (comparableValue === undefined || typeof comparableValue !== 'number') {
        return this.errorResult(rule.id, rule.version, subjectId, 'Metric 值类型与区间约束不匹配');
      }
      state = evaluateRange(rule.range, comparableValue) ? 'PASS' : 'FAIL';
      if (state === 'FAIL') {
        message = `${rule.id}: 值 ${formatValue(comparableValue)} 不在区间 [${rule.range.min ?? '-∞'}, ${rule.range.max ?? '+∞'}] 内`;
      }
    } else {
      return this.errorResult(rule.id, rule.version, subjectId, 'Rule 缺少操作符/阈值或区间定义');
    }

    const evidence = this.buildEvidence(rule);
    const fp = fingerprint({
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      metricId: rule.metricId,
      state,
    });

    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      state,
      severity: rule.severity,
      metricResult,
      evidence,
      fingerprint: fp,
      ...(message !== undefined ? { message } : {}),
    };
  }

  private resolveThreshold(rule: RuleDefinition, config: RuleConfiguration | undefined): unknown {
    let threshold: unknown =
      config?.values?.['threshold'] !== undefined ? config.values['threshold'] : rule.threshold;
    if (typeof threshold === 'number' && rule.tolerance !== undefined) {
      threshold = applyTolerance(threshold, rule.tolerance);
    }
    return threshold;
  }

  /** P5：customEvaluate 接管路径的结果构造。 */
  private customResult(
    rule: RuleDefinition,
    subjectId: string,
    outcome: CustomEvaluationOutcome,
  ): EvaluationResult {
    const fp = fingerprint({
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      metricId: rule.metricId,
      state: outcome.state,
    });
    const metricResult = outcome.metricResult ?? {
      metricId: rule.metricId,
      metricVersion: rule.metricVersion,
      subjectId,
      // 降级 stub 未产生 metric 事实：status 一律 UNKNOWN（AVAILABLE 必须携带真实 value）。
      status: 'UNKNOWN' as const,
      dependencies: [],
      fingerprint: fingerprint({
        metricId: rule.metricId,
        metricVersion: rule.metricVersion,
        subjectId,
        status: 'UNKNOWN',
      }),
    };
    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      state: outcome.state,
      severity: rule.severity,
      metricResult,
      evidence: outcome.evidence ?? [],
      fingerprint: fp,
      ...(outcome.message !== undefined ? { message: outcome.message } : {}),
    };
  }

  private buildEvidence(rule: RuleDefinition): readonly Evidence[] {
    return [
      {
        id: `ev-metric-${rule.metricId}`,
        type: 'METRIC',
        referenceId: `${rule.metricId}@${rule.metricVersion}`,
        relation: 'EVALUATED_BY',
      },
    ];
  }

  private stateResult(
    rule: RuleDefinition,
    subjectId: string,
    state: EvaluationState,
    message?: string,
  ): EvaluationResult {
    const fp = fingerprint({
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      metricId: rule.metricId,
      state,
    });
    // 降级 stub 未产生 metric 事实：status 一律 UNKNOWN（AVAILABLE 必须携带真实 value，
    // 否则违反 core schema 的 value/status 一致性，P5 产物校验发现）。
    return {
      ruleId: rule.id,
      ruleVersion: rule.version,
      subjectId,
      state,
      severity: rule.severity,
      metricResult: {
        metricId: rule.metricId,
        metricVersion: rule.metricVersion,
        subjectId,
        status: 'UNKNOWN',
        dependencies: [],
        // 契约要求 fingerprint 为 64 位十六进制（schema ^[0-9a-f]{64}$），降级 stub 也必须有真实指纹。
        fingerprint: fingerprint({
          metricId: rule.metricId,
          metricVersion: rule.metricVersion,
          subjectId,
          status: 'UNKNOWN',
        }),
      },
      evidence: [],
      fingerprint: fp,
      ...(message !== undefined ? { message } : {}),
    };
  }

  private errorResult(
    ruleId: string,
    ruleVersion: string,
    subjectId: string,
    errorMessage: string,
  ): EvaluationResult {
    const fp = fingerprint({ ruleId, ruleVersion, subjectId, state: 'ERROR' });
    return {
      ruleId,
      ruleVersion,
      subjectId,
      state: 'ERROR',
      severity: 'INFO',
      metricResult: {
        metricId: '',
        metricVersion: '',
        subjectId,
        status: 'ERROR',
        dependencies: [],
        // 契约要求 fingerprint 为 64 位十六进制；此处无 metric 上下文，用 rule 维度派生。
        fingerprint: fingerprint({ ruleId, ruleVersion, subjectId, status: 'ERROR' }),
      },
      evidence: [],
      fingerprint: fp,
      message: errorMessage,
    };
  }
}

function buildMetricMap(results: readonly MetricResult[]): Map<string, MetricResult> {
  const map = new Map<string, MetricResult>();
  for (const result of results) {
    const key = `${result.subjectId}::${result.metricId}@${result.metricVersion}`;
    map.set(key, result);
  }
  return map;
}

/**
 * P8 前置修复（P3-01/02）：按目标绑定配置。
 * 目标配置（values.subjectId 匹配）优先于全局配置。
 */
function findConfiguration(
  configurations: readonly RuleConfiguration[] | undefined,
  ruleId: string,
  ruleVersion: string,
  subjectId: string,
): RuleConfiguration | undefined {
  if (!configurations) return undefined;
  const matches = configurations.filter(
    (c) => c.ruleId === ruleId && c.ruleVersion === ruleVersion,
  );
  // 目标配置优先
  const targetConfig = matches.find((c) => c.values?.['subjectId'] === subjectId);
  if (targetConfig) return targetConfig;
  // 回退到全局配置（无 subjectId 绑定）
  return matches.find((c) => c.values?.['subjectId'] === undefined);
}

function extractNumericValue(value: unknown, valueKey: string | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (value !== null && typeof value === 'object' && valueKey !== undefined) {
    const field = (value as Record<string, unknown>)[valueKey];
    if (typeof field === 'number' && Number.isFinite(field)) return field;
  }
  return undefined;
}

/** P5（ER-02 §59）：threshold 为字符串时提取字符串值（value 本身或 valueKey 字段）。 */
function extractStringValue(value: unknown, valueKey: string | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (value !== null && typeof value === 'object' && valueKey !== undefined) {
    const field = (value as Record<string, unknown>)[valueKey];
    if (typeof field === 'string') return field;
  }
  return undefined;
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  return JSON.stringify(value);
}
