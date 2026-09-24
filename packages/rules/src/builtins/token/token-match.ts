/**
 * TOKEN.TOKEN_MATCH@1.0.0（ER-02 §59、IMPL-09 §43，AD-17 裁决的规则 ID）。
 * 判断 actualToken == expectedToken：metricId=TOKEN.MATCH@1.0.0、valueKey='result'、EQ 'MATCH'。
 * 传播语义：MATCH → PASS；NO_MATCH → FAIL；metric UNKNOWN → UNKNOWN（引擎传播）。
 * Token Match 与视觉质量不是同一概念（ER-02 §59）：颜色完全一致不代表符合可访问性规范。
 * 工厂显式注册：不进 createDefaultRuleRegistry（配套 TOKEN 指标未注册时应缺省，而非静默评估）。
 */
import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export function createTokenMatchRule(): EnrichedRuleDefinition {
  return {
    id: 'TOKEN.TOKEN_MATCH',
    version: '1.0.0',
    metricId: 'TOKEN.MATCH',
    metricVersion: '1.0.0',
    operator: 'EQ',
    threshold: 'MATCH',
    severity: 'MEDIUM',
    valueKey: 'result',
    applicability: {
      evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
        return 'APPLICABLE';
      },
    },
  };
}
