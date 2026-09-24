/**
 * @uiq/tokens — Token 资产模型、引用图与解析（IMPL-09 §62、IMPL-19 §17）。
 * 依赖白名单：仅 @uiq/core（ARCH-01 §4.2）；禁止 browser/rules/diagnostic 反向依赖（IMPL-09 §64）。
 */
export type { ImportDialect, TokenAsset, TokenAssetErrorCode } from './model/design-token';
export { TokenAssetError, normalizeDesignToken, normalizeTokenAsset } from './model/design-token';

export type { BrokenReference, TokenGraph } from './graph/build-token-graph';
export {
  buildTokenGraph,
  detectTokenCycles,
  findBrokenReferences,
  findOrphanTokens,
} from './graph/build-token-graph';

export type {
  TokenResolutionContext,
  TokenResolutionResult,
  TokenResolutionStatus,
  TokenResolver,
} from './resolution/token-resolver';
export { createTokenResolver } from './resolution/token-resolver';

export type { TokenImpactResult } from './impact/compute-impact';
export { computeImpact, computeImpactFromTokens } from './impact/compute-impact';
