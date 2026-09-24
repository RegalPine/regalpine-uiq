import { describe, expect, it } from 'vitest';
import { hasStableEntityId, resolveEntityId } from '@uiq/browser';

function makeElement(attributes: Record<string, string>): {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
} {
  return {
    getAttribute: (name) => attributes[name] ?? null,
    hasAttribute: (name) => name in attributes,
  };
}

describe('resolveEntityId（IMPL-07 §11-12）', () => {
  it('优先使用稳定 data-uiq-id', () => {
    const el = makeElement({ 'data-uiq-id': 'submit-button' });
    expect(resolveEntityId(el as unknown as Element, 7)).toEqual({
      id: 'submit-button',
      stable: true,
    });
    expect(hasStableEntityId(el as unknown as Element)).toBe(true);
  });

  it('缺失时生成 fallback 运行时 ID（三位序号）', () => {
    const el = makeElement({});
    expect(resolveEntityId(el as unknown as Element, 1).id).toBe('browser:element:001');
    expect(resolveEntityId(el as unknown as Element, 12).id).toBe('browser:element:012');
    expect(resolveEntityId(el as unknown as Element, 12).stable).toBe(false);
  });

  it('空白 data-uiq-id 视为缺失', () => {
    const el = makeElement({ 'data-uiq-id': '   ' });
    expect(resolveEntityId(el as unknown as Element, 3).stable).toBe(false);
  });

  it('data-uiq-id 值会被 trim', () => {
    const el = makeElement({ 'data-uiq-id': ' btn ' });
    expect(resolveEntityId(el as unknown as Element, 0).id).toBe('btn');
  });
});
