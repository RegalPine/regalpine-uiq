import type { GoldenReport } from '../golden/types';

/** UIQ-IMPL-11 §5-9：四级 Conformance Level，CORE ⊂ STANDARD ⊂ BROWSER ⊂ FULL。 */
export type ConformanceLevel = 'CORE' | 'STANDARD' | 'BROWSER' | 'FULL';

/**
 * 清单条目：caseId + 领域 + 覆盖状态。
 * 清单数据由调用方（工程/测试 harness）维护，conformance 只提供类型与纯函数。
 */
export interface ManifestEntry {
  readonly caseId: string;
  readonly domain: string;
  readonly status: 'COVERED' | 'PENDING';
}

const LEVEL_ORDER: readonly ConformanceLevel[] = ['CORE', 'STANDARD', 'BROWSER', 'FULL'];

/** 域 → 最低所属等级（UIQ-IMPL-11 §6-9 固定归属；高等级包含低等级全部条目）。 */
const DOMAIN_MIN_LEVEL: Readonly<Record<string, ConformanceLevel>> = {
  contract: 'CORE',
  schema: 'CORE',
  fingerprint: 'CORE',
  metric: 'STANDARD',
  color: 'STANDARD',
  geometry: 'STANDARD',
  typography: 'STANDARD',
  rule: 'STANDARD',
  token: 'STANDARD',
  diagnostic: 'STANDARD',
  browser: 'BROWSER',
  theme: 'FULL',
  component: 'FULL',
  regression: 'FULL',
  e2e: 'FULL',
  reporting: 'FULL',
};

export function resolveLevel(
  entries: readonly ManifestEntry[],
  level: ConformanceLevel,
): readonly ManifestEntry[] {
  const targetIndex = LEVEL_ORDER.indexOf(level);
  return entries.filter((entry) => {
    const min = DOMAIN_MIN_LEVEL[entry.domain];
    if (min === undefined) {
      throw new Error(`未知清单域 ${entry.domain}（domain 必须显式登记等级归属）`);
    }
    return LEVEL_ORDER.indexOf(min) <= targetIndex;
  });
}

export interface LevelExecutableResult {
  readonly executable: boolean;
  readonly pendingCases: readonly string[];
  readonly failedCases: readonly string[];
  readonly message?: string;
}

/**
 * P6-05：已实现范围按清单校验——存在 PENDING 用例或 failed 用例时，
 * 该等级不得宣称通过（"缺少用例不能报全等级通过"，PLAN §9.2）。
 */
export function assertLevelExecutable(
  entries: readonly ManifestEntry[],
  report: GoldenReport,
): LevelExecutableResult {
  const pendingCases = entries.filter((e) => e.status === 'PENDING').map((e) => e.caseId);
  const failedIds = new Set(report.cases.filter((c) => c.status !== 'PASS').map((c) => c.id));
  const failedCases = entries.map((e) => e.caseId).filter((id) => failedIds.has(id));
  const executable = pendingCases.length === 0 && failedCases.length === 0;
  return {
    executable,
    pendingCases,
    failedCases,
    ...(executable
      ? {}
      : {
          message: `等级不可宣称通过：PENDING ${pendingCases.length} 项、failed ${failedCases.length} 项`,
        }),
  };
}
