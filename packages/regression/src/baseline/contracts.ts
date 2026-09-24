import type {
  Diagnostic,
  EngineInfo,
  EvaluationResult,
  Finding,
  MeasurementSnapshot,
  MetricResult,
} from '@uiq/core';

/** 共享输入错误（approve/serialize 共用；"缺失 Baseline 为输入错误"，AD-22）。 */
export class BaselineInputError extends Error {
  override readonly name = 'BaselineInputError';
  constructor(message: string) {
    super(message);
  }
}

/**
 * ARCH-01 §5.1：AnalysisSnapshot 是 regression 的交换契约，由应用组装；
 * 全部字段引用 core 类型族，不重复定义领域类型。
 * CLI 的 AnalysisArtifact 是本契约的兼容子形状（无 themeId/config；engine 为组件映射）。
 */
export interface AnalysisSnapshot {
  readonly schemaVersion: string;
  readonly snapshot: MeasurementSnapshot;
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics?: readonly Diagnostic[];
  /** 组件名 → 引擎信息（兼容 CLI AnalysisArtifact.engine 的 {metrics,rules,diagnostics} 投影）。 */
  readonly engine: Readonly<Record<string, EngineInfo>>;
  readonly themeId?: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

/**
 * UIQ-IMPL-11 §42：Baseline。由 AnalysisSnapshot 经 approveBaseline 显式批准固定；
 * createdAt/approvedAt 由调用方显式传入（AD-04/AD-08：函数不取系统时间）。
 * engines/config/diagnostics 为 V1.0 实现扩展（PLAN P6-02：基线保留版本/环境/配置）。
 */
export interface Baseline {
  readonly id: string;
  readonly createdAt: string;
  /** 交换契约版本（ARCH-01 §5.1），来自来源 AnalysisSnapshot；回归可比性核验输入（AD-23）。 */
  readonly schemaVersion: string;
  readonly engine: EngineInfo;
  readonly snapshot: MeasurementSnapshot;
  readonly metrics: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly approvedAt: string;
  readonly themeId?: string;
  readonly engines?: Readonly<Record<string, EngineInfo>>;
  readonly config?: Readonly<Record<string, unknown>>;
  readonly diagnostics?: readonly Diagnostic[];
}

/** UIQ-IMPL-11 §43：RegressionRequest。 */
export interface RegressionRequest {
  readonly baseline: Baseline;
  readonly current: AnalysisSnapshot;
}
