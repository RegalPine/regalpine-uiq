/**
 * 建议规则注册表（IMPL-17 §15）。
 * 采用精确 id + version 寻址；禁止 latest（对齐 Metric/Rule Registry 的精确版本原则）。
 */
import type { RecommendationRule } from './recommendation-rule';

export class RecommendationRuleRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecommendationRuleRegistryError';
  }
}

const keyOf = (id: string, version: string): string => `${id}@${version}`;

export class RecommendationRuleRegistry {
  private readonly rules = new Map<string, RecommendationRule>();

  register(rule: RecommendationRule): void {
    const key = keyOf(rule.id, rule.version);
    if (this.rules.has(key)) {
      throw new RecommendationRuleRegistryError(`建议规则重复注册：${key}`);
    }
    this.rules.set(key, rule);
  }

  /** 精确版本寻址；不存在时抛错（不做 latest 回退）。 */
  get(id: string, version: string): RecommendationRule {
    const rule = this.rules.get(keyOf(id, version));
    if (rule === undefined) {
      throw new RecommendationRuleRegistryError(`建议规则未注册：${id}@${version}`);
    }
    return rule;
  }

  /** 按注册键稳定排序（确定性遍历顺序）。 */
  list(): readonly RecommendationRule[] {
    return [...this.rules.values()].sort((a, b) =>
      keyOf(a.id, a.version) < keyOf(b.id, b.version)
        ? -1
        : keyOf(a.id, a.version) > keyOf(b.id, b.version)
          ? 1
          : 0,
    );
  }
}
