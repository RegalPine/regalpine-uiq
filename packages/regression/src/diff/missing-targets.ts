import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';

export type MissingTargetSide = 'BASELINE_ONLY' | 'CURRENT_ONLY';

export interface MissingTarget {
  readonly subjectId: string;
  readonly side: MissingTargetSide;
}

/**
 * subject 级缺失目标（UIQ-IMPL-11 §45）：身份只用 UIQ Entity ID / stable identity，
 * 不使用数组序号；缺失目标是事实记录，不参与六类回归分类（AD-23 不伪判）。
 */
export function diffSubjectPresence(
  baseline: Baseline,
  current: AnalysisSnapshot,
): MissingTarget[] {
  const baselineSubjects = new Set(baseline.evaluations.map((e) => e.subjectId));
  const currentSubjects = new Set(current.evaluations.map((e) => e.subjectId));
  const missing: MissingTarget[] = [];
  for (const subjectId of baselineSubjects) {
    if (!currentSubjects.has(subjectId)) {
      missing.push({ subjectId, side: 'BASELINE_ONLY' });
    }
  }
  for (const subjectId of currentSubjects) {
    if (!baselineSubjects.has(subjectId)) {
      missing.push({ subjectId, side: 'CURRENT_ONLY' });
    }
  }
  return missing.sort((a, b) => a.subjectId.localeCompare(b.subjectId));
}
