import { type JSX, useState, useCallback } from 'react';
import { createDefaultMetricRegistry, MetricExecutionEngine } from '@uiq/metrics';
import { createDefaultRuleRegistry, EvaluationEngine } from '@uiq/rules';
import type { MeasurementSnapshot, MetricResult, EvaluationResult } from '@uiq/core';

const METRICS_ENGINE = { name: '@uiq/metrics' as const, version: '1.0.0' as const };
const RULES_ENGINE = { name: '@uiq/rules' as const, version: '1.0.0' as const };

/**
 * P9：UIQ Playground — 指标/规则调试应用。
 *
 * 输入 Metric/Rule 配置 → 显示执行结果。
 * 不实现领域算法，只调用领域包公共 API。
 */
export function App(): JSX.Element {
  const [snapshotJson, setSnapshotJson] = useState<string>(
    JSON.stringify(
      {
        id: 'test-snap',
        capturedAt: Date.now(),
        source: { type: 'MANUAL', adapter: 'playground', version: '1.0.0' },
        measurements: [],
      },
      null,
      2,
    ),
  );
  const [metricResults, setMetricResults] = useState<MetricResult[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(() => {
    try {
      setError(null);
      const snapshot: MeasurementSnapshot = JSON.parse(snapshotJson);

      // Run metrics
      const metricRegistry = createDefaultMetricRegistry();
      const metricEngine = new MetricExecutionEngine({
        engine: METRICS_ENGINE,
        registry: metricRegistry,
      });
      const subjects = [...new Set(snapshot.measurements.map((m) => m.subjectId))].sort();
      const metricReport = metricEngine.execute(snapshot, {
        snapshotId: snapshot.id,
        subjects,
        metrics: [
          { id: 'COLOR.SRGB', version: '1.0.0' },
          { id: 'COLOR.CONTRAST', version: '1.0.0' },
          { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
          { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
          { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
        ],
      });
      setMetricResults([...metricReport.results]);

      // Run rules
      const ruleRegistry = createDefaultRuleRegistry();
      const ruleEngine = new EvaluationEngine({
        engine: RULES_ENGINE,
        ruleRegistry,
      });
      const ruleReport = ruleEngine.evaluate(
        {
          snapshotId: snapshot.id,
          subjects,
          rules: [
            { id: 'ACCESSIBILITY.CONTRAST.WCAG_AA', version: '1.0.0' },
            { id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM', version: '1.0.0' },
          ],
        },
        metricReport.results,
      );
      setEvaluationResults([...ruleReport.evaluations]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [snapshotJson]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>UIQ Playground</h1>
      <p>Input a MeasurementSnapshot JSON → execute metrics & rules → view results.</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2>Input Snapshot</h2>
          <textarea
            value={snapshotJson}
            onChange={(e) => setSnapshotJson(e.target.value)}
            rows={15}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button onClick={handleRun} style={{ marginTop: '8px', padding: '8px 16px' }}>
            Run Analysis
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <h2>Metric Results ({metricResults.length})</h2>
          <pre style={{ fontSize: '11px', maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(metricResults, null, 2)}
          </pre>

          <h2>Evaluation Results ({evaluationResults.length})</h2>
          <pre style={{ fontSize: '11px', maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(evaluationResults, null, 2)}
          </pre>

          {error !== null && (
            <div style={{ color: 'red', marginTop: '8px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
