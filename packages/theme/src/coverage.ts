/**
 * Theme Coverage（IMPL-09 §25、TK-01 §35）：
 *
 *   coverage = Resolvable Required Tokens / Total Required Tokens
 *
 * Coverage 是 Metric 事实，不是 Compliance Decision——是否据此判定由 Rule 决定。
 */
export interface ThemeCoverage {
  /** required 中实际可解析的数量（交集语义：resolved 中的额外 id 不计入）。 */
  readonly resolvedCount: number;
  /** 去重后的 required 总数。 */
  readonly requiredCount: number;
  /** resolvedCount / requiredCount；空 required 集约定为 1（没有未满足的要求）。 */
  readonly ratio: number;
}

/**
 * 计算 required token 的主题覆盖率。
 *
 * @param required 必需 token id（重复 id 自动去重）。
 * @param resolved 实际可解析的 token id 集合（数组或 Set）。
 */
export function themeCoverage(
  required: readonly string[],
  resolved: readonly string[] | ReadonlySet<string>,
): ThemeCoverage {
  const requiredIds = [...new Set(required)].sort();
  const resolvedSet = resolved instanceof Set ? resolved : new Set(resolved);
  const resolvedCount = requiredIds.filter((id) => resolvedSet.has(id)).length;
  const requiredCount = requiredIds.length;
  const ratio = requiredCount === 0 ? 1 : resolvedCount / requiredCount;
  return { resolvedCount, requiredCount, ratio };
}
