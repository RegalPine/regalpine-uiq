/**
 * Diagnostic 关联（IMPL-17 §33 diagnostic link 阶段 / REPORT-01 AC-RPT-05）。
 * 只按 Diagnostic.findingId 关联，不重新归因、不按 message 聚类（ARCH-01 §5.6）。
 */
import type { ReportFacts } from '../aggregation/facts';

/** findingId → 排序去重的诊断 ID 列表（仅包含 facts.findings 中存在的 finding）。 */
export function linkDiagnostics(facts: ReportFacts): ReadonlyMap<string, readonly string[]> {
  const findingIds = new Set(facts.findings.map((f) => f.id));
  const linked = new Map<string, Set<string>>();
  for (const diagnostic of facts.diagnostics) {
    if (!findingIds.has(diagnostic.findingId)) continue; // 孤儿诊断不挂到任何 finding。
    let ids = linked.get(diagnostic.findingId);
    if (ids === undefined) {
      ids = new Set<string>();
      linked.set(diagnostic.findingId, ids);
    }
    ids.add(diagnostic.id);
  }
  const result = new Map<string, readonly string[]>();
  for (const [findingId, ids] of linked) {
    result.set(findingId, [...ids].sort());
  }
  return result;
}
