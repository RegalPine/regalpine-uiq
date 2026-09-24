/**
 * Diagnostic 摘要投影（IMPL-17 §7 DiagnosticSummary）。
 * cause/confidence/explanation 原样透传，不重新归因。
 */
import type { DiagnosticSummary } from '../model/finding';
import type { ReportFacts } from '../aggregation/facts';

export function toDiagnosticSummaries(facts: ReportFacts): readonly DiagnosticSummary[] {
  return [...facts.diagnostics]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((diagnostic) => ({
      id: diagnostic.id,
      findingId: diagnostic.findingId,
      type: diagnostic.type,
      cause: diagnostic.cause,
      confidence: diagnostic.confidence,
      explanation: diagnostic.explanation,
    }));
}
