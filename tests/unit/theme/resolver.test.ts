import { describe, expect, it } from 'vitest';
import { applyTheme } from '@uiq/theme';
import { createTokenResolver } from '@uiq/tokens';
import type { DesignToken, Theme } from '@uiq/core';

function token(partial: Pick<DesignToken, 'id'> & Partial<DesignToken>): DesignToken {
  return { name: partial.id, layer: 'PRIMITIVE', valueType: 'COLOR', ...partial } as DesignToken;
}

/** base：primitive → semantic → component 三层链。 */
const base: readonly DesignToken[] = [
  token({ id: 'color.blue.600', value: '#2563EB' }),
  token({ id: 'color.action.primary', layer: 'SEMANTIC', reference: 'color.blue.600' }),
  token({ id: 'button.primary.background', layer: 'COMPONENT', reference: 'color.action.primary' }),
];

const dark: Theme = {
  id: 'dark',
  version: '1.0.0',
  name: 'Dark',
  tokens: { 'color.blue.600': '#60A5FA' },
};

describe('applyTheme（IMPL-09 §20-23、TK-01 §32）', () => {
  it('Dark override 独立生效：覆盖 primitive 后下游解析值随之变化', () => {
    const resolver = createTokenResolver(applyTheme(base, dark));
    const result = resolver.resolve('button.primary.background');
    expect(result.status).toBe('RESOLVED');
    expect(result.resolvedValue).toBe('#60A5FA');
    expect(result.chain).toEqual([
      'button.primary.background',
      'color.action.primary',
      'color.blue.600',
    ]);
  });

  it('Light 不受污染：无覆盖解析原值，Dark 调用不改变 base（多主题隔离反例）', () => {
    const baseSnapshot = structuredClone(base);
    const light: Theme = { id: 'light', version: '1.0.0', name: 'Light', tokens: {} };

    const lightResolver = createTokenResolver(applyTheme(base, light));
    expect(lightResolver.resolve('button.primary.background').resolvedValue).toBe('#2563EB');

    // Dark 参与解析后，Light 再次独立解析仍为原值（IMPL-09 §21）。
    createTokenResolver(applyTheme(base, dark));
    const lightAgain = createTokenResolver(applyTheme(base, light));
    expect(lightAgain.resolve('button.primary.background').resolvedValue).toBe('#2563EB');

    expect(base).toEqual(baseSnapshot);
  });

  it('覆盖 semantic token：value 替换、reference 移除、layer/valueType/name/role 保持', () => {
    const themed = applyTheme(
      [
        token({ id: 'p', value: '#2563EB' }),
        token({ id: 's', layer: 'SEMANTIC', role: 'action', reference: 'p' }),
      ],
      { id: 'dark', version: '1.0.0', name: 'Dark', tokens: { s: '#93C5FD' } },
    );
    const semantic = themed.find((t) => t.id === 's');
    expect(semantic).toMatchObject({
      layer: 'SEMANTIC',
      valueType: 'COLOR',
      role: 'action',
      value: '#93C5FD',
    });
    expect(semantic).not.toHaveProperty('reference');
  });

  it('覆盖指向不存在的 token：不凭空构造，有效集不含新 token', () => {
    const themed = applyTheme(base, {
      id: 'dark',
      version: '1.0.0',
      name: 'Dark',
      tokens: { 'no.such.token': '#000000' },
    });
    expect(themed.map((t) => t.id).sort()).toEqual([...base.map((t) => t.id)].sort());
  });

  it('覆盖值为 undefined 视为未提供', () => {
    const themed = applyTheme([token({ id: 'a', value: '#2563EB' })], {
      id: 'dark',
      version: '1.0.0',
      name: 'Dark',
      tokens: { a: undefined },
    });
    expect(themed[0]?.value).toBe('#2563EB');
  });
});
