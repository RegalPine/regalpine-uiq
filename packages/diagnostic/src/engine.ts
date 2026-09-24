import type { Diagnostic, Evidence, Finding, MetricResult } from '@uiq/core';
import { createDiagnosticId } from './finding/factory';
import { classifyCause } from './cause/classifier';
import { generateExplanation } from './explanation/generator';

export class DiagnosticEngine {
  /** 为每个 Finding 生成 Diagnostic。 */
  diagnose(findings: readonly Finding[], metricResults: readonly MetricResult[]): Diagnostic[] {
    const metricMap = new Map<string, MetricResult>();
    for (const mr of metricResults) {
      metricMap.set(`${mr.subjectId}::${mr.metricId}@${mr.metricVersion}`, mr);
    }

    return findings.map((finding) => this.diagnoseOne(finding, metricMap));
  }

  private diagnoseOne(finding: Finding, metricMap: Map<string, MetricResult>): Diagnostic {
    const evaluation = finding.evaluation;
    const metricKey = `${finding.subjectId}::${evaluation.metricResult.metricId}@${evaluation.metricResult.metricVersion}`;
    // P4 裁决：池（metricResults）优先 —— 命中时用真实指标事实；
    // 未命中（如规则自述的聚合事实）回退到 evaluation 携带的 metricResult。
    const metricResult = metricMap.get(metricKey) ?? evaluation.metricResult;

    const cause = classifyCause(finding, metricResult);
    const confidence = this.resolveConfidence(finding, metricResult);
    const explanation = generateExplanation(finding, metricResult);
    const evidence = this.collectEvidence(finding, metricResult);
    const id = createDiagnosticId(finding.id);

    return {
      id,
      findingId: finding.id,
      type: finding.type,
      cause,
      confidence,
      evidence,
      explanation,
    };
  }

  private resolveConfidence(
    finding: Finding,
    metricResult: MetricResult,
  ): Diagnostic['confidence'] {
    if (metricResult.status !== 'AVAILABLE') return 'INFERRED';
    if (finding.evidence.length >= 1 && metricResult.status === 'AVAILABLE') return 'DIRECT';
    if (finding.evidence.length >= 1) return 'SUPPORTED';
    return 'INFERRED';
  }

  private collectEvidence(finding: Finding, metricResult: MetricResult): readonly Evidence[] {
    const evidence: Evidence[] = [...finding.evidence];

    const metricEvidence: Evidence = {
      id: `ev-diagnostic-metric-${metricResult.metricId}`,
      type: 'METRIC',
      referenceId: `${metricResult.metricId}@${metricResult.metricVersion}`,
      relation: 'DERIVED_FROM',
    };
    if (!evidence.some((e) => e.referenceId === metricEvidence.referenceId)) {
      evidence.push(metricEvidence);
    }

    return evidence;
  }
}
