/**
 * Markdown Renderer（IMPL-17 §36 十二章节模板）。
 * 输出仅由报告事实决定（generatedAt 等为字段值），同报告同输出（AC-RPT-14）。
 */
import type { UIQualityReport } from '../model/report';

function joinList(items: readonly string[]): string {
  return items.length > 0 ? items.join(', ') : 'none';
}

export function renderMarkdown(report: UIQualityReport): string {
  const s = report.summary;
  const lines: string[] = [];
  lines.push('# UI Design Quality Assessment Report');
  lines.push('');
  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push(
    `- Evaluations: ${s.evaluations} (PASS ${s.pass} / FAIL ${s.fail} / WARN ${s.warn} / ` +
      `UNKNOWN ${s.unknown} / N/A ${s.notApplicable} / ERROR ${s.error})`,
  );
  lines.push(`- Measured Elements: ${s.measuredElements}`);
  lines.push(`- Metric Results: ${s.metricResults}`);
  lines.push(`- Findings: ${s.findings}`);
  lines.push(`- Recommendations: ${report.recommendations.length}`);
  lines.push('');
  lines.push('## 2. Scope');
  lines.push('');
  lines.push(`- Snapshots: ${joinList(report.scope.snapshotIds)}`);
  lines.push(`- Subjects: ${report.scope.subjects.length}`);
  lines.push(`- Themes: ${joinList(report.scope.themes)}`);
  lines.push(`- Viewports: ${joinList(report.scope.viewports)}`);
  lines.push('');
  lines.push('## 3. Quality Dimensions');
  lines.push('');
  lines.push('| Dimension | Evaluations | PASS | FAIL | WARN | UNKNOWN | N/A | ERROR | Findings |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const d of report.dimensions) {
    lines.push(
      `| ${d.dimension} | ${d.evaluations} | ${d.pass} | ${d.fail} | ${d.warn} | ${d.unknown} | ${d.notApplicable} | ${d.error} | ${d.findings} |`,
    );
  }
  lines.push('');
  lines.push('## 4. Findings');
  lines.push('');
  if (report.findings.length === 0) {
    lines.push('No findings.');
  } else {
    for (const f of report.findings) {
      lines.push(
        `- \`${f.id}\` [${f.findingType}/${f.severity}] ${f.subjectId} — ${f.ruleId}@${f.ruleVersion} (${f.state})`,
      );
    }
  }
  lines.push('');
  lines.push('## 5. Diagnostic Analysis');
  lines.push('');
  if (report.diagnostics.length === 0) {
    lines.push('No diagnostics.');
  } else {
    for (const d of report.diagnostics) {
      lines.push(`- \`${d.id}\` ${d.cause} (${d.confidence}): ${d.explanation}`);
    }
  }
  lines.push('');
  lines.push('## 6. Design System Conformance');
  lines.push('');
  lines.push(
    report.conformance !== undefined
      ? `- Level: ${report.conformance.level}; Total: ${report.conformance.total}; Passed: ${report.conformance.passed}; Failed: ${report.conformance.failed}; Unknown: ${report.conformance.unknown}; Errors: ${report.conformance.errors}`
      : 'Not available in this report.',
  );
  lines.push('');
  lines.push('## 7. Theme Analysis');
  lines.push('');
  lines.push(
    report.scope.themes.length > 0
      ? report.scope.themes.map((t) => `- Theme: ${t}`).join('\n')
      : 'No theme information in this report.',
  );
  lines.push('');
  lines.push('## 8. Improvement Recommendations');
  lines.push('');
  if (report.recommendations.length === 0) {
    lines.push('No recommendations.');
  } else {
    for (const r of report.recommendations) {
      lines.push(`### ${r.id}`);
      lines.push('');
      lines.push(`- Type: ${r.type}`);
      lines.push(`- Dimension: ${r.dimension}`);
      lines.push(`- Target: ${r.targetType} (${r.targetIds.join(', ')})`);
      lines.push(`- Rationale: ${r.rationale}`);
      lines.push(
        `- Affected Findings: ${r.affectedFindingIds.length > 0 ? r.affectedFindingIds.join(', ') : 'none'}`,
      );
    }
  }
  lines.push('');
  lines.push('## 9. Verification Criteria');
  lines.push('');
  if (report.recommendations.length === 0) {
    lines.push('No verification criteria.');
  } else {
    for (const r of report.recommendations) {
      if (r.verification.length === 0) continue;
      for (const c of r.verification) {
        lines.push(
          `- For ${r.id}: ${c.metricId}@${c.metricVersion} + ${c.ruleId}@${c.ruleVersion} expected ${c.expectedState}`,
        );
      }
    }
  }
  lines.push('');
  lines.push('## 10. Regression');
  lines.push('');
  lines.push(
    report.regression !== undefined
      ? `- New Failures: ${report.regression.summary.newFailures}; Fixed Failures: ${report.regression.summary.fixedFailures}; Persisting: ${report.regression.summary.persistingFailures}; Changed Results: ${report.regression.summary.changedResults}`
      : 'Not available in this report.',
  );
  lines.push('');
  lines.push('## 11. Release Gate');
  lines.push('');
  lines.push('Not evaluated in this report.');
  lines.push('');
  lines.push('## 12. Reproducibility');
  lines.push('');
  lines.push(`- Deterministic: ${report.reproducibility.deterministic ? 'yes' : 'no'}`);
  lines.push(
    `- Engine: ${report.reproducibility.engine.name}@${report.reproducibility.engine.version}`,
  );
  lines.push(`- Metric Versions: ${joinList(report.reproducibility.metricVersions)}`);
  lines.push(`- Rule Versions: ${joinList(report.reproducibility.ruleVersions)}`);
  lines.push('');
  return lines.join('\n');
}
