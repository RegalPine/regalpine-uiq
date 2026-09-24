/**
 * Theme Integrity 校验（IMPL-09 §24、TK-01 §25）。
 *
 * 检查项及其语义基础：
 * - Reference Validity / Cycle：基于资产（base）的结构事实——主题覆盖不改变
 *   "资产声明过断裂引用/环"的事实。
 * - Unresolved / Required Coverage：基于应用该主题后的有效集——同一资产在不同
 *   主题下独立评价（IMPL-09 §21），主题覆盖可以修复某个 token 的可解析性。
 * - Override Validity：覆盖 key 必须指向已存在的 token；覆盖不改变 layer/valueType
 *   由 applyTheme 实现保证（值级替换，非结构替换）。
 *
 * Orphan 不在检查范围（TK-01 §27：ORPHAN → INFO，§24 检查列表不含 orphan）。
 */
import type { DesignToken, Theme } from '@uiq/core';
import {
  buildTokenGraph,
  createTokenResolver,
  detectTokenCycles,
  findBrokenReferences,
} from '@uiq/tokens';
import { applyTheme } from './theme-resolver';

export type ThemeIntegrity = 'PASS' | 'FAIL';

export type ThemeIssueCode =
  /** Reference Validity：base 中 token 引用了不存在的 id。 */
  | 'REFERENCE_BROKEN'
  /** base 中存在引用环（issue.path 为完整环路径 A→B→…→A）。 */
  | 'CYCLE'
  /** 该主题下某 token 无法解析出有效值。 */
  | 'UNRESOLVED'
  /** Override Validity：覆盖 key 指向不存在的 token。 */
  | 'OVERRIDE_UNKNOWN_TARGET'
  /** required token 不在资产中（TK-01 §26：Missing required token → FAIL）。 */
  | 'REQUIRED_MISSING'
  /** required token 在该主题下不可解析。 */
  | 'REQUIRED_UNRESOLVED';

export interface ThemeIssue {
  readonly code: ThemeIssueCode;
  readonly message: string;
  readonly tokenId?: string;
  /** 仅 CYCLE：完整环路径。 */
  readonly path?: readonly string[];
}

export interface ThemeValidationResult {
  readonly integrity: ThemeIntegrity;
  readonly issues: readonly ThemeIssue[];
}

/**
 * 校验主题完整性与 base 资产结构。任一 issue 即 FAIL；无 issue 为 PASS。
 * 结果数组确定性排序（code → tokenId → message），同输入同输出。
 */
export function validateTheme(
  base: readonly DesignToken[],
  theme: Theme,
  requiredTokenIds?: readonly string[],
): ThemeValidationResult {
  const issues: ThemeIssue[] = [];
  const assetIds = new Set(base.map((token) => token.id));

  // Reference Validity / Cycle：资产结构事实。
  const graph = buildTokenGraph(base);
  for (const broken of findBrokenReferences(graph)) {
    issues.push({
      code: 'REFERENCE_BROKEN',
      message: `Token "${broken.from}" 引用了不存在的 "${broken.to}"。`,
      tokenId: broken.from,
    });
  }
  for (const cycle of detectTokenCycles(graph)) {
    issues.push({
      code: 'CYCLE',
      message: `Token 引用环：${cycle.join(' → ')}。`,
      path: cycle,
    });
  }

  // Unresolved / Required Coverage：该主题下的有效解析状态。
  const applied = applyTheme(base, theme);
  const appliedResolver = createTokenResolver(applied);
  for (const token of applied) {
    if (appliedResolver.resolve(token.id).status === 'UNKNOWN') {
      issues.push({
        code: 'UNRESOLVED',
        message: `Token "${token.id}" 在主题 "${theme.id}" 下无法解析出有效值。`,
        tokenId: token.id,
      });
    }
  }

  // Override Validity：覆盖目标必须存在。
  for (const key of Object.keys(theme.tokens)) {
    if (!assetIds.has(key)) {
      issues.push({
        code: 'OVERRIDE_UNKNOWN_TARGET',
        message: `主题 "${theme.id}" 覆盖了不存在的 token "${key}"。`,
        tokenId: key,
      });
    }
  }

  if (requiredTokenIds !== undefined) {
    for (const id of requiredTokenIds) {
      if (!assetIds.has(id)) {
        issues.push({
          code: 'REQUIRED_MISSING',
          message: `必需 token "${id}" 不在资产中。`,
          tokenId: id,
        });
        continue;
      }
      if (appliedResolver.resolve(id).status !== 'RESOLVED') {
        issues.push({
          code: 'REQUIRED_UNRESOLVED',
          message: `必需 token "${id}" 在主题 "${theme.id}" 下不可解析。`,
          tokenId: id,
        });
      }
    }
  }

  issues.sort(
    (a, b) =>
      a.code.localeCompare(b.code) ||
      (a.tokenId ?? '').localeCompare(b.tokenId ?? '') ||
      a.message.localeCompare(b.message),
  );

  return { integrity: issues.length === 0 ? 'PASS' : 'FAIL', issues };
}
