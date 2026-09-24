import type { DesignToken } from '@uiq/core';

/**
 * Token 引用图（TK-01 §9-11、IMPL-09 §10-12）。
 * edges 为出边（token → 它引用的 id），reverseEdges 为入边（token → 引用它的 id）。
 * 断裂引用（出边指向不存在的 id）不进入 edges，由 findBrokenReferences 单独报告，
 * 以保证遍历算法只面对有效节点。
 */
export interface TokenGraph {
  readonly nodes: ReadonlyMap<string, DesignToken>;
  readonly edges: ReadonlyMap<string, readonly string[]>;
  readonly reverseEdges: ReadonlyMap<string, readonly string[]>;
}

export interface BrokenReference {
  readonly from: string;
  readonly to: string;
}

export function buildTokenGraph(tokens: readonly DesignToken[]): TokenGraph {
  const nodes = new Map<string, DesignToken>();
  for (const token of tokens) nodes.set(token.id, token);

  const edges = new Map<string, string[]>();
  const reverseEdges = new Map<string, string[]>();
  for (const token of nodes.values()) {
    const refs =
      typeof token.reference === 'string' && nodes.has(token.reference) ? [token.reference] : [];
    edges.set(token.id, refs);
    for (const to of refs) {
      const list = reverseEdges.get(to);
      if (list) list.push(token.id);
      else reverseEdges.set(to, [token.id]);
    }
  }
  return { nodes, edges, reverseEdges };
}

/**
 * 环检测（TK-01 §11-12）：返回完整路径 [A, B, C, A]。
 * 同一环从不同起点发现时按规范化（起点取字典序最小节点）去重。
 */
export function detectTokenCycles(graph: TokenGraph): readonly (readonly string[])[] {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  for (const id of graph.nodes.keys()) color.set(id, WHITE);

  const cycles: string[][] = [];
  const seenCycles = new Set<string>();

  const dfs = (id: string, stack: string[]): void => {
    color.set(id, GRAY);
    stack.push(id);
    for (const next of graph.edges.get(id) ?? []) {
      const state = color.get(next);
      if (state === GRAY) {
        const start = stack.indexOf(next);
        const cycle = [...stack.slice(start), next];
        const normalizedKey = normalizeCycleKey(cycle);
        if (!seenCycles.has(normalizedKey)) {
          seenCycles.add(normalizedKey);
          cycles.push(cycle);
        }
      } else if (state === WHITE) {
        dfs(next, stack);
      }
    }
    stack.pop();
    color.set(id, BLACK);
  };

  for (const id of [...graph.nodes.keys()].sort()) {
    if (color.get(id) === WHITE) dfs(id, []);
  }
  return cycles;
}

function normalizeCycleKey(cycle: readonly string[]): string {
  // cycle 形如 [A, B, C, A]；去掉末尾重复起点后，从字典序最小节点开始轮转作为规范化键。
  const path = cycle.slice(0, -1);
  let minIndex = 0;
  for (let i = 1; i < path.length; i += 1) {
    if (path[i]! < path[minIndex]!) minIndex = i;
  }
  return [...path.slice(minIndex), ...path.slice(0, minIndex)].join('→');
}

/** Orphan（TK-01 §27-28）：没有任何有效引用的 token。ORPHAN ≠ INVALID，只报告事实。 */
export function findOrphanTokens(graph: TokenGraph): readonly string[] {
  const orphans: string[] = [];
  for (const id of graph.nodes.keys()) {
    if ((graph.reverseEdges.get(id) ?? []).length === 0) orphans.push(id);
  }
  return orphans.sort();
}

/** 断裂引用：reference 指向资产中不存在的 id（解析时产生 UNKNOWN，见 token-resolver）。 */
export function findBrokenReferences(graph: TokenGraph): readonly BrokenReference[] {
  const broken: BrokenReference[] = [];
  for (const token of graph.nodes.values()) {
    if (typeof token.reference === 'string' && !graph.nodes.has(token.reference)) {
      broken.push({ from: token.id, to: token.reference });
    }
  }
  return broken.sort((a, b) =>
    a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from),
  );
}
