import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';
import { jsonEquals } from '../internal/json-equality';

/** 可比性核验维度（AD-23：先核验可比性，不产生跨环境/跨主题结论）。 */
export type ComparabilityAspect = 'SCHEMA_VERSION' | 'ENVIRONMENT' | 'THEME_ID';

export interface ComparabilityReason {
  readonly aspect: ComparabilityAspect;
  readonly detail: string;
}

export interface ComparabilityResult {
  readonly comparable: boolean;
  readonly reasons: readonly ComparabilityReason[];
}

/**
 * AD-23：回归先核验可比性 —— schemaVersion / environment（viewport、browser、
 * devicePixelRatio）/ themeId 不一致即不可比，不产出六类结论。
 * 两侧均无 environment（如 STATIC 采集）视为同环境约束，可比。
 */
export function checkComparability(
  baseline: Baseline,
  current: AnalysisSnapshot,
): ComparabilityResult {
  const reasons: ComparabilityReason[] = [];
  if (baseline.schemaVersion !== current.schemaVersion) {
    reasons.push({
      aspect: 'SCHEMA_VERSION',
      detail: `schemaVersion 不一致：baseline=${baseline.schemaVersion}，current=${current.schemaVersion}`,
    });
  }
  const before = baseline.snapshot.environment;
  const after = current.snapshot.environment;
  if (before === undefined && after === undefined) {
    // 均无环境记录：无跨环境风险。
  } else if (before === undefined || after === undefined) {
    reasons.push({
      aspect: 'ENVIRONMENT',
      detail: '一侧快照缺少 environment 记录，无法断言同一环境',
    });
  } else {
    if (!jsonEquals(before.viewport, after.viewport)) {
      reasons.push({
        aspect: 'ENVIRONMENT',
        detail: `viewport 不一致：baseline=${describe(before.viewport)}，current=${describe(after.viewport)}`,
      });
    }
    if (!jsonEquals(before.browser, after.browser)) {
      reasons.push({
        aspect: 'ENVIRONMENT',
        detail: `browser 不一致：baseline=${describe(before.browser)}，current=${describe(after.browser)}`,
      });
    }
    if (!jsonEquals(before.devicePixelRatio, after.devicePixelRatio)) {
      reasons.push({
        aspect: 'ENVIRONMENT',
        detail: `devicePixelRatio 不一致：baseline=${describe(before.devicePixelRatio)}，current=${describe(after.devicePixelRatio)}`,
      });
    }
  }
  if (!jsonEquals(baseline.themeId, current.themeId)) {
    reasons.push({
      aspect: 'THEME_ID',
      detail: `themeId 不一致：baseline=${describe(baseline.themeId)}，current=${describe(current.themeId)}`,
    });
  }
  return { comparable: reasons.length === 0, reasons };
}

function describe(value: unknown): string {
  return value === undefined ? '<缺失>' : JSON.stringify(value);
}
