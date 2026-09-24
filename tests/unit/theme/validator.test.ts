import { describe, expect, it } from 'vitest';
import { validateTheme } from '@uiq/theme';
import type { DesignToken, Theme } from '@uiq/core';

function token(partial: Pick<DesignToken, 'id'> & Partial<DesignToken>): DesignToken {
  return { name: partial.id, layer: 'PRIMITIVE', valueType: 'COLOR', ...partial } as DesignToken;
}

function theme(id: string, tokens: Record<string, unknown>): Theme {
  return { id, version: '1.0.0', name: id, tokens };
}

/** 健全资产：primitive → semantic → component。 */
const sound: readonly DesignToken[] = [
  token({ id: 'color.blue.600', value: '#2563EB' }),
  token({ id: 'color.action.primary', layer: 'SEMANTIC', reference: 'color.blue.600' }),
  token({ id: 'button.primary.background', layer: 'COMPONENT', reference: 'color.action.primary' }),
];

describe('validateTheme（IMPL-09 §24、TK-01 §25-28）', () => {
  it('健全资产 + 合法空覆盖 → PASS，issues 为空', () => {
    const result = validateTheme(sound, theme('light', {}));
    expect(result.integrity).toBe('PASS');
    expect(result.issues).toEqual([]);
  });

  it('覆盖不存在的 token → OVERRIDE_UNKNOWN_TARGET → FAIL', () => {
    const result = validateTheme(sound, theme('dark', { 'no.such.token': '#000000' }));
    expect(result.integrity).toBe('FAIL');
    expect(result.issues.map((i) => i.code)).toEqual(['OVERRIDE_UNKNOWN_TARGET']);
    expect(result.issues[0]?.tokenId).toBe('no.such.token');
  });

  it('断裂引用 → REFERENCE_BROKEN（资产事实），未覆盖时同时报 UNRESOLVED', () => {
    const broken: readonly DesignToken[] = [
      token({ id: 'p', value: '#2563EB' }),
      token({ id: 's', layer: 'SEMANTIC', reference: 'missing.token' }),
    ];
    const light = validateTheme(broken, theme('light', {}));
    expect(light.integrity).toBe('FAIL');
    expect(light.issues.map((i) => i.code).sort()).toEqual(['REFERENCE_BROKEN', 'UNRESOLVED']);

    // 主题覆盖修复可解析性：UNRESOLVED 不再报（该主题下有效），
    // 但 REFERENCE_BROKEN 仍报（资产声明过断裂引用是事实）。
    const dark = validateTheme(broken, theme('dark', { s: '#93C5FD' }));
    expect(dark.issues.map((i) => i.code)).toEqual(['REFERENCE_BROKEN']);
  });

  it('环 → CYCLE，issue.path 为完整环路径 A→B→C→A', () => {
    const cyclic: readonly DesignToken[] = [
      token({ id: 'a', reference: 'b' }),
      token({ id: 'b', reference: 'c' }),
      token({ id: 'c', reference: 'a' }),
    ];
    const result = validateTheme(cyclic, theme('light', {}));
    expect(result.integrity).toBe('FAIL');
    const cycle = result.issues.find((i) => i.code === 'CYCLE');
    expect(cycle?.path).toEqual(['a', 'b', 'c', 'a']);
  });

  it('required 不在资产中 → REQUIRED_MISSING；required 断裂且未被覆盖 → REQUIRED_UNRESOLVED', () => {
    const broken: readonly DesignToken[] = [
      token({ id: 'p', value: '#2563EB' }),
      token({ id: 's', layer: 'SEMANTIC', reference: 'missing' }),
    ];
    const missing = validateTheme(broken, theme('light', {}), ['ghost']);
    expect(missing.issues.map((i) => i.code)).toContain('REQUIRED_MISSING');

    const unresolved = validateTheme(broken, theme('light', {}), ['s']);
    expect(unresolved.issues.map((i) => i.code)).toContain('REQUIRED_UNRESOLVED');
  });

  it('主题覆盖修复 required token → 无 REQUIRED_* issue（每主题独立评价，IMPL-09 §21）', () => {
    const broken: readonly DesignToken[] = [
      token({ id: 'p', value: '#2563EB' }),
      token({ id: 's', layer: 'SEMANTIC', reference: 'missing' }),
    ];
    const fixed = validateTheme(broken, theme('dark', { s: '#93C5FD' }), ['s']);
    expect(fixed.issues.map((i) => i.code)).toEqual(['REFERENCE_BROKEN']);
  });

  it('orphan 不影响 integrity（TK-01 §27：ORPHAN → INFO，不是 integrity 检查项）', () => {
    const withOrphan: readonly DesignToken[] = [
      ...sound,
      token({ id: 'color.blue.700', value: '#1D4ED8' }),
    ];
    const result = validateTheme(withOrphan, theme('light', {}));
    expect(result.integrity).toBe('PASS');
    expect(result.issues).toEqual([]);
  });

  it('同输入同输出（确定性排序）', () => {
    const first = validateTheme(sound, theme('dark', { ghost: 1 }));
    const second = validateTheme(sound, theme('dark', { ghost: 1 }));
    expect(second).toEqual(first);
  });
});
