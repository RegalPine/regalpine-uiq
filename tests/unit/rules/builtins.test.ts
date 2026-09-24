import { describe, expect, it } from 'vitest';
import {
  CONTRAST_WCAG_AA,
  FONT_SIZE_MINIMUM,
  LINE_HEIGHT_MINIMUM,
  NO_OVERLAP,
  createDefaultRuleRegistry,
} from '@uiq/rules';

describe('内置 Rule', () => {
  it('CONTRAST_WCAG_AA 属性正确', () => {
    expect(CONTRAST_WCAG_AA.id).toBe('ACCESSIBILITY.CONTRAST.WCAG_AA');
    expect(CONTRAST_WCAG_AA.version).toBe('1.0.0');
    expect(CONTRAST_WCAG_AA.metricId).toBe('COLOR.CONTRAST');
    expect(CONTRAST_WCAG_AA.operator).toBe('GTE');
    expect(CONTRAST_WCAG_AA.threshold).toBe(4.5);
    expect(CONTRAST_WCAG_AA.severity).toBe('HIGH');
    expect(CONTRAST_WCAG_AA.warnThreshold).toBe(5.0);
  });

  it('FONT_SIZE_MINIMUM 属性正确', () => {
    expect(FONT_SIZE_MINIMUM.id).toBe('TYPOGRAPHY.FONT_SIZE.MINIMUM');
    expect(FONT_SIZE_MINIMUM.threshold).toBe(12);
    expect(FONT_SIZE_MINIMUM.severity).toBe('MEDIUM');
  });

  it('LINE_HEIGHT_MINIMUM 属性正确', () => {
    expect(LINE_HEIGHT_MINIMUM.id).toBe('TYPOGRAPHY.LINE_HEIGHT.MINIMUM');
    expect(LINE_HEIGHT_MINIMUM.threshold).toBe(1.2);
    expect(LINE_HEIGHT_MINIMUM.severity).toBe('LOW');
  });

  it('NO_OVERLAP 属性正确', () => {
    expect(NO_OVERLAP.id).toBe('GEOMETRY.OVERLAP.NONE');
    expect(NO_OVERLAP.operator).toBe('EQ');
    expect(NO_OVERLAP.threshold).toBe(0);
  });
});

describe('createDefaultRuleRegistry', () => {
  it('注册全部 4 个内置 Rule', () => {
    const registry = createDefaultRuleRegistry();
    expect(registry.list()).toHaveLength(4);
  });

  it('可按 ID+version 获取', () => {
    const registry = createDefaultRuleRegistry();
    expect(registry.has('ACCESSIBILITY.CONTRAST.WCAG_AA', '1.0.0')).toBe(true);
    expect(registry.has('TYPOGRAPHY.FONT_SIZE.MINIMUM', '1.0.0')).toBe(true);
    expect(registry.has('TYPOGRAPHY.LINE_HEIGHT.MINIMUM', '1.0.0')).toBe(true);
    expect(registry.has('GEOMETRY.OVERLAP.NONE', '1.0.0')).toBe(true);
  });

  it('重复注册抛出错误', () => {
    const registry = createDefaultRuleRegistry();
    expect(() => registry.register(CONTRAST_WCAG_AA)).toThrow();
  });
});
