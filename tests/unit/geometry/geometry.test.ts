import { describe, expect, it } from 'vitest';
import {
  createRect,
  isValidRect,
  rectRight,
  rectBottom,
  rectCenterX,
  rectCenterY,
  rectArea,
  intersectRects,
  intersects,
  unionRects,
  unionArea,
  centerDistance,
  edgeDistance,
  overlap,
  GeometryError,
} from '@uiq/geometry';
import type { Rect } from '@uiq/geometry';

describe('createRect', () => {
  it('创建正常矩形', () => {
    const r = createRect(10, 20, 100, 50);
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it('允许负坐标', () => {
    const r = createRect(-10, -20, 100, 50);
    expect(r.x).toBe(-10);
    expect(r.y).toBe(-20);
  });

  it('允许零宽高', () => {
    const r = createRect(0, 0, 0, 0);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });

  it('拒绝负宽高', () => {
    expect(() => createRect(0, 0, -1, 10)).toThrow(GeometryError);
    expect(() => createRect(0, 0, 10, -1)).toThrow(GeometryError);
  });

  it('拒绝 NaN / Infinity', () => {
    expect(() => createRect(NaN, 0, 10, 10)).toThrow(GeometryError);
    expect(() => createRect(0, Infinity, 10, 10)).toThrow(GeometryError);
  });
});

describe('isValidRect', () => {
  it('合法矩形', () => {
    expect(isValidRect({ x: 0, y: 0, width: 10, height: 10 })).toBe(true);
    expect(isValidRect({ x: -5, y: 3, width: 0, height: 100 })).toBe(true);
  });

  it('非法值', () => {
    expect(isValidRect(null)).toBe(false);
    expect(isValidRect({ x: 0, y: 0, width: -1, height: 10 })).toBe(false);
    expect(isValidRect({ x: NaN, y: 0, width: 10, height: 10 })).toBe(false);
    expect(isValidRect('rect')).toBe(false);
  });
});

describe('rect helpers', () => {
  it('rectRight / rectBottom', () => {
    expect(rectRight({ x: 10, y: 20, width: 100, height: 50 })).toBe(110);
    expect(rectBottom({ x: 10, y: 20, width: 100, height: 50 })).toBe(70);
  });

  it('rectCenterX / rectCenterY', () => {
    expect(rectCenterX({ x: 10, y: 20, width: 100, height: 50 })).toBe(60);
    expect(rectCenterY({ x: 10, y: 20, width: 100, height: 50 })).toBe(45);
  });
});

describe('rectArea', () => {
  it('正常面积', () => {
    expect(rectArea({ x: 0, y: 0, width: 10, height: 20 })).toBe(200);
  });

  it('零面积', () => {
    expect(rectArea({ x: 0, y: 0, width: 0, height: 10 })).toBe(0);
    expect(rectArea({ x: 0, y: 0, width: 10, height: 0 })).toBe(0);
  });
});

describe('intersectRects', () => {
  it('有交集', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 5, y: 5, width: 10, height: 10 };
    const c = intersectRects(a, b);
    expect(c).toEqual({ x: 5, y: 5, width: 5, height: 5 });
  });

  it('无交集返回零面积', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 20, y: 20, width: 10, height: 10 };
    const c = intersectRects(a, b);
    expect(rectArea(c)).toBe(0);
  });

  it('完全包含', () => {
    const outer: Rect = { x: 0, y: 0, width: 100, height: 100 };
    const inner: Rect = { x: 10, y: 10, width: 20, height: 20 };
    expect(intersectRects(outer, inner)).toEqual(inner);
  });

  it('拒绝负宽高', () => {
    expect(() =>
      intersectRects({ x: 0, y: 0, width: -1, height: 10 }, { x: 0, y: 0, width: 10, height: 10 }),
    ).toThrow(GeometryError);
  });
});

describe('intersects', () => {
  it('相交', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true);
  });

  it('不相交', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 }),
    ).toBe(false);
  });

  it('边接触不算相交', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }),
    ).toBe(false);
  });
});

describe('unionRects / unionArea', () => {
  it('并集矩形', () => {
    const u = unionRects(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    );
    expect(u).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it('并集面积（无重叠）', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 20, y: 20, width: 10, height: 10 };
    expect(unionArea(a, b)).toBe(200);
  });

  it('并集面积（有重叠）', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 5, y: 5, width: 10, height: 10 };
    // 100 + 100 - 25 = 175
    expect(unionArea(a, b)).toBe(175);
  });
});

describe('centerDistance', () => {
  it('同一矩形距离为 0', () => {
    expect(
      centerDistance({ x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 0, width: 10, height: 10 }),
    ).toBe(0);
  });

  it('水平偏移', () => {
    const d = centerDistance(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 30, y: 0, width: 10, height: 10 },
    );
    expect(d).toBe(30);
  });

  it('欧氏距离', () => {
    const d = centerDistance(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 30, y: 40, width: 10, height: 10 },
    );
    // centers: (5,5) and (35,45) → dx=30, dy=40 → 50
    expect(d).toBe(50);
  });
});

describe('edgeDistance', () => {
  it('分离矩形', () => {
    const result = edgeDistance(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 30, width: 10, height: 10 },
    );
    expect(result.horizontal).toBe(10);
    expect(result.vertical).toBe(20);
    expect(result.minimum).toBe(10);
  });

  it('重叠矩形边缘距离为 0', () => {
    const result = edgeDistance(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 },
    );
    expect(result.horizontal).toBe(0);
    expect(result.vertical).toBe(0);
    expect(result.minimum).toBe(0);
  });
});

describe('overlap', () => {
  it('有重叠', () => {
    const result = overlap(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 },
    );
    expect(result.area).toBe(25);
    expect(result.ratioA).toBe(0.25);
    expect(result.ratioB).toBe(0.25);
  });

  it('无重叠', () => {
    const result = overlap(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    );
    expect(result.area).toBe(0);
    expect(result.ratioA).toBe(0);
    expect(result.ratioB).toBe(0);
  });

  it('完全包含', () => {
    const result = overlap(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 10, y: 10, width: 20, height: 20 },
    );
    expect(result.area).toBe(400);
    expect(result.ratioA).toBe(0.04);
    expect(result.ratioB).toBe(1);
  });

  it('零面积矩形', () => {
    const result = overlap(
      { x: 0, y: 0, width: 0, height: 0 },
      { x: 0, y: 0, width: 10, height: 10 },
    );
    expect(result.area).toBe(0);
    expect(result.ratioA).toBe(0);
  });
});
