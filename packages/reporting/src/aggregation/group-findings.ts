/**
 * Finding 分组（IMPL-17 §8 / REPORT-01 §13-14）。
 * 分组键 = findingType + ruleId@ruleVersion + severity + diagnostic cause；
 * 不得仅按文本 message 聚类，也不重新归因（cause 由 Diagnostic 原样提供）。
 */
import { fingerprint } from '@uiq/core';
import type { Diagnostic, Finding } from '@uiq/core';

import type { FindingGroup } from '../model/group';

export function groupFindings(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): readonly FindingGroup[] {
  // findingId → 排序去重后的 cause 集合（无诊断的 finding 为空数组）。
  const causesByFinding = new Map<string, string[]>();
  for (const diagnostic of diagnostics) {
    const causes = causesByFinding.get(diagnostic.findingId);
    if (causes === undefined) {
      causesByFinding.set(diagnostic.findingId, [diagnostic.cause]);
    } else if (!causes.includes(diagnostic.cause)) {
      causes.push(diagnostic.cause);
    }
  }

  const grouped = new Map<string, { causes: string[]; findings: Finding[] }>();
  for (const finding of findings) {
    const causes = [...(causesByFinding.get(finding.id) ?? [])].sort();
    const causeKey = causes.length > 0 ? causes.join('+') : 'NONE';
    const key = `${finding.type}|${finding.evaluation.ruleId}@${finding.evaluation.ruleVersion}|${finding.severity}|${causeKey}`;
    const bucket = grouped.get(key);
    if (bucket === undefined) {
      grouped.set(key, { causes, findings: [finding] });
    } else {
      bucket.findings.push(finding);
    }
  }

  const groups: FindingGroup[] = [];
  for (const bucket of grouped.values()) {
    const first = bucket.findings[0];
    if (first === undefined) continue; // 不可达：bucket 仅在 push 后创建。
    const sorted = [...bucket.findings].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const representative = sorted[0];
    if (representative === undefined) continue; // 不可达：sorted 非空。
    groups.push({
      id: fingerprint({
        type: first.type,
        ruleId: first.evaluation.ruleId,
        ruleVersion: first.evaluation.ruleVersion,
        severity: first.severity,
        causes: bucket.causes,
      }),
      findingType: first.type,
      ruleId: first.evaluation.ruleId,
      ruleVersion: first.evaluation.ruleVersion,
      severity: first.severity,
      affectedSubjects: [...new Set(sorted.map((f) => f.subjectId))].sort(),
      count: sorted.length,
      representativeFindingId: representative.id,
    });
  }
  return groups.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
