import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runAnalysis } from '../../apps/cli/src/artifact';
import { cliEntryPath, injectAndCapture, referenceUrl } from './helpers';

/** G2 退出标准：同一保存快照离线运行得到等价领域结果（state/fingerprint/finding id 一致）。 */
test('在线采集快照 → 离线 CLI 分析与在线分析等价', async ({ page }) => {
  await page.goto(referenceUrl('button.html'));
  const snapshot = await injectAndCapture(page);

  const dir = mkdtempSync(path.join(tmpdir(), 'uiq-replay-'));
  const snapshotPath = path.join(dir, 'snapshot.json');
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  try {
    const online = runAnalysis(snapshot);

    const proc = spawnSync(process.execPath, [cliEntryPath, 'analyze', snapshotPath], {
      encoding: 'utf8',
    });
    expect(proc.stderr).toBe('');
    expect(proc.status).toBe(0);
    const response = JSON.parse(proc.stdout) as {
      status: string;
      command: string;
      data?: unknown;
    };
    expect(response.command).toBe('analyze');
    expect(response.status).toBe('COMPLETED');
    const offline = response.data as ReturnType<typeof runAnalysis>;

    // Metric：subject + metric + version 维度上 status 与 fingerprint 完全一致
    const metricSignature = (
      results: readonly {
        subjectId: string;
        metricId: string;
        metricVersion: string;
        status: string;
        fingerprint: string;
      }[],
    ) =>
      results.map(
        (r) => `${r.subjectId}::${r.metricId}@${r.metricVersion}=${r.status}#${r.fingerprint}`,
      );
    expect(metricSignature(offline.metricResults)).toEqual(metricSignature(online.metricResults));

    // Evaluation：rule 维度上 state 与 fingerprint 完全一致
    const evaluationSignature = (
      results: readonly {
        subjectId: string;
        ruleId: string;
        ruleVersion: string;
        state: string;
        fingerprint: string;
      }[],
    ) =>
      results.map(
        (e) => `${e.subjectId}::${e.ruleId}@${e.ruleVersion}=${e.state}#${e.fingerprint}`,
      );
    expect(evaluationSignature(offline.evaluations)).toEqual(
      evaluationSignature(online.evaluations),
    );

    // Finding：id（确定性指纹派生）与状态完全一致
    const findingSignature = (
      results: readonly { id: string; state: string; fingerprint: string }[],
    ) => results.map((f) => `${f.id}=${f.state}#${f.fingerprint}`);
    expect(findingSignature(offline.findings)).toEqual(findingSignature(online.findings));

    // 快照本身一致（离线产物嵌回同一输入）
    expect(offline.snapshot).toEqual(snapshot);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
