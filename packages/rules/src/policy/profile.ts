import type { RuleDefinition, RuleRegistry } from '@uiq/core';

export interface PolicyRuleReference {
  readonly id: string;
  readonly version: string;
}

export interface PolicyProfileDefinition {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly rules: readonly PolicyRuleReference[];
  readonly configuration?: Readonly<Record<string, unknown>>;
}

/** 解析 PolicyProfile 中的 Rule 引用，版本不匹配时显式抛出错误。 */
export function resolvePolicyRules(
  profile: PolicyProfileDefinition,
  registry: RuleRegistry,
): RuleDefinition[] {
  const resolved: RuleDefinition[] = [];

  for (const ref of profile.rules) {
    const rule = registry.get(ref.id, ref.version);
    if (!rule) {
      throw new Error(
        `PolicyProfile ${profile.id}@${profile.version} 引用了不存在的 Rule：${ref.id}@${ref.version}`,
      );
    }
    resolved.push(rule);
  }

  return resolved;
}
