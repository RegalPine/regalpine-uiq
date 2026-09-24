/**
 * 排版 computed value 归一化（IMPL-07 §26-33）。
 * 纯函数，便于 Node 单元测试。
 */

/** 解析 px 结尾的 computed 长度 → number；非 px 或非法 → null。 */
export function parsePx(raw: string): number | null {
  const value = raw.trim();
  if (!value.endsWith('px')) return null;
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

export interface LineHeightValue {
  readonly px: number;
  readonly ratio?: number;
}

/**
 * IMPL-07 §29-30：line-height `normal` 无法提供精确字体度量语义 → null（UNKNOWN）。
 * px 值同时记录 ratio = lineHeight / fontSize，供 Metric 层直接消费。
 */
export function normalizeLineHeight(raw: string, fontSizePx: number): LineHeightValue | null {
  if (raw.trim().toLowerCase() === 'normal') return null;
  const px = parsePx(raw);
  if (px === null) return null;
  return {
    px,
    ...(fontSizePx > 0 && Number.isFinite(px / fontSizePx) ? { ratio: px / fontSizePx } : {}),
  };
}

/**
 * IMPL-07 §28：Variable Font 的 computed font-weight 可能带小数，
 * 必须原样保留，不得四舍五入到 100-900 档位。
 */
export function normalizeFontWeight(raw: string): number | null {
  const num = Number.parseFloat(raw.trim());
  return Number.isFinite(num) ? num : null;
}

/**
 * IMPL-07 §31：letter-spacing computed 值转 px；`normal` → null（无间距语义）。
 */
export function normalizeLetterSpacing(raw: string): number | null {
  if (raw.trim().toLowerCase() === 'normal') return null;
  return parsePx(raw);
}
