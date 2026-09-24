/**
 * P8：ALIGNMENT 指标算法（LAYOUT-08 §6-7）。
 *
 * 六种轴；显式参考坐标或 GROUP median；输出有向偏差 Record<subjectId, signedDeviation>。
 * max/meanAbsolute 使用绝对值聚合。
 */
import type { LayoutRect, AlignmentAxis } from '@uiq/measurement';
import { alignmentCoordinate } from '@uiq/measurement';

export interface AlignmentMember {
  readonly id: string;
  readonly rect: LayoutRect;
}

export interface AlignmentInput {
  readonly members: readonly AlignmentMember[];
  readonly axis: AlignmentAxis;
  readonly reference?: number;
}

export interface AlignmentOutput {
  readonly axis: AlignmentAxis;
  readonly reference: number;
  /** 有向偏差：正负保留方向（AD-15），用于 ORDER 规则。 */
  readonly deviations: Readonly<Record<string, number>>;
  readonly maxAbsoluteDeviation: number;
  readonly meanAbsoluteDeviation: number;
}

/** 中位数（LAYOUT-08 §7）。偶数取中间两值均值。 */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate median of empty array');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1]! + sorted[middle]!) / 2;
  }
  return sorted[middle]!;
}

export function calculateAlignment(input: AlignmentInput): AlignmentOutput | undefined {
  if (input.members.length === 0) return undefined;

  const coordinates = input.members.map((m) => ({
    id: m.id,
    coord: alignmentCoordinate(m.rect, input.axis),
  }));

  const reference = input.reference ?? median(coordinates.map((c) => c.coord));

  const deviations: Record<string, number> = {};
  let sumAbs = 0;
  let maxAbs = 0;

  for (const { id, coord } of coordinates) {
    // 有向偏差 = 坐标 - 参考（AD-15：保留方向）
    const signed = coord - reference;
    deviations[id] = signed;
    const abs = Math.abs(signed);
    sumAbs += abs;
    if (abs > maxAbs) maxAbs = abs;
  }

  return {
    axis: input.axis,
    reference,
    deviations,
    maxAbsoluteDeviation: maxAbs,
    meanAbsoluteDeviation: sumAbs / coordinates.length,
  };
}
