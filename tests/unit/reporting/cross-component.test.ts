import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementSnapshot, ComponentBoundary, ComponentRelation } from '@uiq/core';
import { analyzeCrossComponentContinuity, inferComponentRelations, groupByExplicitBoundaries } from '@uiq/reporting';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeMeasurement(
  subjectId: string,
  type: string,
  value: unknown,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): Measurement {
  return {
    id: `m-${subjectId}-${type}`,
    subjectId,
    type,
    value,
    source: { type: 'STATIC' },
    status,
    timestamp: 1000,
  };
}

function makeBoundary(
  componentId: string,
  memberIds: string[],
  instanceId?: string,
): ComponentBoundary {
  return {
    componentId,
    ...(instanceId !== undefined ? { instanceId } : {}),
    rootElementId: memberIds[0] ?? '',
    memberElementIds: memberIds,
    role: 'root',
    source: 'EXPLICIT',
    confidence: 'DIRECT',
  };
}

function makeRelation(
  source: string,
  target: string,
  relation: ComponentRelation['relation'],
): ComponentRelation {
  return {
    sourceComponent: source,
    targetComponent: target,
    relation,
    sharedDimensions: ['SURFACE', 'COLOR', 'DEPTH'],
    source: 'EXPLICIT',
    confidence: 'DIRECT',
  };
}

// ---------------------------------------------------------------------------
// groupByExplicitBoundaries
// ---------------------------------------------------------------------------

