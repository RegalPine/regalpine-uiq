import type { MeasurementSnapshot } from '@uiq/core';
import { readFileSync } from 'node:fs';
import {
  resolveLevel,
  assertLevelExecutable,
  type ConformanceLevel,
  type ManifestEntry,
  type GoldenReport,
} from '@uiq/conformance';
import { buildResponse, runAnalysis, type AnalysisArtifact, type CliResponse } from '../artifact';
import { CliError } from '../errors';
import { formatViolations, validateSnapshot } from '../validate';

export interface ConformanceOptions {
  readonly target: string;
  readonly level: string;
}

export interface ConformanceData {
  readonly level: string;
  readonly executable: boolean;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly pendingCases: readonly string[];
  readonly failedCases: readonly string[];
  readonly message?: string;
}

const VALID_LEVELS: readonly ConformanceLevel[] = ['CORE', 'STANDARD', 'BROWSER', 'FULL'];

/** 规则 ID → 清单域映射（与 conformance/level/manifest.ts DOMAIN_MIN_LEVEL 对齐）。 */
function ruleIdToDomain(ruleId: string): string {
  if (ruleId.startsWith('ACCESSIBILITY.')) return 'color';
  if (ruleId.startsWith('TYPOGRAPHY.')) return 'typography';
  if (ruleId.startsWith('GEOMETRY.')) return 'geometry';
  if (ruleId.startsWith('TOKEN.')) return 'token';
  return 'rule';
}

function buildManifestFromArtifact(artifact: AnalysisArtifact): ManifestEntry[] {
  return artifact.evaluations.map((e) => ({
    caseId: `${e.ruleId}@${e.subjectId}`,
    domain: ruleIdToDomain(e.ruleId),
    status: 'COVERED' as const,
  }));
}

function buildGoldenReportFromArtifact(artifact: AnalysisArtifact): GoldenReport {
  const cases = artifact.evaluations.map((e) => ({
    id: `${e.ruleId}@${e.subjectId}`,
    version: e.ruleVersion,
    status:
      e.state === 'PASS'
        ? ('PASS' as const)
        : e.state === 'FAIL'
          ? ('FAIL' as const)
          : ('ERROR' as const),
    ...(e.state !== 'PASS' && e.state !== 'FAIL' ? { message: `评价状态：${e.state}` } : {}),
  }));
  return {
    total: cases.length,
    passed: cases.filter((c) => c.status === 'PASS').length,
    failed: cases.filter((c) => c.status === 'FAIL').length,
    cases,
  };
}

function isSnapshotFile(target: string): boolean {
  if (
    target.startsWith('file://') ||
    target.startsWith('http://') ||
    target.startsWith('https://')
  ) {
    return false;
  }
  return target.endsWith('.json');
}

function loadSnapshot(target: string): MeasurementSnapshot {
  if (!isSnapshotFile(target)) {
    throw new CliError('INPUT_ERROR', 'conformance 仅支持离线快照文件（.json）');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(target, 'utf-8')) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取快照文件 ${target}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const violations = validateSnapshot(parsed);
  if (violations.length > 0) {
    throw new CliError(
      'INPUT_ERROR',
      `输入不是有效的 MeasurementSnapshot：${formatViolations(violations)}`,
    );
  }
  return parsed as MeasurementSnapshot;
}

/**
 * conformance：分析快照并检查指定 Conformance Level 是否可达。
 * 管线：快照 → 完整分析 → 清单映射 → resolveLevel → assertLevelExecutable。
 */
export async function runConformance(
  options: ConformanceOptions,
): Promise<CliResponse<ConformanceData>> {
  const level = options.level.toUpperCase() as ConformanceLevel;
  if (!VALID_LEVELS.includes(level)) {
    throw new CliError(
      'INPUT_ERROR',
      `无效的 conformance level：${options.level}。有效值：${VALID_LEVELS.join(', ')}`,
    );
  }

  const snapshot = loadSnapshot(options.target);
  const artifact = runAnalysis(snapshot);

  const allEntries = buildManifestFromArtifact(artifact);
  const levelEntries = resolveLevel(allEntries, level);
  const goldenReport = buildGoldenReportFromArtifact(artifact);
  const result = assertLevelExecutable(levelEntries, goldenReport);

  const passed = levelEntries.filter((e) => {
    const caseResult = goldenReport.cases.find((c) => c.id === e.caseId);
    return caseResult?.status === 'PASS';
  }).length;
  const failed = levelEntries.filter((e) => {
    const caseResult = goldenReport.cases.find((c) => c.id === e.caseId);
    return caseResult?.status === 'FAIL';
  }).length;

  const data: ConformanceData = {
    level,
    executable: result.executable,
    total: levelEntries.length,
    passed,
    failed,
    pendingCases: result.pendingCases,
    failedCases: result.failedCases,
    ...(result.message !== undefined ? { message: result.message } : {}),
  };

  // 不可宣称 → POLICY_BLOCK；有失败 → CONFORMANCE_FAILURE；全通过 → SUCCESS
  if (!result.executable) {
    return buildResponse<ConformanceData>('conformance', {
      status: 'ERROR',
      errors: [{ code: 'POLICY_BLOCK', message: result.message ?? '等级不可宣称' }],
      data,
    });
  }
  if (failed > 0) {
    return buildResponse<ConformanceData>('conformance', {
      status: 'COMPLETED',
      data,
    });
  }
  return buildResponse<ConformanceData>('conformance', {
    status: 'COMPLETED',
    data,
  });
}
