import { describe, expect, it } from 'vitest';
import { createDefaultRuleRegistry, resolvePolicyRules } from '@uiq/rules';
import type { PolicyProfileDefinition } from '@uiq/rules';

describe('PolicyProfile', () => {
  const registry = createDefaultRuleRegistry();

  it('解析有效 Profile', () => {
    const profile: PolicyProfileDefinition = {
      id: 'UIQ.ACCESSIBILITY',
      version: '1.0.0',
      name: 'Accessibility',
      rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' }],
    };
    const rules = resolvePolicyRules(profile, registry);
    expect(rules).toHaveLength(1);
    expect(rules[0]!.id).toBe('ACCESSIBILITY.CONTRAST.WCAG_AA');
  });

  it('多 Rule Profile', () => {
    const profile: PolicyProfileDefinition = {
      id: 'UIQ.BASIC',
      version: '1.0.0',
      name: 'Basic',
      rules: [
        { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
        { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
      ],
    };
    const rules = resolvePolicyRules(profile, registry);
    expect(rules).toHaveLength(2);
  });

  it('版本不匹配抛出错误', () => {
    const profile: PolicyProfileDefinition = {
      id: 'UIQ.BAD',
      version: '1.0.0',
      name: 'Bad',
      rules: [{ id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '9.9.9' }],
    };
    expect(() => resolvePolicyRules(profile, registry)).toThrow('不存在');
  });

  it('不存在的 Rule 抛出错误', () => {
    const profile: PolicyProfileDefinition = {
      id: 'UIQ.BAD2',
      version: '1.0.0',
      name: 'Bad2',
      rules: [{ id: 'NONEXISTENT', version: '1.0.0' }],
    };
    expect(() => resolvePolicyRules(profile, registry)).toThrow('不存在');
  });
});
