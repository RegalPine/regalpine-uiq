import { describe, expect, it } from 'vitest';
import type { Measurement, ComponentBoundary, ComponentRelation } from '@uiq/core';
import {
  analyzeCrossComponentContinuity,
  inferComponentRelations,
  groupByExplicitBoundaries,
} from '@uiq/reporting';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function m(subjectId: string, type: string, value: unknown): Measurement {
  return {
    id: `m-${subjectId}-${type}`, subjectId, type, value,
    source: { type: 'STATIC' }, status: 'AVAILABLE', timestamp: 1000,
  };
}

function boundary(componentId: string, memberIds: string[]): ComponentBoundary {
  return {
    componentId, rootElementId: memberIds[0] ?? '',
    memberElementIds: memberIds, role: 'root',
    source: 'EXPLICIT', confidence: 'DIRECT',
  };
}

function relation(source: string, target: string, rel: ComponentRelation['relation']): ComponentRelation {
  return {
    sourceComponent: source, targetComponent: target,
    relation: rel, sharedDimensions: ['SURFACE', 'COLOR', 'DEPTH'],
    source: 'EXPLICIT', confidence: 'DIRECT',
  };
}

// ---------------------------------------------------------------------------
// E2E: 参考页面 cross-component.html 场景模拟
// ---------------------------------------------------------------------------

