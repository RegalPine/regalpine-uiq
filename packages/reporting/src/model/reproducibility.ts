/**
 * 复现元数据（IMPL-17 §34 / IMPL-18 §39）。
 * 报告必须携带引擎/指标/规则版本与配置，使"同快照+同版本+同配置+同引擎 ⇒ 可复现报告"可被校验。
 */
import type { EngineInfo } from '@uiq/core';

export interface ReproducibilityMetadata {
  /** 报告生成是纯函数聚合；恒为 true，任何非确定性来源都会破坏该声明。 */
  readonly deterministic: true;
  readonly engine: EngineInfo;
  readonly metricVersions: readonly string[];
  readonly ruleVersions: readonly string[];
  readonly configuration?: Readonly<Record<string, unknown>>;
}
