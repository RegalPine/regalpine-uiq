/**
 * 报告范围（IMPL-17 §4 scope 字段的投影）。
 * 只记录事实来源（快照/主体/主题/视口），由调用方的分析产物投影而来。
 */
export interface ReportScope {
  readonly snapshotIds: readonly string[];
  readonly subjects: readonly string[];
  readonly themes: readonly string[];
  /** 视口以 "widthxheight" 规范化字符串表示，排序去重。 */
  readonly viewports: readonly string[];
  readonly generatedFrom: 'ANALYSIS' | 'INSPECTOR' | 'IMPORT';
}
