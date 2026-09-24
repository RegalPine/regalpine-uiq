export class MetricNotFoundError extends Error {
  constructor(
    readonly metricId: string,
    readonly version: string,
  ) {
    super(`Metric 未找到：${metricId}@${version}`);
    this.name = 'MetricNotFoundError';
  }
}

export class MetricDependencyCycleError extends Error {
  constructor(readonly cycle: readonly string[]) {
    super(`Metric 依赖环检测：${cycle.join(' -> ')}`);
    this.name = 'MetricDependencyCycleError';
  }
}

export class MetricExecutionError extends Error {
  constructor(
    readonly metricId: string,
    readonly version: string,
    readonly subjectId: string,
    override readonly cause: unknown,
  ) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Metric 执行错误 ${metricId}@${version}[${subjectId}]：${message}`);
    this.name = 'MetricExecutionError';
  }
}
