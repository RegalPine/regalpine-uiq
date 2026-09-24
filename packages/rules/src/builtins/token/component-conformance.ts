/**
 * TOKEN.COMPONENT_CONFORMANCE@1.0.0（ER-02 §60、IMPL-09 §45-47）。
 * 输入：Component Contract + TOKEN.MATCH（+ TOKEN.DEVIATION）结果。
 * 与 TOKEN_MATCH 分离（IMPL-09 §47）：个别 token 匹配 PASS 不代表组件契约满足——
 * required token 任一缺失/未匹配 → FAIL；存在无法确认的 token（无明确 FAIL）→ UNKNOWN。
 *
 * 规则经工厂注入契约与 tokenId→subjectId 映射，评估在 contract.id 虚拟 subject 上进行，
 * 通过引擎 customEvaluate 钩子跨 subject 聚合各 subjectId 的 TOKEN.MATCH@1.0.0 结果。
 * 工厂显式注册：不进 createDefaultRuleRegistry（关键决策 7）。
 */
import type { ComponentContract, Evidence, MetricResult, Severity } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type {
  CustomEvaluationContext,
  CustomEvaluationOutcome,
  EnrichedRuleDefinition,
} from '../../evaluation/engine';

export interface ComponentConformanceOptions {
  readonly contract: ComponentContract;
  /** tokenId → 承载该 token TOKEN.MATCH 结果的 subjectId。 */
  readonly subjectIdByToken: Readonly<Record<string, string>>;
  readonly severity?: Severity;
}

export type TokenConformanceOutcome = 'MATCH' | 'NO_MATCH' | 'UNKNOWN' | 'MISSING';

export interface ComponentConformanceAggregate {
  readonly requiredTotal: number;
  readonly matched: number;
  readonly noMatch: number;
  readonly unresolved: number;
  readonly missing: number;
  readonly details: readonly {
    readonly tokenId: string;
    readonly subjectId?: string;
    readonly outcome: TokenConformanceOutcome;
  }[];
}

function outcomeFor(
  context: CustomEvaluationContext,
  tokenId: string,
  subjectId: string | undefined,
): { subjectId?: string; outcome: TokenConformanceOutcome } {
  if (subjectId === undefined) {
    return { outcome: 'MISSING' };
  }
  const result = context.metricMap.get(`${subjectId}::TOKEN.MATCH@1.0.0`);
  if (!result || result.status !== 'AVAILABLE') {
    return { subjectId, outcome: 'MISSING' };
  }
  const matchOutcome = (result.value as { result?: unknown } | undefined)?.result;
  if (matchOutcome === 'MATCH') return { subjectId, outcome: 'MATCH' };
  if (matchOutcome === 'NO_MATCH') return { subjectId, outcome: 'NO_MATCH' };
  // result 缺失或 UNKNOWN → 无法确认，UNKNOWN（不猜测）。
  return { subjectId, outcome: 'UNKNOWN' };
}

export function createComponentConformanceRule(
  options: ComponentConformanceOptions,
): EnrichedRuleDefinition {
  const { contract, subjectIdByToken } = options;
  return {
    id: 'TOKEN.COMPONENT_CONFORMANCE',
    version: '1.0.0',
    metricId: 'TOKEN.MATCH',
    metricVersion: '1.0.0',
    severity: options.severity ?? 'HIGH',
    applicability: {
      evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
        return 'APPLICABLE';
      },
    },
    customEvaluate(context: CustomEvaluationContext): CustomEvaluationOutcome | null {
      // 评估发生在 contract.id 虚拟 subject 上；其他 subject 不适用。
      if (context.subjectId !== contract.id) {
        return { state: 'NOT_APPLICABLE' };
      }
      const details = contract.requiredTokens.map((tokenId) => {
        const entry = outcomeFor(context, tokenId, subjectIdByToken[tokenId]);
        return { tokenId, ...entry };
      });
      const aggregate: ComponentConformanceAggregate = {
        requiredTotal: details.length,
        matched: details.filter((d) => d.outcome === 'MATCH').length,
        noMatch: details.filter((d) => d.outcome === 'NO_MATCH').length,
        unresolved: details.filter((d) => d.outcome === 'UNKNOWN').length,
        missing: details.filter((d) => d.outcome === 'MISSING').length,
        details,
      };

      // 契约未声明 required token → 无要求可验证。
      if (aggregate.requiredTotal === 0) {
        return { state: 'NOT_APPLICABLE', message: '契约未声明 required token' };
      }
      let state: CustomEvaluationOutcome['state'];
      let message: string | undefined;
      if (aggregate.noMatch > 0 || aggregate.missing > 0) {
        state = 'FAIL';
        const causes = [
          ...(aggregate.missing > 0 ? [`${aggregate.missing} 个缺失`] : []),
          ...(aggregate.noMatch > 0 ? [`${aggregate.noMatch} 个未匹配`] : []),
        ];
        message = `组件 "${contract.id}" 不满足 Token 契约：${causes.join('，')}`;
      } else if (aggregate.unresolved > 0) {
        state = 'UNKNOWN';
        message = `组件 "${contract.id}" 有 ${aggregate.unresolved} 个 required token 无法确认匹配`;
      } else {
        state = 'PASS';
      }

      // 聚合事实（真实指纹）：EvaluationResult.metricResult 需要可追溯依据。
      // metricId 用规则自身 ID 而非 TOKEN.MATCH：聚合不是 registry 指标事实（AD-17），
      // 且避免与引擎在 contract.id 上执行的 TOKEN.MATCH 占位在诊断池中撞 key。
      const metricResult: MetricResult<ComponentConformanceAggregate> = {
        metricId: 'TOKEN.COMPONENT_CONFORMANCE',
        metricVersion: '1.0.0',
        subjectId: contract.id,
        status: 'AVAILABLE',
        value: aggregate,
        dependencies: [],
        fingerprint: fingerprint({
          type: 'TOKEN_COMPONENT_CONFORMANCE_AGGREGATE',
          version: '1.0.0',
          subjectId: contract.id,
          data: aggregate,
        }),
      };
      const evidence: readonly Evidence[] = [
        {
          id: `ev-token-match-${contract.id}`,
          type: 'METRIC',
          referenceId: 'TOKEN.MATCH@1.0.0',
          relation: 'EVALUATED_BY',
        },
        {
          id: `ev-contract-${contract.id}`,
          type: 'RULE_CONFIGURATION',
          referenceId: `${contract.id}@${contract.version}`,
          relation: 'DEFINED_BY',
        },
      ];
      return { state, metricResult, evidence, ...(message !== undefined ? { message } : {}) };
    },
  };
}
