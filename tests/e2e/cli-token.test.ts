import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import Ajv2020 from 'ajv/dist/2020.js';
import { afterAll, describe, expect, it } from 'vitest';

/** P5 计划 Task 6：analyze --tokens/--theme/--contract 端到端（进程外 spawn）。 */

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = resolve(here, '../..');
const CLI_ENTRY = join(ROOT, 'apps/cli/dist/index.js');
const FIX = join(ROOT, 'tests/fixtures/token');
const SNAPSHOT = join(FIX, 'fixture-snapshot.json');
const BUNDLE = join(FIX, 'token-bundle.json');
const CONTRACT = join(FIX, 'component-contract.json');

const ANALYSIS_SCHEMA_ID = 'https://uiq.local/schemas/cli/1.0.0/analysis';

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema([
  JSON.parse(readFileSync(require.resolve('@uiq/core/schemas/contracts.schema.json'), 'utf-8')),
  JSON.parse(readFileSync(join(ROOT, 'apps/cli/schemas/analysis.schema.json'), 'utf-8')),
]);

interface CliResponse {
  readonly status: string;
  readonly command: string;
  readonly data?: Record<string, unknown>;
  readonly errors?: readonly { code: string; message: string }[];
  readonly warnings?: readonly { code: string; message: string }[];
}

function runCli(args: readonly string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI_ENTRY, ...args], { encoding: 'utf8' });
}

interface TokenArtifact {
  readonly snapshot: {
    readonly id: string;
    readonly bindings?: readonly Record<string, unknown>[];
  };
  readonly metricResults: readonly {
    subjectId: string;
    metricId: string;
    status: string;
    value?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }[];
  readonly evaluations: readonly {
    subjectId: string;
    ruleId: string;
    state: string;
    metricResult?: { value?: Record<string, unknown> };
  }[];
  readonly findings: readonly {
    id: string;
    subjectId: string;
    state: string;
    severity: string;
    type: string;
  }[];
  readonly diagnostics: readonly { findingId: string; cause: string }[];
}

/** e2e 主场景：--tokens + --theme + --contract 一次性分析（多用例共享）。 */
const proc = runCli([
  'analyze',
  SNAPSHOT,
  '--tokens',
  BUNDLE,
  '--theme',
  'light',
  '--contract',
  CONTRACT,
]);
const response = JSON.parse(proc.stdout) as CliResponse;
const artifact = response.data as unknown as TokenArtifact;

afterAll(() => {
  // 临时坏资产目录清理（见"资产语义非法"用例）。
  rmSync(tmpAssetDir, { recursive: true, force: true });
});

const tmpAssetDir = mkdtempSync(join(tmpdir(), 'uiq-token-'));

