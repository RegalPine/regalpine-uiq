/**
 * 主题覆盖投影（IMPL-09 §20-23、TK-01 §24/§32）。
 *
 * Theme Isolation（IMPL-09 §21）：每次调用独立执行，无共享可变状态——
 * 不缓存、不修改入参，Light/Dark 各自调用互不可见。
 */
import type { DesignToken, Theme } from '@uiq/core';

/**
 * 应用主题覆盖，返回该主题下的有效 token 集。
 *
 * - `theme.tokens` 的 key 指向 base 中已存在的 token 时，覆盖其 value；
 *   layer/valueType/name/unit/role 保持不变（TK-01 §32：Override 保持 same semantic role）。
 * - 覆盖提供具体值后，原 reference 不再参与解析，予以移除，
 *   避免"值与引用并存"的歧义（不猜测哪个生效）。
 * - key 指向不存在的 token 时不在此处理（缺 layer/valueType 无法投影，
 *   不凭空构造 token），由 validateTheme 以 OVERRIDE_UNKNOWN_TARGET 报告。
 * - 覆盖值为 undefined 视为未提供（JSON 数据不会出现该形态）。
 */
export function applyTheme(base: readonly DesignToken[], theme: Theme): DesignToken[] {
  const overrides: Readonly<Record<string, unknown>> = theme.tokens;
  return base.map((token) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, token.id)) {
      return token;
    }
    const value = overrides[token.id];
    if (value === undefined) {
      return token;
    }
    const { reference: _dropped, ...kept } = token;
    void _dropped;
    return { ...kept, value } as DesignToken;
  });
}
