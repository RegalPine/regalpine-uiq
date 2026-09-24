/**
 * 绑定采集（IMPL-09 §32-36，P5 关键决策 6 相关：采集端只读渲染后 DOM）。
 *
 * 三类绑定，确定性分派、不强行推断（AC-THEME-06）：
 * - `data-uiq-token` 属性 → EXPLICIT（confidence DIRECT，§33）；
 * - 配置 cssVariableMap（tokenId→CSS 变量名）且 computed style 变量非空 → INFERRED
 *   （confidence INFERRED，§34-35：值匹配 ≠ 来源匹配，推断不升级为直接证据）；
 * - 其余 → UNRESOLVED（§36：无绑定证据就如实报告，不猜测 tokenId）。
 */
import type { TokenBinding } from '@uiq/core';

export const EXPLICIT_BINDING_ATTRIBUTE = 'data-uiq-token';

export interface BindingCollectionInput {
  readonly element: Element;
  readonly subjectId: string;
  /** tokenId → CSS 变量名；按对象 key 顺序取第一个计算值非空的变量。 */
  readonly cssVariableMap?: Readonly<Record<string, string>>;
}

/** 对单个元素解析 TokenBinding（每个 subject 恰好一条记录）。 */
export function collectBinding(input: BindingCollectionInput): TokenBinding {
  const { element, subjectId } = input;
  const explicit = element.getAttribute(EXPLICIT_BINDING_ATTRIBUTE);
  if (explicit !== null && explicit.trim() !== '') {
    return {
      subjectId,
      tokenId: explicit.trim(),
      bindingType: 'EXPLICIT',
      source: EXPLICIT_BINDING_ATTRIBUTE,
      confidence: 'DIRECT',
    };
  }

  if (input.cssVariableMap !== undefined) {
    const view = element.ownerDocument.defaultView;
    if (view !== null) {
      const style = view.getComputedStyle(element);
      for (const [tokenId, variableName] of Object.entries(input.cssVariableMap)) {
        // CSS custom property 为空串视为未提供（该变量未作用于元素）。
        if (style.getPropertyValue(variableName).trim() !== '') {
          return {
            subjectId,
            tokenId,
            bindingType: 'INFERRED',
            source: `css-variable:${variableName}`,
            confidence: 'INFERRED',
          };
        }
      }
    }
  }

  return {
    subjectId,
    bindingType: 'UNRESOLVED',
    source: 'no-binding-evidence',
    confidence: 'UNKNOWN',
  };
}