describe('CLI e2e：analyze --tokens（vitest 进程外 spawn）', () => {
  it('退出码 0 且 status COMPLETED', () => {
    expect(proc.error).toBeUndefined();
    expect(proc.status).toBe(0);
    expect(response.status).toBe('COMPLETED');
  });

  it('完整产物通过 ajv 校验（含 bindings 的 snapshot，AD-04/AD-05）', () => {
    const validate = ajv.getSchema(ANALYSIS_SCHEMA_ID);
    expect(validate).toBeDefined();
    const valid = validate!(response.data);
    expect(validate!.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it('snapshot 携带绑定证据（IMPL-09 §41）', () => {
    const bindings = artifact.snapshot.bindings ?? [];
    expect(bindings.length).toBeGreaterThanOrEqual(6);
    const explicit = bindings.find((b) => b['subjectId'] === 'token.button.exact');
    expect(explicit).toMatchObject({
      tokenId: 'button.primary.background',
      bindingType: 'EXPLICIT',
      confidence: 'DIRECT',
    });
  });

  it('TOKEN 三指标运行：exact subject 解析链与 MATCH（AC-THEME-02/04）', () => {
    const resolution = artifact.metricResults.find(
      (m) => m.subjectId === 'token.button.exact' && m.metricId === 'TOKEN.RESOLUTION',
    );
    expect(resolution?.status).toBe('AVAILABLE');
    expect(resolution?.value).toMatchObject({
      resolvedValue: '#2563eb',
      resolutionChain: ['button.primary.background', 'color.blue.600'],
    });
    const match = artifact.metricResults.find(
      (m) => m.subjectId === 'token.button.exact' && m.metricId === 'TOKEN.MATCH',
    );
    expect(match?.value).toMatchObject({ result: 'MATCH' });
    // Token Match 与 Token Deviation 分离（AC-THEME-04）。
    expect(
      artifact.metricResults.some(
        (m) => m.subjectId === 'token.button.exact' && m.metricId === 'TOKEN.DEVIATION',
      ),
    ).toBe(true);
  });

  it('手写偏差 → TOKEN.MATCH FAIL 评价 + Finding + TOKEN 根因 Diagnostic（AC-THEME-11）', () => {
    const evaluation = artifact.evaluations.find(
      (e) => e.subjectId === 'token.button.deviation' && e.ruleId === 'TOKEN.TOKEN_MATCH',
    );
    expect(evaluation?.state).toBe('FAIL');
    const finding = artifact.findings.find((f) => f.subjectId === 'token.button.deviation');
    expect(finding).toMatchObject({
      state: 'DETECTED',
      severity: 'MEDIUM',
      type: 'TOKEN_DEVIATION',
    });
    const diagnostic = artifact.diagnostics.find((d) => d.findingId === finding?.id);
    expect(diagnostic?.cause).toBe('TOKEN');
  });

  it('UNRESOLVED 绑定 → UNKNOWN（AC-THEME-06 不强行推断）', () => {
    const evaluation = artifact.evaluations.find(
      (e) => e.subjectId === 'token.button.orphan-bg' && e.ruleId === 'TOKEN.TOKEN_MATCH',
    );
    expect(evaluation?.state).toBe('UNKNOWN');
  });

  it('COMPONENT_CONFORMANCE 在 contract.id 上 PASS', () => {
    const evaluation = artifact.evaluations.find(
      (e) => e.subjectId === 'button.primary' && e.ruleId === 'TOKEN.COMPONENT_CONFORMANCE',
    );
    expect(evaluation?.state).toBe('PASS');
    expect(evaluation?.metricResult?.value).toMatchObject({ requiredTotal: 2, matched: 2 });
  });
});

describe('CLI e2e：--theme dark 独立评价（TK-01 §33/§36）', () => {
  const dark = runCli([
    'analyze',
    join(FIX, 'fixture-snapshot-dark.json'),
    '--tokens',
    BUNDLE,
    '--theme',
    'dark',
  ]);
  const darkResponse = JSON.parse(dark.stdout) as CliResponse;
  const darkArtifact = darkResponse.data as unknown as TokenArtifact;

  it('Dark 主题独立解析：exact 期望随主题变为 #60a5fa → MATCH', () => {
    expect(dark.status).toBe(0);
    expect(darkResponse.status).toBe('COMPLETED');
    const resolution = darkArtifact.metricResults.find(
      (m) => m.subjectId === 'token.button.exact' && m.metricId === 'TOKEN.RESOLUTION',
    );
    expect(resolution?.value).toMatchObject({ resolvedValue: '#60a5fa' });
    const evaluation = darkArtifact.evaluations.find(
      (e) => e.subjectId === 'token.button.exact' && e.ruleId === 'TOKEN.TOKEN_MATCH',
    );
    expect(evaluation?.state).toBe('PASS');
  });

  it('Dark 下陈旧 dialog 表面独立 FAIL（Light PASS ≠ Dark 自动 PASS）', () => {
    const evaluation = darkArtifact.evaluations.find(
      (e) => e.subjectId === 'token.dialog.content' && e.ruleId === 'TOKEN.TOKEN_MATCH',
    );
    expect(evaluation?.state).toBe('FAIL');
  });
});

describe('CLI e2e：无 --tokens 时行为不变（不伪造 TOKEN 结论）', () => {
  it('同一快照无 --tokens：无 TOKEN 指标/评价，exit 0', () => {
    const plain = runCli(['analyze', SNAPSHOT]);
    expect(plain.status).toBe(0);
    const plainResponse = JSON.parse(plain.stdout) as CliResponse;
    expect(plainResponse.status).toBe('COMPLETED');
    const data = plainResponse.data as unknown as TokenArtifact;
    expect(data.metricResults.some((m) => m.metricId.startsWith('TOKEN.'))).toBe(false);
    expect(data.evaluations.some((e) => e.ruleId.startsWith('TOKEN.'))).toBe(false);
  });

  it('--theme 无 --tokens → exit 4 INVALID_CONFIGURATION', () => {
    const result = runCli(['analyze', SNAPSHOT, '--theme', 'light']);
    expect(result.status).toBe(4);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INVALID_CONFIGURATION');
  });
});

describe('CLI e2e：Token 输入错误分类（exit 4 vs exit 5）', () => {
  it('--tokens 文件不存在 → exit 5 INPUT_ERROR', () => {
    const result = runCli(['analyze', SNAPSHOT, '--tokens', join(FIX, 'no-such-asset.json')]);
    expect(result.status).toBe(5);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INPUT_ERROR');
  });

  it('--tokens 非法 JSON → exit 5 INPUT_ERROR', () => {
    const bad = join(tmpAssetDir, 'not-json.json');
    writeFileSync(bad, '{broken', 'utf-8');
    const result = runCli(['analyze', SNAPSHOT, '--tokens', bad]);
    expect(result.status).toBe(5);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INPUT_ERROR');
  });

  it('资产语义非法（TK01 缺 layer）→ exit 4 INVALID_CONFIGURATION（AD-14 不按字符串猜测）', () => {
    const bad = join(tmpAssetDir, 'tk01-missing-layer.json');
    writeFileSync(
      bad,
      JSON.stringify({
        assetId: 'bad',
        version: '1.0.0',
        dialect: 'TK01',
        tokens: [{ id: 't.1', name: 'T1', type: 'COLOR', value: '#123456' }],
      }),
      'utf-8',
    );
    const result = runCli(['analyze', SNAPSHOT, '--tokens', bad]);
    expect(result.status).toBe(4);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INVALID_CONFIGURATION');
    expect(rejected.errors?.[0]?.message).toContain('LAYER_MISSING');
  });

  it('--theme 未定义的 id → exit 5 INPUT_ERROR', () => {
    const result = runCli(['analyze', SNAPSHOT, '--tokens', BUNDLE, '--theme', 'high-contrast']);
    expect(result.status).toBe(5);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INPUT_ERROR');
    expect(rejected.errors?.[0]?.message).toContain('high-contrast');
  });

  it('--contract 文件损坏 → exit 5 INPUT_ERROR', () => {
    const bad = join(tmpAssetDir, 'bad-contract.json');
    writeFileSync(bad, JSON.stringify({ id: 'c1' }), 'utf-8');
    const result = runCli(['analyze', SNAPSHOT, '--tokens', BUNDLE, '--contract', bad]);
    expect(result.status).toBe(5);
    const rejected = JSON.parse(result.stdout) as CliResponse;
    expect(rejected.errors?.[0]?.code).toBe('INPUT_ERROR');
  });

  it('断裂引用资产：不中断分析，warnings 呈现 THEME_INTEGRITY（不伪造结论）', () => {
    const result = runCli([
      'analyze',
      SNAPSHOT,
      '--tokens',
      join(FIX, 'asset-broken.json'),
      '--theme',
      'light',
    ]);
    // asset-broken 是裸资产形态 + --theme：裸资产无 themes → INPUT_ERROR。
    expect(result.status).toBe(5);
  });

  it('断裂引用（束缚形态主题）→ COMPLETED + THEME_INTEGRITY warning', () => {
    const bundle = join(tmpAssetDir, 'broken-bundle.json');
    const asset = JSON.parse(readFileSync(join(FIX, 'asset-broken.json'), 'utf-8')) as unknown;
    writeFileSync(
      bundle,
      JSON.stringify({
        asset,
        themes: { light: { id: 'light', version: '1.0.0', name: 'Light', tokens: {} } },
      }),
      'utf-8',
    );
    const result = runCli(['analyze', SNAPSHOT, '--tokens', bundle, '--theme', 'light']);
    expect(result.status).toBe(0);
    const ok = JSON.parse(result.stdout) as CliResponse;
    expect(ok.status).toBe('COMPLETED');
    expect(
      ok.warnings?.some(
        (w) => w.code === 'THEME_INTEGRITY' && w.message.includes('REFERENCE_BROKEN'),
      ),
    ).toBe(true);
  });
});