describe('Cross-Component E2E — Reference Page Simulation', () => {
  it('Scene 1: TagsView ↔ AppMain 视觉连续 → PASS', () => {
    const measurements = [
      m('tags-1', 'surface.radius', 8),
      m('tab-1', 'color.srgb', { r: 0.91, g: 0.94, b: 0.99 }),
      m('main-1', 'surface.radius', 8),
      m('content-1', 'color.srgb', { r: 0.91, g: 0.94, b: 0.99 }),
    ];
    const boundaries = [
      boundary('TagsView', ['tags-1', 'tab-1']),
      boundary('AppMain', ['main-1', 'content-1']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [relation('TagsView', 'AppMain', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, rels);

    expect(result.componentCount).toBe(2);
    expect(result.continuityScore).toBeGreaterThanOrEqual(0.8);

    const surfaceFinding = result.crossComponentFindings.find(
      (f) => f.dimension === 'SURFACE' && f.type === 'VISUAL_BREAK',
    );
    expect(surfaceFinding?.state).toBe('PASS');
  });

  it('Scene 2: 组件间视觉断裂 → FAIL', () => {
    const measurements = [
      m('tags-fail', 'surface.radius', 4),
      m('main-fail', 'surface.radius', 16),
    ];
    const boundaries = [
      boundary('TagsViewFail', ['tags-fail']),
      boundary('AppMainFail', ['main-fail']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [relation('TagsViewFail', 'AppMainFail', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, rels);

    const surface = result.crossComponentFindings.find(
      (f) => f.type === 'VISUAL_BREAK' && f.dimension === 'SURFACE',
    );
    expect(surface).toBeDefined();
    expect(surface!.state).toBe('FAIL');
    expect(surface!.metricValue.jump).toBe(12);
    expect(surface!.explanation).toContain('跳变');
  });

  it('Scene 3: 跨组件配色不协调 → COLOR_DISHARMONY', () => {
    const measurements = [
      m('msg-1', 'color.srgb', { r: 0.1, g: 0.45, b: 0.91 }),   // blue
      m('msg-text', 'color.srgb', { r: 0.26, g: 0.52, b: 0.96 }), // light blue
      m('avatar-1', 'color.srgb', { r: 0.61, g: 0.15, b: 0.69 }), // purple
      m('avatar-2', 'color.srgb', { r: 0.74, g: 0.41, b: 0.78 }), // light purple
    ];
    const boundaries = [
      boundary('MessageBubble', ['msg-1', 'msg-text']),
      boundary('AvatarGroup', ['avatar-1', 'avatar-2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [relation('MessageBubble', 'AvatarGroup', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, rels);

    const colorFinding = result.crossComponentFindings.find(
      (f) => f.type === 'COLOR_DISHARMONY',
    );
    expect(colorFinding).toBeDefined();
    // 蓝色和紫色的 Jaccard 重叠度应该很低
    expect(colorFinding!.metricValue.jaccard as number).toBeLessThan(0.3);
  });

  it('Scene 4: Token 共享一致 → TOKEN_DRIFT PASS', () => {
    const sameColor = { r: 0.1, g: 0.45, b: 0.91 };
    const measurements = [
      m('btn', 'color.srgb', sameColor),
      m('card', 'color.srgb', sameColor),
    ];
    const boundaries = [
      boundary('ActionButton', ['btn']),
      boundary('InfoCard', ['card']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [relation('ActionButton', 'InfoCard', 'SHARES_TOKEN')];
    const result = analyzeCrossComponentContinuity(groups, rels);

    const tokenDrift = result.crossComponentFindings.find(
      (f) => f.type === 'TOKEN_DRIFT',
    );
    expect(tokenDrift).toBeDefined();
    expect(tokenDrift!.state).toBe('PASS');
  });

  it('Scene 5: Token 漂移 → TOKEN_DRIFT FAIL', () => {
    const measurements = [
      m('btn-drift', 'color.srgb', { r: 0.1, g: 0.45, b: 0.91 }),
      m('card-drift', 'color.srgb', { r: 0.11, g: 0.46, b: 0.92 }), // slightly different
    ];
    const boundaries = [
      boundary('ButtonDrift', ['btn-drift']),
      boundary('CardDrift', ['card-drift']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [relation('ButtonDrift', 'CardDrift', 'SHARES_TOKEN')];
    const result = analyzeCrossComponentContinuity(groups, rels);

    const tokenDrift = result.crossComponentFindings.find(
      (f) => f.type === 'TOKEN_DRIFT',
    );
    expect(tokenDrift).toBeDefined();
    expect(tokenDrift!.state).toBe('FAIL');
    expect(tokenDrift!.explanation).toContain('漂移');
  });
});

// ---------------------------------------------------------------------------
// E2E: 降级行为
// ---------------------------------------------------------------------------

describe('Cross-Component E2E — Degradation', () => {
  it('无组件边界 → 空结果', () => {
    const groups = groupByExplicitBoundaries([], []);
    const result = analyzeCrossComponentContinuity(groups, []);
    expect(result.crossComponentFindings).toHaveLength(0);
    expect(result.continuityScore).toBe(1);
    expect(result.componentCount).toBe(0);
  });

  it('单组件 → 无跨组件 Finding', () => {
    const measurements = [m('e1', 'color.srgb', { r: 0.5, g: 0.5, b: 0.5 })];
    const groups = groupByExplicitBoundaries(measurements, [boundary('Comp', ['e1'])]);
    const result = analyzeCrossComponentContinuity(groups, []);
    expect(result.crossComponentFindings).toHaveLength(0);
    expect(result.continuityScore).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// E2E: 系统性模式
// ---------------------------------------------------------------------------

describe('Cross-Component E2E — Systemic Patterns', () => {
  it('多组件 Token 漂移 → COMPONENT_SYSTEMIC', () => {
    const measurements = [
      m('a1', 'color.srgb', { r: 1, g: 0, b: 0 }),
      m('b1', 'color.srgb', { r: 0, g: 1, b: 0 }),
      m('c1', 'color.srgb', { r: 0, g: 0, b: 1 }),
      m('d1', 'color.srgb', { r: 1, g: 1, b: 0 }),
    ];
    const boundaries = [
      boundary('A', ['a1']), boundary('B', ['b1']),
      boundary('C', ['c1']), boundary('D', ['d1']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [
      relation('A', 'B', 'SHARES_TOKEN'),
      relation('C', 'D', 'SHARES_TOKEN'),
    ];
    const result = analyzeCrossComponentContinuity(groups, rels);

    expect(result.systemicPatterns.length).toBeGreaterThan(0);
    const systemic = result.systemicPatterns.find((p) => p.type === 'COMPONENT_SYSTEMIC');
    expect(systemic).toBeDefined();
    expect(systemic!.scope).toBe('PROJECT');
  });

  it('多组件视觉断裂 → LAYOUT_SYSTEMIC', () => {
    const measurements = [
      m('a1', 'surface.radius', 4),
      m('b1', 'surface.radius', 16),
      m('c1', 'surface.radius', 2),
      m('d1', 'surface.radius', 20),
    ];
    const boundaries = [
      boundary('A', ['a1']), boundary('B', ['b1']),
      boundary('C', ['c1']), boundary('D', ['d1']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const rels = [
      relation('A', 'B', 'ADJACENT'),
      relation('C', 'D', 'ADJACENT'),
    ];
    const result = analyzeCrossComponentContinuity(groups, rels);

    const layoutSystemic = result.systemicPatterns.find((p) => p.type === 'LAYOUT_SYSTEMIC');
    expect(layoutSystemic).toBeDefined();
    expect(layoutSystemic!.scope).toBe('PAGE');
  });
});
