/**
 * 新结果验证投影（IMPL-17 §32 / IMPL-18 §16/§24）。
 * IMPLEMENTED ≠ VERIFIED：只有"新采集 + 全部必需条件满足"才 VERIFIED；
 * 目标评价 N/A、目标消失或规则版本变化一律不算修复（对齐 AD-23 严格边界）。
 * 本模块是纯投影：不执行指标/规则，不启动采集（重测编排由应用层负责）。
 */
import type { EvaluationResult, Finding } from '@uiq/core';

import type { ImprovementRecommendation } from '../model/recommendation';
import type { VerificationResult } from '../model/verification';

/** 验证输入：一次采集产物（before 为建议生成时的产物，after 为重测产物）。 */
export interface VerificationInput {
  readonly snapshotId: string;
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
}

const NOT_VERIFIED = (
  reasons: readonly { code: string; detail: string }[],
): VerificationResult => ({
  status: 'NOT_VERIFIED',
  reasons,
});

export function verify(
  recommendations: readonly ImprovementRecommendation[],
  before: VerificationInput,
  after: VerificationInput,
): VerificationResult {
  // 1. 必须是新采集（IMPLEMENTED ≠ VERIFIED；同快照不产生新证据）。
  if (after.snapshotId === before.snapshotId) {
    return NOT_VERIFIED([
      {
        code: 'NEW_COLLECTION_REQUIRED',
        detail: `快照未变化（${before.snapshotId}）；验证必须基于重新采集的结果`,
      },
    ]);
  }

  const subjectsByFinding = new Map(before.findings.map((f) => [f.id, f.subjectId]));
  const reasons: { code: string; detail: string }[] = [];
  let criteriaTotal = 0;

  for (const recommendation of recommendations) {
    // 条件的目标 subject 来自建议关联的 finding（修复对象是元素）。
    const subjectIds = [
      ...new Set(
        recommendation.affectedFindingIds
          .map((id) => subjectsByFinding.get(id))
          .filter((s): s is string => s !== undefined),
      ),
    ].sort();

    for (const criterion of recommendation.verification) {
      for (const subjectId of subjectIds) {
        criteriaTotal += 1;
        const candidates = after.evaluations.filter(
          (e) => e.ruleId === criterion.ruleId && e.subjectId === subjectId,
        );
        const matched = candidates.find((e) => e.ruleVersion === criterion.ruleVersion);
        if (matched === undefined) {
          const versionChanged = candidates.length > 0;
          reasons.push(
            versionChanged
              ? {
                  code: 'RULE_VERSION_CHANGED',
                  detail: `${criterion.ruleId} 在 subject ${subjectId} 上仅存在其他版本的评价（期望 ${criterion.ruleVersion}），版本变化不算修复`,
                }
              : {
                  code: 'TARGET_EVALUATION_MISSING',
                  detail: `${criterion.ruleId}@${criterion.ruleVersion} 在 subject ${subjectId} 上无评价，目标消失不算修复`,
                },
          );
          continue;
        }
        if (matched.state === 'NOT_APPLICABLE') {
          reasons.push({
            code: 'TARGET_NOT_APPLICABLE',
            detail: `${criterion.ruleId} 在 subject ${subjectId} 上为 NOT_APPLICABLE，N/A 不算修复`,
          });
          continue;
        }
        if (matched.state !== criterion.expectedState) {
          reasons.push({
            code: 'CRITERION_NOT_MET',
            detail: `${criterion.ruleId} 在 subject ${subjectId} 上为 ${matched.state}，期望 ${criterion.expectedState}`,
          });
        }
      }
    }
  }

  // 2. 全部必需条件满足才 VERIFIED；无条件可验证的建议不宣称修复。
  if (criteriaTotal === 0) {
    return NOT_VERIFIED([{ code: 'NO_CRITERIA', detail: '建议未携带可验证条件，无法宣称修复' }]);
  }
  const seen = new Set<string>();
  const uniqueReasons = reasons.filter((r) => {
    const key = `${r.code}|${r.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return uniqueReasons.length === 0
    ? { status: 'VERIFIED', reasons: [] }
    : { status: 'NOT_VERIFIED', reasons: uniqueReasons };
}
