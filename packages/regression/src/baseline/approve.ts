import type { EngineInfo } from '@uiq/core';
import type { AnalysisSnapshot, Baseline } from './contracts';
import { BaselineInputError } from './contracts';

export interface ApproveBaselineOptions {
  /** Baseline 标识（由调用方分配；store 以此为键）。 */
  readonly id: string;
  /** 批准时间（ISO 字符串；显式传入，函数不取系统时间 —— AD-04/AD-08）。 */
  readonly approvedAt: string;
  readonly createdAt?: string;
  /** §42 顶层 engine；未提供时合成 {name:'uiq', version: schemaVersion}。 */
  readonly engine?: EngineInfo;
  /** 显式登记基线配置（规则配置等；"基线保留版本/环境/配置"）。 */
  readonly config?: Readonly<Record<string, unknown>>;
}

/**
 * 显式批准是 Baseline 的唯一入口（ARCH-01 §5.1：Baseline 由用户批准后固定；
 * PLAN P6-02"显式批准流程"，无自动路径）。
 */
export function approveBaseline(
  snapshot: AnalysisSnapshot,
  options: ApproveBaselineOptions,
): Baseline {
  const problems: string[] = [];
  if (typeof snapshot.schemaVersion !== 'string' || snapshot.schemaVersion.length === 0) {
    problems.push('schemaVersion 缺失');
  }
  if (snapshot.snapshot === undefined || snapshot.snapshot.id.length === 0) {
    problems.push('snapshot.id 缺失');
  }
  if (snapshot.engine === undefined || Object.keys(snapshot.engine).length === 0) {
    problems.push('engine 信息缺失');
  }
  if (!Array.isArray(snapshot.evaluations) || snapshot.evaluations.length === 0) {
    problems.push('evaluations 为空：空评价集合不构成可用基线');
  }
  if (problems.length > 0) {
    throw new BaselineInputError(`无法批准 Baseline：${problems.join('；')}`);
  }
  // 显式传入的批准配置优先；否则保留 AnalysisSnapshot 自带配置。
  const config = options.config ?? snapshot.config;
  return {
    id: options.id,
    createdAt: options.createdAt ?? options.approvedAt,
    schemaVersion: snapshot.schemaVersion,
    engine: options.engine ?? { name: 'uiq', version: snapshot.schemaVersion },
    snapshot: snapshot.snapshot,
    metrics: snapshot.metricResults,
    evaluations: snapshot.evaluations,
    findings: snapshot.findings,
    approvedAt: options.approvedAt,
    ...(snapshot.themeId !== undefined ? { themeId: snapshot.themeId } : {}),
    ...(config !== undefined ? { config } : {}),
    ...(snapshot.diagnostics !== undefined ? { diagnostics: snapshot.diagnostics } : {}),
    engines: snapshot.engine,
  };
}
