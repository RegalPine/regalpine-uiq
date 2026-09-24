/**
 * IMPL-07 §11-12：优先使用稳定 `data-uiq-id`；缺失时生成运行时 ID，
 * 此类 ID 不保证跨页面执行稳定，Regression/Conformance 应使用稳定 ID。
 */
const UIQ_ID_ATTRIBUTE = 'data-uiq-id';

export interface ResolvedEntityId {
  readonly id: string;
  readonly stable: boolean;
}

export function hasStableEntityId(element: Element): boolean {
  return element.getAttribute(UIQ_ID_ATTRIBUTE) !== null;
}

export function resolveEntityId(element: Element, fallbackIndex: number): ResolvedEntityId {
  const explicit = element.getAttribute(UIQ_ID_ATTRIBUTE)?.trim();
  if (explicit !== undefined && explicit !== '') {
    return { id: explicit, stable: true };
  }
  return { id: `browser:element:${String(fallbackIndex).padStart(3, '0')}`, stable: false };
}
