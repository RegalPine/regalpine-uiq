/**
 * P9：分析结果导出（IMPL-10 §30-§32）。
 *
 * 支持 JSON / Markdown / HTML 三种格式。
 * 包含 UIQ Engine Version、Metric/Rule Versions、Snapshot ID、Theme、Browser、Viewport。
 */
import type { InspectionResult } from '../runtime/InspectorController';
import { formatMetricValue } from '../panels/PanelHelpers';

export interface ExportMetadata {
  readonly uiqEngineVersion: string;
  readonly exportedAt: string;
  readonly browser?: string;
  readonly viewport?: { width: number; height: number };
  readonly themeId: string | null;
}

/** 导出为 JSON（完整结构化数据）。 */
export function exportJson(result: InspectionResult, metadata: ExportMetadata): string {
  const payload = {
    __uiq: 'INSPECTION_REPORT',
    version: '1.0.0',
    metadata: {
      uiqEngineVersion: metadata.uiqEngineVersion,
      exportedAt: metadata.exportedAt,
      browser: metadata.browser ?? 'unknown',
      viewport: metadata.viewport ?? null,
      themeId: metadata.themeId,
    },
    engine: result.engine,
    snapshot: {
      id: result.snapshot.id,
      capturedAt: result.snapshot.capturedAt,
      source: result.snapshot.source,
      measurementCount: result.snapshot.measurements.length,
    },
    subjectId: result.subjectId,
    metrics: result.metrics.map((m) => ({
      metricId: m.metricId,
      metricVersion: m.metricVersion,
      subjectId: m.subjectId,
      value: m.value,
      unit: m.unit,
      status: m.status,
      fingerprint: m.fingerprint,
    })),
    evaluations: result.evaluations.map((e) => ({
      ruleId: e.ruleId,
      ruleVersion: e.ruleVersion,
      subjectId: e.subjectId,
      state: e.state,
      severity: e.severity,
      fingerprint: e.fingerprint,
      message: e.message,
    })),
    findings: result.findings.map((f) => ({
      id: f.id,
      fingerprint: f.fingerprint,
      type: f.type,
      state: f.state,
      severity: f.severity,
      subjectId: f.subjectId,
    })),
    diagnostics: result.diagnostics.map((d) => ({
      id: d.id,
      findingId: d.findingId,
      type: d.type,
      cause: d.cause,
      confidence: d.confidence,
      explanation: d.explanation,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/** 导出为 Markdown（人类可读）。 */
export function exportMarkdown(result: InspectionResult, metadata: ExportMetadata): string {
  const lines: string[] = [];
  lines.push('# UIQ Inspection Report');
  lines.push('');
  lines.push(`**Engine:** ${metadata.uiqEngineVersion}`);
  lines.push(`**Exported:** ${metadata.exportedAt}`);
  if (metadata.browser !== undefined) {
    lines.push(`**Browser:** ${metadata.browser}`);
  }
  if (metadata.viewport !== undefined) {
    lines.push(`**Viewport:** ${metadata.viewport.width}×${metadata.viewport.height}`);
  }
  if (metadata.themeId !== null) {
    lines.push(`**Theme:** ${metadata.themeId}`);
  }
  lines.push(`**Snapshot:** ${result.snapshot.id}`);
  lines.push('');

  // Metrics
  lines.push('## Metrics');
  lines.push('');
  for (const m of result.metrics) {
    lines.push(`- **${m.metricId}**@${m.metricVersion}: ${formatMetricValue(m)} [${m.status}]`);
  }
  lines.push('');

  // Evaluations
  lines.push('## Evaluations');
  lines.push('');
  for (const e of result.evaluations) {
    lines.push(`- **${e.ruleId}**@${e.ruleVersion}: ${e.state} (${e.severity})`);
    if (e.message !== undefined) {
      lines.push(`  ${e.message}`);
    }
  }
  lines.push('');

  // Findings
  if (result.findings.length > 0) {
    lines.push('## Findings');
    lines.push('');
    for (const f of result.findings) {
      lines.push(`- **${f.id}** [${f.state}] (${f.severity}) — ${f.type}`);
    }
    lines.push('');
  }

  // Diagnostics
  if (result.diagnostics.length > 0) {
    lines.push('## Diagnostics');
    lines.push('');
    for (const d of result.diagnostics) {
      lines.push(`- **${d.type}** (${d.confidence}): ${d.explanation}`);
    }
  }

  return lines.join('\n');
}

/** 导出为 HTML（自包含页面）。 */
export function exportHtml(result: InspectionResult, metadata: ExportMetadata): string {
  const markdown = exportMarkdown(result, metadata);
  // Simple HTML wrapper — Markdown content in <pre> for readability
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UIQ Inspection Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { border-bottom: 2px solid #4a90d9; padding-bottom: 8px; }
    h2 { color: #4a90d9; margin-top: 24px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    strong { color: #222; }
  </style>
</head>
<body>
<pre>${escapeHtml(markdown)}</pre>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