describe('groupByExplicitBoundaries', () => {
  it('空边界返回空 Map', () => {
    const groups = groupByExplicitBoundaries([], []);
    expect(groups.size).toBe(0);
  });

  it('按组件边界正确分组度量', () => {
    const measurements = [
      makeMeasurement('e1', 'color.srgb', { r: 0.1, g: 0.4, b: 0.9 }),
      makeMeasurement('e2', 'color.srgb', { r: 0.9, g: 0.1, b: 0.1 }),
      makeMeasurement('e3', 'surface.radius', 8),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1', 'e3']),
      makeBoundary('CompB', ['e2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    expect(groups.size).toBe(2);
    expect(groups.get('CompA')!.measurements).toHaveLength(2);
    expect(groups.get('CompB')!.measurements).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// inferComponentRelations
// ---------------------------------------------------------------------------

describe('inferComponentRelations', () => {
  it('空边界返回空关系', () => {
    expect(inferComponentRelations([])).toHaveLength(0);
  });

  it('两个无重叠组件推断为 ADJACENT', () => {
    const boundaries = [
      makeBoundary('CompA', ['e1', 'e2']),
      makeBoundary('CompB', ['e3', 'e4']),
    ];
    const relations = inferComponentRelations(boundaries);
    expect(relations).toHaveLength(1);
    expect(relations[0]!.relation).toBe('ADJACENT');
    expect(relations[0]!.sourceComponent).toBe('CompA');
    expect(relations[0]!.targetComponent).toBe('CompB');
  });

  it('有成员重叠推断为 PARENT_CHILD', () => {
    const boundaries = [
      makeBoundary('Parent', ['e1', 'e2', 'e3']),
      makeBoundary('Child', ['e2', 'e3']),
    ];
    const relations = inferComponentRelations(boundaries);
    expect(relations).toHaveLength(1);
    expect(relations[0]!.relation).toBe('PARENT_CHILD');
    expect(relations[0]!.sourceComponent).toBe('Parent');
  });
});

// ---------------------------------------------------------------------------
// analyzeCrossComponentContinuity
// ---------------------------------------------------------------------------

describe('analyzeCrossComponentContinuity', () => {
  it('空分组返回空结果 + score=1', () => {
    const result = analyzeCrossComponentContinuity(new Map(), []);
    expect(result.crossComponentFindings).toHaveLength(0);
    expect(result.continuityScore).toBe(1);
    expect(result.componentCount).toBe(0);
  });

  it('相同颜色 → TOKEN_DRIFT PASS', () => {
    const measurements = [
      makeMeasurement('e1', 'color.srgb', { r: 0.1, g: 0.4, b: 0.9 }),
      makeMeasurement('e2', 'color.srgb', { r: 0.1, g: 0.4, b: 0.9 }),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1']),
      makeBoundary('CompB', ['e2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [makeRelation('CompA', 'CompB', 'SHARES_TOKEN')];
    const result = analyzeCrossComponentContinuity(groups, relations);

    const tokenDrift = result.crossComponentFindings.find((f) => f.type === 'TOKEN_DRIFT');
    expect(tokenDrift).toBeDefined();
    expect(tokenDrift!.state).toBe('PASS');
  });

  it('不同颜色 → TOKEN_DRIFT FAIL', () => {
    const measurements = [
      makeMeasurement('e1', 'color.srgb', { r: 0.1, g: 0.4, b: 0.9 }),
      makeMeasurement('e2', 'color.srgb', { r: 0.9, g: 0.1, b: 0.1 }),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1']),
      makeBoundary('CompB', ['e2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [makeRelation('CompA', 'CompB', 'SHARES_TOKEN')];
    const result = analyzeCrossComponentContinuity(groups, relations);

    const tokenDrift = result.crossComponentFindings.find((f) => f.type === 'TOKEN_DRIFT');
    expect(tokenDrift).toBeDefined();
    expect(tokenDrift!.state).toBe('FAIL');
  });

  it('圆角一致 → SURFACE PASS', () => {
    const measurements = [
      makeMeasurement('e1', 'surface.radius', 8),
      makeMeasurement('e2', 'surface.radius', 8),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1']),
      makeBoundary('CompB', ['e2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [makeRelation('CompA', 'CompB', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, relations);

    const surface = result.crossComponentFindings.find(
      (f) => f.type === 'VISUAL_BREAK' && f.dimension === 'SURFACE',
    );
    expect(surface).toBeDefined();
    expect(surface!.state).toBe('PASS');
  });

  it('圆角跳变 → SURFACE FAIL', () => {
    const measurements = [
      makeMeasurement('e1', 'surface.radius', 4),
      makeMeasurement('e2', 'surface.radius', 16),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1']),
      makeBoundary('CompB', ['e2']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [makeRelation('CompA', 'CompB', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, relations);

    const surface = result.crossComponentFindings.find(
      (f) => f.type === 'VISUAL_BREAK' && f.dimension === 'SURFACE',
    );
    expect(surface).toBeDefined();
    expect(surface!.state).toBe('FAIL');
    expect(surface!.explanation).toContain('跳变');
  });

  it('continuityScore 正确计算', () => {
    const measurements = [
      makeMeasurement('e1', 'surface.radius', 8),
      makeMeasurement('e2', 'surface.radius', 8),
      makeMeasurement('e3', 'color.srgb', { r: 0.1, g: 0.4, b: 0.9 }),
      makeMeasurement('e4', 'color.srgb', { r: 0.9, g: 0.1, b: 0.1 }),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1', 'e3']),
      makeBoundary('CompB', ['e2', 'e4']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [makeRelation('CompA', 'CompB', 'ADJACENT')];
    const result = analyzeCrossComponentContinuity(groups, relations);

    expect(result.continuityScore).toBeGreaterThan(0);
    expect(result.continuityScore).toBeLessThanOrEqual(1);
    expect(result.componentCount).toBe(2);
  });

  it('多组件 Token 漂移触发 COMPONENT_SYSTEMIC', () => {
    const measurements = [
      makeMeasurement('e1', 'color.srgb', { r: 1, g: 0, b: 0 }),
      makeMeasurement('e2', 'color.srgb', { r: 0, g: 1, b: 0 }),
      makeMeasurement('e3', 'color.srgb', { r: 0, g: 0, b: 1 }),
      makeMeasurement('e4', 'color.srgb', { r: 1, g: 1, b: 0 }),
    ];
    const boundaries = [
      makeBoundary('CompA', ['e1']),
      makeBoundary('CompB', ['e2']),
      makeBoundary('CompC', ['e3']),
      makeBoundary('CompD', ['e4']),
    ];
    const groups = groupByExplicitBoundaries(measurements, boundaries);
    const relations = [
      makeRelation('CompA', 'CompB', 'SHARES_TOKEN'),
      makeRelation('CompC', 'CompD', 'SHARES_TOKEN'),
    ];
    const result = analyzeCrossComponentContinuity(groups, relations);

    const tokenDriftFails = result.crossComponentFindings.filter(
      (f) => f.type === 'TOKEN_DRIFT' && f.state === 'FAIL',
    );
    expect(tokenDriftFails.length).toBeGreaterThanOrEqual(2);

    const systemic = result.systemicPatterns.find((p) => p.type === 'COMPONENT_SYSTEMIC');
    expect(systemic).toBeDefined();
  });
});
