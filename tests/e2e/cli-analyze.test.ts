import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = resolve(here, '../..');
const CLI_ENTRY = join(ROOT, 'apps/cli/dist/index.js');
const FIXTURE = join(ROOT, 'tests/fixtures/analysis/fixture-snapshot.json');

const ANALYSIS_SCHEMA_ID = 'https://uiq.local/schemas/cli/1.0.0/analysis';

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema([
  JSON.parse(readFileSync(require.resolve('@uiq/core/schemas/contracts.schema.json'), 'utf-8')),
  JSON.parse(readFileSync(join(ROOT, 'apps/cli/schemas/analysis.schema.json'), 'utf-8')),
]);

interface CliResponse {
  readonly schemaVersion: string;
  readonly uiqVersion: string;
  readonly cliVersion: string;
  readonly command: string;
  readonly status: string;
  readonly data?: Record<string, unknown>;
  readonly errors?: readonly { code: string; message: string }[];
  readonly reproducibility?: { readonly deterministic: boolean; readonly snapshotId?: string };
}

function runCli(args: readonly string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI_ENTRY, ...args], { encoding: 'utf8' });
}

/** e2e 固定 fixture 一次性分析产物（多个用例共享进程执行结果）。 */
const proc = runCli(['analyze', FIXTURE]);
const response = JSON.parse(proc.stdout) as CliResponse;
const artifact = response.data as {
  readonly snapshot: { readonly id: string; readonly measurements: readonly unknown[] };
  readonly metricResults: readonly {
    subjectId: string;
    metricId: string;
    status: string;
    value?: { ratio?: number };
  }[];
  readonly evaluations: readonly { subjectId: string; ruleId: string; state: string }[];
  readonly findings: readonly {
    subjectId: string;
    severity: string;
    state: string;
    id: string;
    evidence: readonly unknown[];
  }[];
  readonly diagnostics: readonly { findingId: string; cause: string; explanation: string }[];
  readonly engine: Record<string, unknown>;
};

describe('CLI e2e：analyze 静态快照（vitest 进程外 spawn）', () => {
  it('退出码 0 且 status COMPLETED', () => {
    expect(proc.error).toBeUndefined();
    expect(proc.status).toBe(0);
    expect(response.status).toBe('COMPLETED');
  });

  it('UIQCLIResponse 边界结构（UIQ-ARCH-01 §5.3）', () => {
    expect(response.schemaVersion).toBe('1.0.0');
    expect(response.uiqVersion).toBe('1.0.0');
    expect(response.cliVersion).toBe('1.0.0');
    expect(response.command).toBe('analyze');
    expect(response.reproducibility).toMatchObject({ deterministic: true });
  });

  it('完整分析产物通过 ajv 校验（core + analysis schema，AD-04/AD-05）', () => {
    const validate = ajv.getSchema(ANALYSIS_SCHEMA_ID);
    expect(validate).toBeDefined();
    const valid = validate!(response.data);
    expect(validate!.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it('产物为完整分析链：snapshot → metricResults → evaluations → findings → diagnostics', () => {
    expect(artifact.snapshot.id).toBe('snap-fixture-e2e-001');
    expect(artifact.snapshot.measurements.length).toBeGreaterThan(0);
    expect(artifact.metricResults.length).toBeGreaterThan(0);
    expect(artifact.evaluations.length).toBeGreaterThan(0);
    expect(artifact.engine).toMatchObject({
      metrics: { name: '@uiq/metrics' },
      rules: { name: '@uiq/rules' },
    });
  });

  it('灰白场景 ≈4.48 → WCAG FAIL → Finding + Diagnostic（ER-01 Golden）', () => {
    const contrast = artifact.metricResults.find(
      (r) => r.subjectId === 'btn-gray' && r.metricId === 'COLOR.CONTRAST',
    );
    expect(contrast?.status).toBe('AVAILABLE');
    expect(contrast?.value?.ratio).toBeGreaterThan(4.3);
    expect(contrast?.value?.ratio).toBeLessThan(4.6);

    const evaluation = artifact.evaluations.find(
      (e) => e.subjectId === 'btn-gray' && e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(evaluation?.state).toBe('FAIL');

    const finding = artifact.findings.find((f) => f.subjectId === 'btn-gray');
    expect(finding).toBeDefined();
    expect(finding?.state).toBe('DETECTED');
    expect(finding?.severity).toBe('HIGH');
    expect(finding?.evidence.length).toBeGreaterThan(0);

    const diagnostic = artifact.diagnostics.find((d) => d.findingId === finding?.id);
    expect(diagnostic).toBeDefined();
    expect(diagnostic?.explanation.length ?? '').toBeGreaterThan(0);
  });

  it('白蓝场景 ≈5.17 → PASS', () => {
    const evaluation = artifact.evaluations.find(
      (e) => e.subjectId === 'btn-primary' && e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(evaluation?.state).toBe('PASS');
  });
});

describe('CLI e2e：显式拒绝（不伪造结论）', () => {
  it('inspect 命令 → exit 4 + ERROR（交互式 Inspector 属独立应用）', () => {
    const result = runCli(['inspect']);
    expect(result.status).toBe(4);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.status).toBe('ERROR');
    expect(rejected.errors?.[0]?.code).toBe('INVALID_CONFIGURATION');
    expect(rejected.errors?.[0]?.message).toContain('Inspector');
  });

  it('外域目标未加 --allow-external → exit 4，且未启动浏览器', () => {
    const result = runCli(['analyze', 'https://example.com']);
    expect(result.status).toBe(4);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INVALID_CONFIGURATION');
    expect(rejected.errors?.[0]?.message).toContain('allow-external');
    // 权限校验先于浏览器启动：若浏览器已启动并导航失败，错误码会是 EXECUTION_ERROR
    expect(rejected.errors?.[0]?.code).not.toBe('EXECUTION_ERROR');
  });
});
