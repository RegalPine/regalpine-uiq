/**
 * HTML Renderer（IMPL-17 §37）。
 * HTML 只是表现层，事实源唯一为 UIQualityReport；
 * 所有插值必须经上下文转义（&<>"'），防止报告事实中的文本注入标记（AD-25）。
 */
import type { UIQualityReport } from '../model/report';

/** HTML 上下文转义（文本与属性值通用）。 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function section(id: string, title: string, body: string): string {
  return `<section id="${escapeHtml(id)}"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function list(items: readonly string[]): string {
  return items.length === 0
    ? '<p>none</p>'
    : `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

export function renderHtml(report: UIQualityReport): string {
  const s = report.summary;
  const summaryBody =
    `<p>Evaluations: ${s.evaluations} (PASS ${s.pass} / FAIL ${s.fail} / WARN ${s.warn} / ` +
    `UNKNOWN ${s.unknown} / N/A ${s.notApplicable} / ERROR ${s.error})</p>` +
    `<p>Measured Elements: ${s.measuredElements}; Findings: ${s.findings}; Recommendations: ${report.recommendations.length}</p>`;
  const scopeBody = list([
    ...report.scope.snapshotIds,
    `${report.scope.subjects.length} subjects`,
    ...report.scope.themes,
    ...report.scope.viewports,
  ]);
  const dimensionRows = report.dimensions
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.dimension)}</td><td>${d.evaluations}</td><td>${d.pass}</td><td>${d.fail}</td><td>${d.warn}</td><td>${d.unknown}</td><td>${d.notApplicable}</td><td>${d.error}</td><td>${d.findings}</td></tr>`,
    )
    .join('');
  const dimensionsBody = `<table><thead><tr><th>Dimension</th><th>Evaluations</th><th>PASS</th><th>FAIL</th><th>WARN</th><th>UNKNOWN</th><th>N/A</th><th>ERROR</th><th>Findings</th></tr></thead><tbody>${dimensionRows}</tbody></table>`;
  const findingsBody = list(
    report.findings.map(
      (f) =>
        `${f.id} [${f.findingType}/${f.severity}] ${f.subjectId} — ${f.ruleId}@${f.ruleVersion} (${f.state})`,
    ),
  );
  const diagnosticsBody = list(
    report.diagnostics.map((d) => `${d.id} ${d.cause} (${d.confidence}): ${d.explanation}`),
  );
  const conformanceBody = report.conformance
    ? `<p>Level: ${escapeHtml(report.conformance.level)}; Total: ${report.conformance.total}; Passed: ${report.conformance.passed}; Failed: ${report.conformance.failed}</p>`
    : '<p>Not available in this report.</p>';
  const themeBody = list(report.scope.themes);
  const recommendationBody = list(
    report.recommendations.map(
      (r) => `${r.type}: ${r.rationale} (targets: ${r.targetIds.join(', ')})`,
    ),
  );
  const verificationBody = list(
    report.recommendations.flatMap((r) =>
      r.verification.map(
        (c) =>
          `For ${r.id}: ${c.metricId}@${c.metricVersion} + ${c.ruleId}@${c.ruleVersion} expected ${c.expectedState}`,
      ),
    ),
  );
  const regressionBody = report.regression
    ? `<p>New Failures: ${report.regression.summary.newFailures}; Fixed Failures: ${report.regression.summary.fixedFailures}; Persisting: ${report.regression.summary.persistingFailures}</p>`
    : '<p>Not available in this report.</p>';
  const reproducibilityBody = list([
    `Deterministic: ${report.reproducibility.deterministic ? 'yes' : 'no'}`,
    `Engine: ${report.reproducibility.engine.name}@${report.reproducibility.engine.version}`,
    `Metric Versions: ${report.reproducibility.metricVersions.join(', ')}`,
    `Rule Versions: ${report.reproducibility.ruleVersions.join(', ')}`,
  ]);

  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>UIQ Quality Report</title></head>',
    '<body>',
    '<h1>UI Design Quality Assessment Report</h1>',
    section('summary', '1. Executive Summary', summaryBody),
    section('scope', '2. Scope', scopeBody),
    section('dimensions', '3. Quality Dimensions', dimensionsBody),
    section('findings', '4. Findings', findingsBody),
    section('diagnostics', '5. Diagnostic Analysis', diagnosticsBody),
    section('conformance', '6. Design System Conformance', conformanceBody),
    section('themes', '7. Theme Analysis', themeBody),
    section('recommendations', '8. Improvement Recommendations', recommendationBody),
    section('verification', '9. Verification Criteria', verificationBody),
    section('regression', '10. Regression', regressionBody),
    section('gate', '11. Release Gate', '<p>Not evaluated in this report.</p>'),
    section('reproducibility', '12. Reproducibility', reproducibilityBody),
    '</body>',
    '</html>',
  ].join('\n');
}
