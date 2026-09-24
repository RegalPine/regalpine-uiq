import type { SRGB } from '@uiq/color';
import { compositeOver, parseColor } from '@uiq/color';

/**
 * IMPL-07 §24：渐变、图片、多层背景等复杂背景 V1.0 不做视觉近似 → COMPLEX。
 * SOLID 表示 backgroundColor 可直接解析；TRANSPARENT 表示透明（α=0）。
 */
export type BackgroundKind = 'SOLID' | 'TRANSPARENT' | 'COMPLEX';

/** 计算顶层逗号分隔的段数（忽略括号内逗号），用于判断多重背景层。 */
function topLevelSegments(value: string): readonly string[] {
  const segments: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) {
      segments.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim() !== '') segments.push(current.trim());
  return segments;
}

/** IMPL-07 §19-24：背景分类。纯函数，便于 Node 单元测试。 */
export function classifyBackground(
  backgroundColor: string,
  backgroundImage: string,
): BackgroundKind {
  const image = backgroundImage.trim().toLowerCase();
  if (image !== '' && image !== 'none') return 'COMPLEX';
  const segments = topLevelSegments(backgroundColor);
  if (segments.length === 0) return 'TRANSPARENT';
  if (segments.length > 1) return 'COMPLEX';
  const value = segments[0] ?? '';
  if (value === '') return 'TRANSPARENT';
  const lowered = value.toLowerCase();
  if (lowered === 'transparent') return 'TRANSPARENT';
  try {
    return parseColor(lowered).alpha === 0 ? 'TRANSPARENT' : 'SOLID';
  } catch {
    return 'COMPLEX';
  }
}

/** IMPL-07 §21：背景链层记录，供 Diagnostic 使用。 */
export interface BackgroundLayer {
  readonly elementId: string;
  readonly color: string;
  readonly alpha: number | null;
  readonly source: 'SELF' | 'ANCESTOR';
  readonly kind: BackgroundKind;
}

/**
 * IMPL-07 §22-23：把背景层序列（自顶向下：SELF → 更远 ANCESTOR）
 * 逐层合成为最终不透明背景。合成在 Linear RGB 域进行（compositeOver）。
 * 无法得到 α=1 的结果时返回 null（UNKNOWN，不假设白底）。
 * 纯函数，便于 Node 单元测试。
 */
export function composeBackgroundLayers(layers: readonly BackgroundLayer[]): SRGB | null {
  const pending: SRGB[] = [];
  let result: SRGB | null = null;
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const layer = layers[i];
    if (layer === undefined) continue;
    let color: SRGB;
    try {
      color = parseColor(layer.color);
    } catch {
      return null;
    }
    if (result === null) {
      if (color.alpha === 1) {
        result = color;
        for (const p of pending) {
          result = compositeOver(p, result);
        }
        pending.length = 0;
      } else if (color.alpha > 0) {
        pending.push(color);
      }
      continue;
    }
    if (color.alpha === 0) continue;
    result = compositeOver(color, result);
  }
  return result !== null && result.alpha === 1 ? result : null;
}

export interface ResolvedBackground {
  readonly layers: readonly BackgroundLayer[];
  /** 有效不透明背景；null 表示 UNKNOWN。 */
  readonly effective: SRGB | null;
  /** UNKNOWN 的具体原因（供 metadata 与 Diagnostic）。 */
  readonly reason: 'complex' | 'unresolved' | null;
}

export interface BackgroundLookup {
  getComputedStyle(element: Element): CSSStyleDeclaration;
  getElementId(element: Element): string;
}

/** 防御异常深的 DOM 链。 */
const MAX_CHAIN_DEPTH = 32;

/**
 * IMPL-07 §19-21：从元素自身向上解析有效背景。
 * 自身 SOLID 且 α=1 时不再向上；TRANSPARENT 继续向祖先寻找。
 */
export function resolveBackgroundChain(
  element: Element,
  lookup: BackgroundLookup,
): ResolvedBackground {
  const layers: BackgroundLayer[] = [];
  let node: Element | null = element;
  let depth = 0;
  while (node !== null && depth < MAX_CHAIN_DEPTH) {
    const style = lookup.getComputedStyle(node);
    const kind = classifyBackground(style.backgroundColor, style.backgroundImage);
    const color = kind === 'SOLID' ? parseColor(style.backgroundColor) : null;
    layers.push({
      elementId: lookup.getElementId(node),
      color: style.backgroundColor,
      alpha: color?.alpha ?? (kind === 'TRANSPARENT' ? 0 : null),
      source: depth === 0 ? 'SELF' : 'ANCESTOR',
      kind,
    });
    if (kind === 'COMPLEX') {
      return { layers, effective: null, reason: 'complex' };
    }
    if (kind === 'SOLID' && color !== null && color.alpha === 1) {
      // IMPL-07 §22-23：找到不透明底后，把已收集的半透明层逐层合成上去。
      return { layers, effective: composeBackgroundLayers(layers), reason: null };
    }
    node = node.parentElement;
    depth += 1;
  }
  return { layers, effective: null, reason: 'unresolved' };
}
