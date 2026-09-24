import type { Finding } from '@uiq/core';
import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';
import { findingLogicKey } from './identity';

/** Finding 关联状态：ADDED/REMOVED 是缺失目标事实，不归六类回归分类。 */
export type FindingDiffStatus = 'MATCHED' | 'ADDED' | 'REMOVED';

export interface FindingDiff {
  readonly logicKey: string;
  readonly status: FindingDiffStatus;
  /** 仅 MATCHED 有意义：fingerprint 变化（含 Evidence）不改变逻辑身份（AD-07）。 */
  readonly contentChanged: boolean;
  readonly before?: Finding;
  readonly after?: Finding;
}

export function diffFindings(baseline: Baseline, current: AnalysisSnapshot): FindingDiff[] {
  const baselineByKey = new Map(baseline.findings.map((f) => [findingLogicKey(f), f] as const));
  const currentByKey = new Map(current.findings.map((f) => [findingLogicKey(f), f] as const));
  const keys = [...new Set([...baselineByKey.keys(), ...currentByKey.keys()])].sort();
  const diffs: FindingDiff[] = [];
  for (const key of keys) {
    const before = baselineByKey.get(key);
    const after = currentByKey.get(key);
    if (before !== undefined && after !== undefined) {
      diffs.push({
        logicKey: key,
        status: 'MATCHED',
        contentChanged: before.fingerprint !== after.fingerprint,
        before,
        after,
      });
      continue;
    }
    if (before !== undefined) {
      diffs.push({ logicKey: key, status: 'REMOVED', contentChanged: false, before });
      continue;
    }
    if (after !== undefined) {
      diffs.push({ logicKey: key, status: 'ADDED', contentChanged: false, after });
    }
  }
  return diffs;
}
