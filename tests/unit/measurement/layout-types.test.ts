import { describe, expect, it } from 'vitest';
import {
  LayoutInputError,
  alignmentCoordinate,
  assertBoxSpacing,
  assertLayoutElement,
  assertLayoutGroup,
  assertLayoutRect,
} from '@uiq/measurement';
import type {
  AlignmentAxis,
  BoxSpacing,
  LayoutElementMeasurement,
  LayoutGroup,
  LayoutRect,
} from '@uiq/measurement';

describe('P8: LayoutRect validation (AD-15)', () => {
  it('accepts rect with negative coordinates (valid)', () => {
    const rect: LayoutRect = { x: -10, y: -20, width: 30, height: 20 };
    expect(() => assertLayoutRect(rect)).not.toThrow();
  });

  it('accepts rect at origin', () => {
    const rect: LayoutRect = { x: 0, y: 0, width: 100, height: 50 };
    expect(() => assertLayoutRect(rect)).not.toThrow();
  });

  it('accepts zero-size rect (not automatically invalid)', () => {
    const rect: LayoutRect = { x: 10, y: 10, width: 0, height: 0 };
    expect(() => assertLayoutRect(rect)).not.toThrow();
  });

  it('rejects negative width', () => {
    const rect = { x: 0, y: 0, width: -1, height: 10 };
    expect(() => assertLayoutRect(rect)).toThrow(LayoutInputError);
    expect(() => assertLayoutRect(rect)).toThrow('尺寸不得为负值');
  });

  it('rejects negative height', () => {
    const rect = { x: 0, y: 0, width: 10, height: -1 };
    expect(() => assertLayoutRect(rect)).toThrow(LayoutInputError);
  });

  it('rejects NaN coordinate', () => {
    const rect = { x: NaN, y: 0, width: 10, height: 10 };
    expect(() => assertLayoutRect(rect)).toThrow('必须是有限数值');
  });

  it('rejects Infinity coordinate', () => {
    const rect = { x: Infinity, y: 0, width: 10, height: 10 };
    expect(() => assertLayoutRect(rect)).toThrow('必须是有限数值');
  });

  it('rejects non-object', () => {
    expect(() => assertLayoutRect(null as unknown as LayoutRect)).toThrow('必须是对象');
  });
});

describe('P8: BoxSpacing validation', () => {
  it('accepts valid spacing', () => {
    const spacing: BoxSpacing = { top: 8, right: 16, bottom: 8, left: 16 };
    expect(() => assertBoxSpacing(spacing)).not.toThrow();
  });

  it('accepts negative spacing (legal for margin collapse)', () => {
    const spacing: BoxSpacing = { top: -4, right: 0, bottom: 0, left: 0 };
    expect(() => assertBoxSpacing(spacing)).not.toThrow();
  });

  it('rejects NaN in spacing', () => {
    const spacing = { top: NaN, right: 0, bottom: 0, left: 0 };
    expect(() => assertBoxSpacing(spacing)).toThrow(LayoutInputError);
  });
});

describe('P8: LayoutElementMeasurement validation', () => {
  const validElement: LayoutElementMeasurement = {
    id: 'el-1',
    rect: { x: 0, y: 0, width: 100, height: 50 },
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 8, right: 8, bottom: 8, left: 8 },
    visibility: 'VISIBLE',
  };

  it('accepts valid element', () => {
    expect(() => assertLayoutElement(validElement)).not.toThrow();
  });

  it('rejects empty id', () => {
    expect(() => assertLayoutElement({ ...validElement, id: '' })).toThrow('需要非空 id');
  });

  it('rejects invalid rect', () => {
    expect(() =>
      assertLayoutElement({ ...validElement, rect: { x: 0, y: 0, width: -1, height: 10 } }),
    ).toThrow(LayoutInputError);
  });
});

describe('P8: LayoutGroup validation', () => {
  const validGroup: LayoutGroup = {
    id: 'group-1',
    subjectIds: ['a', 'b', 'c'],
    relation: 'HORIZONTAL',
  };

  it('accepts valid group', () => {
    expect(() => assertLayoutGroup(validGroup)).not.toThrow();
  });

  it('rejects empty id', () => {
    expect(() => assertLayoutGroup({ ...validGroup, id: '' })).toThrow('需要非空 id');
  });

  it('rejects empty subjectIds', () => {
    expect(() => assertLayoutGroup({ ...validGroup, subjectIds: [] })).toThrow(
      '需要非空 subjectIds',
    );
  });

  it('rejects invalid relation', () => {
    expect(() =>
      assertLayoutGroup({ ...validGroup, relation: 'DIAGONAL' as unknown as 'HORIZONTAL' }),
    ).toThrow('无效关系');
  });

  it('rejects duplicate subjectIds', () => {
    expect(() => assertLayoutGroup({ ...validGroup, subjectIds: ['a', 'b', 'a'] })).toThrow(
      '重复 subjectId',
    );
  });

  it('rejects non-string subjectIds', () => {
    expect(() => assertLayoutGroup({ ...validGroup, subjectIds: ['a', '', 'c'] })).toThrow(
      '须为非空字符串',
    );
  });
});

describe('P8: alignmentCoordinate', () => {
  const rect: LayoutRect = { x: 10, y: 20, width: 30, height: 40 };

  const cases: readonly [AlignmentAxis, number][] = [
    ['LEFT', 10],
    ['RIGHT', 40],
    ['TOP', 20],
    ['BOTTOM', 60],
    ['CENTER_X', 25],
    ['CENTER_Y', 40],
  ];

  for (const [axis, expected] of cases) {
    it(`${axis} → ${expected}`, () => {
      expect(alignmentCoordinate(rect, axis)).toBe(expected);
    });
  }

  it('works with negative coordinates', () => {
    const negRect: LayoutRect = { x: -10, y: -20, width: 30, height: 40 };
    expect(alignmentCoordinate(negRect, 'LEFT')).toBe(-10);
    expect(alignmentCoordinate(negRect, 'CENTER_X')).toBe(5);
  });
});
