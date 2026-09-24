export interface MetricExecutionNode {
  readonly metricId: string;
  readonly version: string;
  readonly dependencies: readonly MetricReference[];
}

export interface MetricReference {
  readonly metricId: string;
  readonly version: string;
}

export interface MetricExecutionPlan {
  readonly nodes: readonly MetricExecutionNode[];
}
