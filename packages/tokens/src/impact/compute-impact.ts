import type { DesignToken } from '@uiq/core';

import { buildTokenGraph } from '../graph/build-token-graph';
import type { TokenGraph } from '../graph/build-token-graph';

/**
 * Token Impact Trace（TK-01 §40-43、IMPL-09 §54-55）：
 * 修改 rootTokenId 时，沿反向引用边收集全部受影响 token（不含 root 本身）。
 * 输出按 BFS 层级排序（同层字典序），保证确定性。
 */
export interface TokenImpactResult {
  readonly rootTokenId: string;
  readonly affectedTokenIds: readonly string[];
}

export function computeImpact(graph: TokenGraph, rootTokenId: string): TokenImpactResult {
  if (!graph.nodes.has(rootTokenId)) {
    return { rootTokenId, affectedTokenIds: [] };
  }
  const affected: string[] = [];
  const visited = new Set<string>([rootTokenId]);
  let frontier: string[] = [rootTokenId];
  while (frontier.length > 0) {
    const nextFrontier: string[] = [];
    for (const id of frontier) {
      for (const dependent of graph.reverseEdges.get(id) ?? []) {
        if (visited.has(dependent)) continue;
        visited.add(dependent);
        affected.push(dependent);
        nextFrontier.push(dependent);
      }
    }
    nextFrontier.sort();
    frontier = nextFrontier;
  }
  return { rootTokenId, affectedTokenIds: affected };
}

/** 便捷封装：从 token 列表直接构建图并计算影响。 */
export function computeImpactFromTokens(
  tokens: readonly DesignToken[],
  rootTokenId: string,
): TokenImpactResult {
  return computeImpact(buildTokenGraph(tokens), rootTokenId);
}
