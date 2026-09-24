/**
 * Token 指标端口（P5 关键决策 4：metrics 不依赖 @uiq/tokens —— ARCH-01 §4.2 白名单）。
 * 应用编排层从 @uiq/tokens 的 createTokenResolver 构造 port 后注入指标工厂。
 * 结果语义（IMPL-09 §14-18）：RESOLVED/UNKNOWN/ERROR 与 TokenResolutionResult 对齐。
 */
export interface TokenResolutionPortResult {
  readonly status: 'RESOLVED' | 'UNKNOWN' | 'ERROR';
  readonly resolvedValue?: unknown;
  /** 完整解析链（component → semantic → primitive）；ERROR 时为环路径 A→B→…→A。 */
  readonly chain?: readonly string[];
}

export interface TokenResolutionPort {
  resolve(tokenId: string): TokenResolutionPortResult;
}
