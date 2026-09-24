/**
 * Radix 纯 DOM Adapter（IMPL-13 §31-39，P5 关键决策 6）。
 *
 * UIQ 不理解 Radix 内部机制，只识别渲染后 DOM 约定：
 * - `data-radix-*` 属性 → 组件标识与状态（data-state 等）；
 * - `[data-radix-portal]` → Portal 容器；归属解析为纯 DOM 遍历（容器上同步 data-theme）；
 * - `data-theme` → 主题上下文，自元素向上遍历。
 * 真实 React + Radix 渲染样例留 P9；本 adapter 只面向静态渲染产物。
 */
import type { TokenBinding } from '@uiq/core';
import { collectBinding } from '@uiq/browser';

const RADIX_ATTRIBUTE_PREFIX = 'data-radix-';
/** 容器性属性：标识容器而非组件类型。 */
const CONTAINER_RADIX_KEYS = new Set(['portal', 'popper-content-wrapper']);
const STATE_ATTRIBUTES = [
  'data-state',
  'data-disabled',
  'data-orientation',
  'data-required',
] as const;

/** IMPL-13 §36：组件绑定投影（渲染后 DOM 视图）。 */
export interface ComponentBinding {
  /** 如 'dialog-content'（来自 data-radix-dialog-content）。 */
  readonly componentType: string;
  /** data-state 值（如 open/closed/checked）；未标注为 null。 */
  readonly state: string | null;
  /** 全部 Radix 相关属性投影（data-radix-* 键去前缀 + 状态属性）。 */
  readonly attributes: Readonly<Record<string, string>>;
}

/** 主题上下文（IMPL-13 §17 的集成投影视图；adapter 不解析 token 值）。 */
export interface ThemeContext {
  readonly themeId: string;
  /** 声明主题的元素标识（data-uiq-id 优先，退化为标签名）。 */
  readonly declaredBy: string;
}

/** IMPL-13 §35：设计系统 adapter 契约。 */
export interface UIQDesignSystemAdapter {
  resolveToken(element: Element): readonly TokenBinding[];
  resolveComponent(element: Element): ComponentBinding | undefined;
  resolveTheme(element: Element): ThemeContext | undefined;
}

export interface RadixDomAdapterOptions {
  /** tokenId → CSS 变量名；委托 @uiq/browser 的绑定采集（INFERRED 推断）。 */
  readonly cssVariableMap?: Readonly<Record<string, string>>;
}

export class RadixDomAdapter implements UIQDesignSystemAdapter {
  private readonly cssVariableMap: Readonly<Record<string, string>> | undefined;

  constructor(options: RadixDomAdapterOptions = {}) {
    this.cssVariableMap = options.cssVariableMap;
  }

  /** 绑定解析委托 @uiq/browser 采集规则（三类：EXPLICIT/INFERRED/UNRESOLVED）。 */
  resolveToken(element: Element): readonly TokenBinding[] {
    const subjectId = element.getAttribute('data-uiq-id')?.trim() ?? '';
    return [
      collectBinding({
        element,
        subjectId,
        ...(this.cssVariableMap !== undefined ? { cssVariableMap: this.cssVariableMap } : {}),
      }),
    ];
  }

  /** 组件标识：首个非容器 data-radix-* 属性；无则 undefined。 */
  resolveComponent(element: Element): ComponentBinding | undefined {
    const attributes: Record<string, string> = {};
    let componentType: string | undefined;
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith(RADIX_ATTRIBUTE_PREFIX)) {
        const key = attr.name.slice(RADIX_ATTRIBUTE_PREFIX.length);
        attributes[key] = attr.value;
        if (componentType === undefined && !CONTAINER_RADIX_KEYS.has(key)) {
          componentType = key;
        }
      } else if ((STATE_ATTRIBUTES as readonly string[]).includes(attr.name)) {
        attributes[attr.name.slice('data-'.length)] = attr.value;
      }
    }
    if (componentType === undefined) {
      return undefined;
    }
    return {
      componentType,
      state: attributes['state'] ?? null,
      attributes,
    };
  }

  /** 主题上下文：data-theme 自元素向上遍历；Portal 容器上同步的 data-theme 同样生效。 */
  resolveTheme(element: Element): ThemeContext | undefined {
    let current: Element | null = element;
    while (current !== null) {
      const themeId = current.getAttribute('data-theme');
      if (themeId !== null && themeId.trim() !== '') {
        return {
          themeId: themeId.trim(),
          declaredBy: current.getAttribute('data-uiq-id')?.trim() ?? current.tagName.toLowerCase(),
        };
      }
      current = current.parentElement;
    }
    return undefined;
  }
}
