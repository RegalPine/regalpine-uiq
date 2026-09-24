export class RuleNotFoundError extends Error {
  constructor(
    readonly ruleId: string,
    readonly version: string,
  ) {
    super(`Rule 未找到：${ruleId}@${version}`);
    this.name = 'RuleNotFoundError';
  }
}

export class RuleEvaluationError extends Error {
  constructor(
    readonly ruleId: string,
    readonly subjectId: string,
    override readonly cause: unknown,
  ) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Rule 执行错误 ${ruleId}[${subjectId}]：${message}`);
    this.name = 'RuleEvaluationError';
  }
}

export class MetricVersionMismatchError extends Error {
  constructor(
    readonly ruleId: string,
    readonly expected: string,
    readonly actual: string,
  ) {
    super(`Rule ${ruleId} 期望 Metric 版本 ${expected}，实际 ${actual}`);
    this.name = 'MetricVersionMismatchError';
  }
}
