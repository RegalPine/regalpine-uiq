import { fingerprint } from '@uiq/core';
import type { DesignToken } from '@uiq/core';

import { buildTokenGraph, detectTokenCycles } from '../graph/build-token-graph';
import type { TokenGraph } from '../graph/build-token-graph';

/**
 * Token 解析契约（IMPL-09 §14-18）。
 * 状态语义（§13/§18 裁决）：
 * - RESOLVED：沿引用链到达带 value 的 token；
 * - UNKNOWN：请求的 id 不存在、链中断（断裂引用）、无 value 也无有效 reference —— 资产本身合法但无法解析；
 * - ERROR：引用链存在环 —— 资产结构性错误（TOKEN_GRAPH_ERROR，§12）。
 * 任何情况不得返回猜测值。
 */
export type TokenResolutionStatus = 'RESOLVED' | 'UNKNOWN' | 'ERROR';

export interface TokenResolutionResult {
  readonly tokenId: string;
  readonly resolvedValue?: unknown;
  readonly chain: readonly string[];
  readonly status: TokenResolutionStatus;
  readonly fingerprint: string;
}

export interface TokenResolutionContext {
  readonly themeId?: string;
}

export interface TokenResolver {
  resolve(tokenId: string, context?: TokenResolutionContext): TokenResolutionResult;
}

const RESOLUTION_VERSION = '1.0.0';

export function createTokenResolver(tokens: readonly DesignToken[]): TokenResolver {
  const graph: TokenGraph = buildTokenGraph(tokens);
  const cycles = detectTokenCycles(graph);
  // 预计算：每个节点是否处于环上（环路径中的任一节点的解析都为 ERROR）
  const cyclicNodes = new Set<string>();
  for (const cycle of cycles) {
    for (const id of cycle) cyclicNodes.add(id);
  }
  const cycleByNode = new Map<string, readonly string[]>();
  for (const cycle of cycles) {
    for (const id of cycle) {
      if (!cycleByNode.has(id)) cycleByNode.set(id, cycle);
    }
  }

  const resolveOne = (tokenId: string): TokenResolutionResult => {
    const chain: string[] = [];
    let current = graph.nodes.get(tokenId);
    if (current === undefined) {
      return finish(tokenId, chain, 'UNKNOWN');
    }
    // 环检测：沿链步进时显式检测回到已访问节点（比仅依赖预计算更直接，路径完整）
    const visited = new Set<string>([tokenId]);
    for (;;) {
      chain.push(current.id);
      if (cyclicNodes.has(current.id)) {
        const cycle = cycleByNode.get(current.id) ?? [current.id, current.id];
        return { ...finishCycle(current.id, cycle) };
      }
      const reference = current.reference;
      if (reference === undefined) {
        // 链终点：仅当存在 value 才 RESOLVED；无 value 的终点无法提供事实
        return current.value !== undefined
          ? finishResolved(tokenId, chain, current.value)
          : finish(tokenId, chain, 'UNKNOWN');
      }
      const next = graph.nodes.get(reference);
      if (next === undefined) {
        // 断裂引用：链记录到断裂点为止（§17 chain 保留已走过的路径）
        return finish(tokenId, chain, 'UNKNOWN');
      }
      if (visited.has(next.id)) {
        // 步进回环（防御性：预计算应已捕获）
        const cycle = [...chain, next.id];
        return { ...finishCycle(tokenId, cycle) };
      }
      visited.add(next.id);
      current = next;
    }
  };

  const cache = new Map<string, TokenResolutionResult>();
  return {
    resolve(tokenId: string, _context?: TokenResolutionContext): TokenResolutionResult {
      const cached = cache.get(tokenId);
      if (cached) return cached;
      const result = resolveOne(tokenId);
      cache.set(tokenId, result);
      return result;
    },
  };
}

function finishResolved(
  tokenId: string,
  chain: readonly string[],
  value: unknown,
): TokenResolutionResult {
  return {
    tokenId,
    resolvedValue: value,
    chain,
    status: 'RESOLVED',
    fingerprint: fingerprint({
      type: 'TOKEN_RESOLUTION',
      version: RESOLUTION_VERSION,
      subjectId: tokenId,
      data: { status: 'RESOLVED', resolvedValue: value, chain },
    }),
  };
}

function finish(
  tokenId: string,
  chain: readonly string[],
  status: 'UNKNOWN',
): TokenResolutionResult {
  return {
    tokenId,
    chain,
    status,
    fingerprint: fingerprint({
      type: 'TOKEN_RESOLUTION',
      version: RESOLUTION_VERSION,
      subjectId: tokenId,
      data: { status, chain },
    }),
  };
}

function finishCycle(tokenId: string, cycle: readonly string[]): TokenResolutionResult {
  return {
    tokenId,
    chain: cycle,
    status: 'ERROR',
    fingerprint: fingerprint({
      type: 'TOKEN_RESOLUTION',
      version: RESOLUTION_VERSION,
      subjectId: tokenId,
      data: { status: 'ERROR', cycle },
    }),
  };
}
