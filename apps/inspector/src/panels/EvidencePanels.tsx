/**
 * P9：八证据面板（IMPL-10 §18-§25）。
 *
 * 每个面板接收 InspectionResult 数据并渲染结构化展示。
 * 不重新实现领域算法；只消费 @uiq/core 类型。
 */
import { type JSX, useState } from 'react';
import type { MetricResult, EvaluationResult, Finding, Diagnostic } from '@uiq/core';
import {
  groupMetricsByDomain,
  formatMetricValue,
  buildEvidenceTrace,
  extractDiagnosticSummary,
} from './PanelHelpers';
import type { InspectionResult } from '../runtime/InspectorController';

/* ─── MeasurementPanel ─── */
export interface MeasurementPanelProps {
  readonly snapshot: InspectionResult['snapshot'] | null;
  readonly subjectId: string | null;
}

export function MeasurementPanel({ snapshot, subjectId }: MeasurementPanelProps): JSX.Element {
  if (snapshot === null) {
    return <div data-testid="measurement-panel">No measurement data</div>;
  }
  const measurements =
    subjectId !== null
      ? snapshot.measurements.filter((m) => m.subjectId === subjectId)
      : snapshot.measurements;

  return (
    <div data-testid="measurement-panel">
      <h3>Measurements ({measurements.length})</h3>
      {measurements.length === 0 ? (
        <p>No measurements for selected element</p>
      ) : (
        <ul>
          {measurements.map((m, i) => (
            <li key={i} data-testid={`measurement-${i}`}>
              <strong>{m.type}</strong>: {JSON.stringify(m.value)} {m.unit ?? ''}
              <span className="uiq-status">[{m.status}]</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── MetricPanel ─── */
export interface MetricPanelProps {
  readonly metrics: readonly MetricResult[];
  readonly subjectId: string | null;
}

export function MetricPanel({ metrics, subjectId }: MetricPanelProps): JSX.Element {
  const filtered = subjectId !== null ? metrics.filter((m) => m.subjectId === subjectId) : metrics;
  const groups = groupMetricsByDomain(filtered);

  return (
    <div data-testid="metric-panel">
      <h3>Metrics ({filtered.length})</h3>
      {Array.from(groups.entries()).map(([domain, domainMetrics]) => (
        <div key={domain} data-testid={`metric-group-${domain}`}>
          <h4>{domain}</h4>
          <ul>
            {domainMetrics.map((m) => (
              <li key={m.metricId} data-testid={`metric-${m.metricId}`}>
                <strong>{m.metricId}</strong>@{m.metricVersion}: {formatMetricValue(m)}
                <span className={`uiq-status-${m.status.toLowerCase()}`}>[{m.status}]</span>
                <span className="uiq-fingerprint" title={m.fingerprint}>
                  fp:{m.fingerprint.slice(0, 8)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── RulePanel ─── */
export interface RulePanelProps {
  readonly evaluations: readonly EvaluationResult[];
  readonly subjectId: string | null;
}

export function RulePanel({ evaluations, subjectId }: RulePanelProps): JSX.Element {
  const filtered =
    subjectId !== null ? evaluations.filter((e) => e.subjectId === subjectId) : evaluations;

  return (
    <div data-testid="rule-panel">
      <h3>Rules ({filtered.length})</h3>
      {filtered.map((e) => (
        <div
          key={`${e.ruleId}-${e.subjectId}`}
          data-testid={`rule-${e.ruleId}`}
          className="uiq-rule-item"
        >
          <strong>{e.ruleId}</strong>@{e.ruleVersion}
          <span className={`uiq-state-${e.state.toLowerCase()}`}> [{e.state}]</span>
          <span className={`uiq-severity-${e.severity.toLowerCase()}`}> ({e.severity})</span>
          {e.message !== undefined && <p className="uiq-rule-message">{e.message}</p>}
        </div>
      ))}
    </div>
  );
}

/* ─── FindingPanel ─── */
export interface FindingPanelProps {
  readonly findings: readonly Finding[];
  readonly subjectId: string | null;
}

export function FindingPanel({ findings, subjectId }: FindingPanelProps): JSX.Element {
  const filtered =
    subjectId !== null ? findings.filter((f) => f.subjectId === subjectId) : findings;

  return (
    <div data-testid="finding-panel">
      <h3>Findings ({filtered.length})</h3>
      {filtered.map((f) => (
        <div key={f.id} data-testid={`finding-${f.id}`} className="uiq-finding-item">
          <div className="uiq-finding-header">
            <strong>{f.id}</strong>
            <span className="uiq-finding-fingerprint" title={f.fingerprint}>
              fp:{f.fingerprint.slice(0, 8)}
            </span>
          </div>
          <div className="uiq-finding-meta">
            <span className={`uiq-state-${f.state.toLowerCase()}`}>State: {f.state}</span>
            <span className={`uiq-severity-${f.severity.toLowerCase()}`}>
              Severity: {f.severity}
            </span>
            <span>Type: {f.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── DiagnosticPanel ─── */
export interface DiagnosticPanelProps {
  readonly diagnostics: readonly Diagnostic[];
  readonly metrics: readonly MetricResult[];
  readonly findings: readonly Finding[];
}

export function DiagnosticPanel({
  diagnostics,
  metrics,
  findings,
}: DiagnosticPanelProps): JSX.Element {
  return (
    <div data-testid="diagnostic-panel">
      <h3>Diagnostics ({diagnostics.length})</h3>
      {diagnostics.map((d) => {
        const finding = findings.find((f) => f.id === d.findingId);
        const metric =
          finding !== undefined
            ? metrics.find((m) => m.metricId === finding.evaluation.metricResult.metricId)
            : undefined;
        const summary = extractDiagnosticSummary(d, metric);

        return <DiagnosticItem key={d.id} diagnostic={d} summary={summary} />;
      })}
    </div>
  );
}

interface DiagnosticItemProps {
  readonly diagnostic: Diagnostic;
  readonly summary: { observed: string; expected: string; difference: string };
}

function DiagnosticItem({ diagnostic, summary }: DiagnosticItemProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  return (
    <div data-testid={`diagnostic-${diagnostic.id}`} className="uiq-diagnostic-item">
      <div className="uiq-diagnostic-header" onClick={() => setExpanded(!expanded)}>
        <strong>{diagnostic.type}</strong>
        <span className="uiq-confidence">[{diagnostic.confidence}]</span>
        <span className="uiq-cause">Cause: {diagnostic.cause}</span>
        <button className="uiq-expand-toggle">{expanded ? '▼' : '▶'}</button>
      </div>
      <div className="uiq-diagnostic-summary">
        <div>
          <em>Observed:</em> {summary.observed}
        </div>
        <div>
          <em>Expected:</em> {summary.expected}
        </div>
        <div>
          <em>Difference:</em> {summary.difference}
        </div>
      </div>
      {expanded && (
        <div className="uiq-diagnostic-evidence" data-testid="evidence-graph">
          <h5>Evidence Graph</h5>
          <p>{diagnostic.explanation}</p>
          <ul>
            {diagnostic.evidence.map((e, i) => (
              <li key={i}>
                {e.type}: {e.referenceId}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── TokenPanel ─── */
export interface TokenPanelProps {
  readonly metrics: readonly MetricResult[];
  readonly subjectId: string | null;
}

export function TokenPanel({ metrics, subjectId }: TokenPanelProps): JSX.Element {
  const filtered = subjectId !== null ? metrics.filter((m) => m.subjectId === subjectId) : metrics;
  const tokenMetrics = filtered.filter((m) => m.metricId.startsWith('TOKEN.'));

  return (
    <div data-testid="token-panel">
      <h3>Tokens ({tokenMetrics.length})</h3>
      {tokenMetrics.map((m) => (
        <div key={m.metricId} data-testid={`token-${m.metricId}`} className="uiq-token-item">
          <strong>{m.metricId}</strong>: {formatMetricValue(m)}
          <span className={`uiq-status-${m.status.toLowerCase()}`}>[{m.status}]</span>
          {m.metadata?.confidence !== undefined && (
            <span className="uiq-confidence">Confidence: {String(m.metadata.confidence)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── ThemePanel ─── */
export interface ThemePanelProps {
  readonly themeId: string | null;
  readonly metrics: readonly MetricResult[];
}

export function ThemePanel({ themeId, metrics }: ThemePanelProps): JSX.Element {
  const themeMetrics = metrics.filter((m) => m.metricId.startsWith('THEME.'));
  const available = themeMetrics.filter((m) => m.status === 'AVAILABLE').length;

  return (
    <div data-testid="theme-panel">
      <h3>Theme</h3>
      <div className="uiq-theme-info">
        <span>ID: {themeId ?? 'none'}</span>
        <span>Status: {themeId !== null ? 'ACTIVE' : 'NONE'}</span>
        <span>
          Coverage: {available}/{themeMetrics.length} metrics
        </span>
      </div>
    </div>
  );
}

/* ─── TracePanel ─── */
export interface TracePanelProps {
  readonly findings: readonly Finding[];
  readonly subjectId: string | null;
  readonly onNavigate?: (target: string) => void;
}

export function TracePanel({ findings, subjectId, onNavigate }: TracePanelProps): JSX.Element {
  const filtered =
    subjectId !== null ? findings.filter((f) => f.subjectId === subjectId) : findings;

  return (
    <div data-testid="trace-panel">
      <h3>Evidence Trace</h3>
      {filtered.map((f) => {
        const trace = buildEvidenceTrace(f);
        return (
          <div key={f.id} data-testid={`trace-${f.id}`} className="uiq-trace-item">
            <h4>{f.id}</h4>
            <ol className="uiq-trace-path">
              {trace.map((step, i) => (
                <li key={i} className="uiq-trace-step" onClick={() => onNavigate?.(step)}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </div>
  );
}
