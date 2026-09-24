/**
 * P9：元素选择器状态机（IMPL-10 §51）。
 *
 * hover → 轻量高亮（不触发全量采集）
 * click → 锁定（触发全量采集）
 * clear → 清除选择
 *
 * AD-12：选择器不干扰 getBoundingClientRect（overlay pointer-events:none）。
 * 反例：快速切换目标时旧结果不显示（通过 sequence 检查）。
 */

export interface ElementSelection {
  readonly elementId: string;
  readonly dataUiqId: string | null;
  readonly tagName: string;
  readonly rect: DOMRect;
  readonly lockedAt: number;
}

export interface ElementSelectorState {
  readonly hoveredId: string | null;
  readonly selected: ElementSelection | null;
  readonly isSelecting: boolean;
}

export const INITIAL_SELECTOR_STATE: ElementSelectorState = {
  hoveredId: null,
  selected: null,
  isSelecting: false,
};

export type SelectorAction =
  | { type: 'HOVER'; elementId: string }
  | { type: 'HOVER_CLEAR' }
  | { type: 'LOCK'; selection: ElementSelection }
  | { type: 'CLEAR' }
  | { type: 'SET_SELECTING'; isSelecting: boolean };

/** 元素选择器 reducer（纯函数）。 */
export function selectorReducer(
  state: ElementSelectorState,
  action: SelectorAction,
): ElementSelectorState {
  switch (action.type) {
    case 'HOVER':
      return { ...state, hoveredId: action.elementId };
    case 'HOVER_CLEAR':
      return { ...state, hoveredId: null };
    case 'LOCK':
      return { ...state, selected: action.selection, hoveredId: null };
    case 'CLEAR':
      return { ...state, selected: null, hoveredId: null };
    case 'SET_SELECTING':
      return { ...state, isSelecting: action.isSelecting };
    default:
      return state;
  }
}

/** 从 DOM 元素创建选择结果。 */
export function createElementSelection(element: Element): ElementSelection {
  const dataUiqId = element.getAttribute('data-uiq-id');
  const rect = element.getBoundingClientRect();
  return {
    elementId: getElementId(element),
    dataUiqId,
    tagName: element.tagName.toLowerCase(),
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      toJSON: () => ({}),
    },
    lockedAt: Date.now(),
  };
}

/** 生成元素唯一 ID（优先 data-uiq-id，否则用路径）。 */
export function getElementId(element: Element): string {
  const dataUiqId = element.getAttribute('data-uiq-id');
  if (dataUiqId !== null && dataUiqId !== '') {
    return dataUiqId;
  }
  return buildElementPath(element);
}

/** 构建元素路径（从根到目标的标签序列）。 */
export function buildElementPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current !== null && current.tagName !== 'HTML') {
    const tag = current.tagName.toLowerCase();
    const index = getElementIndex(current);
    parts.unshift(index > 0 ? `${tag}:nth(${index})` : tag);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

function getElementIndex(element: Element): number {
  let index = 0;
  let sibling = element.previousElementSibling;
  while (sibling !== null) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}
