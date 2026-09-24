import { describe, expect, it } from 'vitest';
import {
  buildTokenGraph,
  computeImpactFromTokens,
  createTokenResolver,
  detectTokenCycles,
  findBrokenReferences,
  findOrphanTokens,
} from '@uiq/tokens';
import type { DesignToken } from '@uiq/core';

function token(partial: Pick<DesignToken, 'id'> & Partial<DesignToken>): DesignToken {
  return { name: partial.id, layer: 'PRIMITIVE', valueType: 'COLOR', ...partial } as DesignToken;
}

/** IMPL-09 §66 示例链：button.primary.background → color.action.primary → color.blue.600 */
const chainTokens: readonly DesignToken[] = [
  token({ id: 'color.blue.600', value: '#2563EB' }),
  token({ id: 'color.action.primary', layer: 'SEMANTIC', reference: 'color.blue.600' }),
  token({ id: 'button.primary.background', layer: 'COMPONENT', reference: 'color.action.primary' }),
];

describe('buildTokenGraph / detectTokenCycles / orphan / broken（TK-01 §9-12、IMPL-09 §61）', () => {
  it('边与反向边正确', () => {
    const graph = buildTokenGraph(chainTokens);
    expect(graph.edges.get('button.primary.background')).toEqual(['color.action.primary']);
    expect(graph.reverseEdges.get('color.blue.600')).toEqual(['color.action.primary']);
  });

  it('AC-THEME-01：环检测返回完整路径 A→B→C→A', () => {
    const cycles = detectTokenCycles(
      buildTokenGraph([
        token({ id: 'a', reference: 'b' }),
        token({ id: 'b', reference: 'c' }),
        token({ id: 'c', reference: 'a' }),
      ]),
    );
    expect(cycles).toHaveLength(1);
    const cycle = cycles[0]!;
    expect(cycle[0]).toBe(cycle[cycle.length - 1]);
    expect([...cycle].sort()).toEqual(['a', 'a', 'b', 'c']);
  });

  it('二元环与自环', () => {
    expect(
      detectTokenCycles(
        buildTokenGraph([token({ id: 'a', reference: 'b' }), token({ id: 'b', reference: 'a' })]),
      ),
    ).toHaveLength(1);
    expect(detectTokenCycles(buildTokenGraph([token({ id: 's', reference: 's' })]))).toHaveLength(
      1,
    );
  });

  it('无环 → 空数组', () => {
    expect(detectTokenCycles(buildTokenGraph(chainTokens))).toEqual([]);
  });

  it('orphan = 无入边（IMPL-09 §59-60：ORPHAN = 没有被引用）；被引用者不是 orphan（ORPHAN ≠ INVALID）', () => {
    const graph = buildTokenGraph([
      ...chainTokens,
      token({ id: 'color.blue.700', value: '#1D4ED8' }),
    ]);
    // color.blue.600 / color.action.primary 有入边 → 非 orphan；
    // button.primary.background（COMPONENT 汇点）与 color.blue.700 均无 token 消费者 → orphan。
    expect(findOrphanTokens(graph)).toEqual(['button.primary.background', 'color.blue.700']);
  });

  it('断裂引用单独报告', () => {
    const graph = buildTokenGraph([
      token({ id: 'orphan.ref', layer: 'SEMANTIC', reference: 'missing.token' }),
      token({ id: 'p', value: 1 }),
    ]);
    expect(findBrokenReferences(graph)).toEqual([{ from: 'orphan.ref', to: 'missing.token' }]);
  });
});

describe('createTokenResolver（IMPL-09 §14-18）', () => {
  it('AC-THEME-02：解析链完整（component → semantic → primitive → value）', () => {
    const resolver = createTokenResolver(chainTokens);
    const result = resolver.resolve('button.primary.background');
    expect(result.status).toBe('RESOLVED');
    expect(result.chain).toEqual([
      'button.primary.background',
      'color.action.primary',
      'color.blue.600',
    ]);
    expect(result.resolvedValue).toBe('#2563EB');
    expect(result.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('请求不存在的 token → UNKNOWN（不猜测）', () => {
    const resolver = createTokenResolver(chainTokens);
    const result = resolver.resolve('no.such.token');
    expect(result.status).toBe('UNKNOWN');
    expect(result.resolvedValue).toBeUndefined();
  });

  it('断裂引用 → UNKNOWN，chain 保留已走路径', () => {
    const resolver = createTokenResolver([
      token({ id: 'a', layer: 'SEMANTIC', reference: 'missing' }),
    ]);
    const result = resolver.resolve('a');
    expect(result.status).toBe('UNKNOWN');
    expect(result.chain).toEqual(['a']);
  });

  it('环上 token → ERROR，chain 为完整环路径（TOKEN_GRAPH_ERROR）', () => {
    const resolver = createTokenResolver([
      token({ id: 'a', reference: 'b' }),
      token({ id: 'b', reference: 'c' }),
      token({ id: 'c', reference: 'a' }),
    ]);
    const result = resolver.resolve('a');
    expect(result.status).toBe('ERROR');
    expect(result.chain).toEqual(['a', 'b', 'c', 'a']);
  });

  it('重复解析结果一致（fingerprint 稳定）', () => {
    const resolver = createTokenResolver(chainTokens);
    const first = resolver.resolve('button.primary.background');
    const second = resolver.resolve('button.primary.background');
    expect(second).toEqual(first);
    expect(second.fingerprint).toBe(first.fingerprint);
  });

  it('context.themeId 不改变解析事实（V1.0 单资产）', () => {
    const resolver = createTokenResolver(chainTokens);
    expect(resolver.resolve('color.blue.600', { themeId: 'dark' }).resolvedValue).toBe('#2563EB');
  });
});

describe('computeImpact（TK-01 §42-43、IMPL-09 §54-55）', () => {
  it('修改 primitive 影响全部下游 token，按层级排序，不含 root', () => {
    const impact = computeImpactFromTokens(chainTokens, 'color.blue.600');
    expect(impact.affectedTokenIds).toEqual(['color.action.primary', 'button.primary.background']);
  });

  it('修改 component token 无下游', () => {
    const impact = computeImpactFromTokens(chainTokens, 'button.primary.background');
    expect(impact.affectedTokenIds).toEqual([]);
  });

  it('root 不存在 → 空影响集', () => {
    expect(computeImpactFromTokens(chainTokens, 'nope').affectedTokenIds).toEqual([]);
  });
});
