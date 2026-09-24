import { describe, expect, it } from 'vitest';
import { createDefaultMetricRegistry } from '@uiq/metrics';

describe('createDefaultMetricRegistry', () => {
  it('注册全部 20 个 Metric', () => {
    const registry = createDefaultMetricRegistry();
    const list = registry.list();
    expect(list.length).toBe(20);
  });

  it('所有 Metric 可通过 id+version 查询', () => {
    const registry = createDefaultMetricRegistry();
    const expected = [
      'COLOR.SRGB',
      'COLOR.OKLAB',
      'COLOR.OKLCH',
      'COLOR.LIGHTNESS',
      'COLOR.CHROMA',
      'COLOR.HUE',
      'COLOR.CONTRAST',
      'TYPOGRAPHY.FONT_SIZE',
      'TYPOGRAPHY.FONT_WEIGHT',
      'TYPOGRAPHY.LINE_HEIGHT',
      'TYPOGRAPHY.LETTER_SPACING',
      'TYPOGRAPHY.TEXT_MEASURE',
      'TYPOGRAPHY.SCALE_RATIO',
      'GEOMETRY.WIDTH',
      'GEOMETRY.HEIGHT',
      'GEOMETRY.AREA',
      'GEOMETRY.ASPECT_RATIO',
      'GEOMETRY.CENTER_DISTANCE',
      'GEOMETRY.EDGE_DISTANCE',
      'GEOMETRY.OVERLAP',
    ];
    for (const id of expected) {
      expect(registry.has(id, '1.0.0'), `${id}@1.0.0 应已注册`).toBe(true);
      const def = registry.get(id, '1.0.0');
      expect(def).toBeDefined();
      expect(def!.id).toBe(id);
    }
  });

  it('依赖 DAG 可解析', () => {
    const registry = createDefaultMetricRegistry();
    for (const metric of registry.list()) {
      for (const dep of metric.dependencies) {
        expect(
          registry.has(dep.metricId, dep.version),
          `${metric.id} 依赖 ${dep.metricId}@${dep.version} 应可解析`,
        ).toBe(true);
      }
    }
  });

  it('幂等：多次创建结果一致', () => {
    const r1 = createDefaultMetricRegistry();
    const r2 = createDefaultMetricRegistry();
    expect(r1.list().length).toBe(r2.list().length);
    const ids1 = r1
      .list()
      .map((m) => `${m.id}@${m.version}`)
      .sort();
    const ids2 = r2
      .list()
      .map((m) => `${m.id}@${m.version}`)
      .sort();
    expect(ids1).toEqual(ids2);
  });
});
