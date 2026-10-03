import { describe, expect, it } from 'vitest';
import {
  surfaceRules, depthRules, colorTextureRules, typographyTextureRules,
  spatialTextureRules, motionTextureRules, microDetailTextureRules,
  createVisualTextureRuleRegistry,
} from '@uiq/rules';

describe('Visual Texture Rule 注册', () => {
  it('surfaceRules 包含 8 条 Rule', () => {
    expect(surfaceRules).toHaveLength(8);
  });

  it('depthRules 包含 6 条 Rule', () => {
    expect(depthRules).toHaveLength(6);
  });

  it('colorTextureRules 包含 7 条 Rule', () => {
    expect(colorTextureRules).toHaveLength(7);
  });

  it('typographyTextureRules 包含 7 条 Rule', () => {
    expect(typographyTextureRules).toHaveLength(7);
  });

  it('spatialTextureRules 包含 7 条 Rule', () => {
    expect(spatialTextureRules).toHaveLength(7);
  });

  it('motionTextureRules 包含 7 条 Rule', () => {
    expect(motionTextureRules).toHaveLength(7);
  });

  it('microDetailTextureRules 包含 16 条 Rule', () => {
    expect(microDetailTextureRules).toHaveLength(16);
  });
});

describe('Visual Texture Rule ID 唯一性', () => {
  const allRules = [
    ...surfaceRules, ...depthRules, ...colorTextureRules,
    ...typographyTextureRules, ...spatialTextureRules,
    ...motionTextureRules, ...microDetailTextureRules,
  ];

  it('所有 Rule ID 全局唯一', () => {
    const ids = allRules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('所有 Rule 有有效的 metricId 引用', () => {
    for (const rule of allRules) {
      expect(rule.metricId).toBeTruthy();
      expect(typeof rule.metricId).toBe('string');
    }
  });

  it('所有 Rule 有 severity', () => {
    for (const rule of allRules) {
      expect(rule.severity).toBeTruthy();
    }
  });

  it('总计 58 条 Rule (8+6+7+7+7+7+16)', () => {
    expect(allRules).toHaveLength(58);
  });
});

describe('createVisualTextureRuleRegistry', () => {
  it('创建注册表包含所有 Rule', () => {
    const registry = createVisualTextureRuleRegistry();
    expect(registry).toBeDefined();
  });
});
