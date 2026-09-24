/**
 * P8-01：可见性分类与布局显示模式识别。
 *
 * 区分 DISPLAY_NONE / VISIBILITY_HIDDEN / ZERO_SIZE / OFFSCREEN / CLIPPED / VISIBLE。
 * 零尺寸不统一当作未渲染，offscreen 不统一排除（LAYOUT-07）。
 */
export type VisibilityState =
  | 'DISPLAY_NONE'
  | 'VISIBILITY_HIDDEN'
  | 'ZERO_SIZE'
  | 'OFFSCREEN'
  | 'CLIPPED'
  | 'VISIBLE';

export interface VisibilityClassification {
  readonly state: VisibilityState;
  readonly reasons: readonly string[];
}

export interface VisibilityInput {
  readonly display: string;
  readonly visibility: string;
  readonly width: number;
  readonly height: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly overflow: string;
  readonly clip: string;
}

/**
 * 按优先级分类可见性状态。
 *
 * 优先级：DISPLAY_NONE > VISIBILITY_HIDDEN > ZERO_SIZE > OFFSCREEN > CLIPPED > VISIBLE。
 * 每级只记录最直接的原因，不推断复合原因。
 */
export function classifyVisibility(input: VisibilityInput): VisibilityClassification {
  if (input.display === 'none') {
    return { state: 'DISPLAY_NONE', reasons: [`display:${input.display}`] };
  }
  if (input.visibility === 'hidden') {
    return { state: 'VISIBILITY_HIDDEN', reasons: [`visibility:${input.visibility}`] };
  }
  if (input.width <= 0 || input.height <= 0) {
    return {
      state: 'ZERO_SIZE',
      reasons: [`width:${input.width}`, `height:${input.height}`],
    };
  }
  if (
    input.right < 0 ||
    input.bottom < 0 ||
    input.left > input.viewportWidth ||
    input.top > input.viewportHeight
  ) {
    return {
      state: 'OFFSCREEN',
      reasons: [
        `rect:[${input.left},${input.top},${input.right},${input.bottom}]`,
        `viewport:${input.viewportWidth}x${input.viewportHeight}`,
      ],
    };
  }
  if (input.overflow !== 'visible' && input.clip !== 'none' && input.clip !== 'auto') {
    return { state: 'CLIPPED', reasons: [`overflow:${input.overflow}`, `clip:${input.clip}`] };
  }
  return { state: 'VISIBLE', reasons: [] };
}

/** CSS 布局显示模式分类，供布局指标选择算法路径。 */
export type LayoutDisplayMode =
  | 'BLOCK'
  | 'INLINE'
  | 'INLINE_BLOCK'
  | 'FLEX'
  | 'INLINE_FLEX'
  | 'GRID'
  | 'INLINE_GRID'
  | 'TABLE'
  | 'ABSOLUTE'
  | 'FIXED'
  | 'OTHER';

export interface DisplayModeClassification {
  readonly mode: LayoutDisplayMode;
  readonly display: string;
  readonly position: string;
}

/** 从 computed style 的 display + position 推断布局显示模式。 */
export function classifyDisplayMode(display: string, position: string): DisplayModeClassification {
  if (position === 'absolute') return { mode: 'ABSOLUTE', display, position };
  if (position === 'fixed') return { mode: 'FIXED', display, position };
  switch (display) {
    case 'block':
      return { mode: 'BLOCK', display, position };
    case 'inline':
      return { mode: 'INLINE', display, position };
    case 'inline-block':
      return { mode: 'INLINE_BLOCK', display, position };
    case 'flex':
      return { mode: 'FLEX', display, position };
    case 'inline-flex':
      return { mode: 'INLINE_FLEX', display, position };
    case 'grid':
      return { mode: 'GRID', display, position };
    case 'inline-grid':
      return { mode: 'INLINE_GRID', display, position };
    case 'table':
    case 'table-row':
    case 'table-cell':
      return { mode: 'TABLE', display, position };
    default:
      return { mode: 'OTHER', display, position };
  }
}
