import { DefaultRuleRegistry } from '@uiq/core';
import type { RuleRegistry } from '@uiq/core';
import { CONTRAST_WCAG_AA } from './color/contrast-wcag-aa';
import { FONT_SIZE_MINIMUM } from './typography/font-size-minimum';
import { LINE_HEIGHT_MINIMUM } from './typography/line-height-minimum';
import { NO_OVERLAP } from './geometry/no-overlap';

const ALL_RULES = [CONTRAST_WCAG_AA, FONT_SIZE_MINIMUM, LINE_HEIGHT_MINIMUM, NO_OVERLAP] as const;

/** 创建包含全部内置 Rule 的注册表。 */
export function createDefaultRuleRegistry(): RuleRegistry {
  const registry = new DefaultRuleRegistry();
  for (const rule of ALL_RULES) {
    registry.register(rule);
  }
  return registry;
}
