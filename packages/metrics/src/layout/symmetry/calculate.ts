/**
 * P8：SYMMETRY 指标算法（LAYOUT-08 §15-16）。
 *
 * HORIZONTAL/VERTICAL、显式轴位置与配对。
 * 按 LAYOUT-08 的镜像中心偏差输出每对值及聚合。
 * 缺配对 → undefined（UNKNOWN）。不支持 RADIAL。
 */
import type { LayoutRect } from '@uiq/measurement';

export interface SymmetryPair {
  readonly firstId: string;
  readonly secondId: string;
}

export interface SymmetryInput {
  readonly axis: 'HORIZONTAL' | 'VERTICAL';
  readonly axisPosition: number;
  readonly pairs: readonly SymmetryPair[];
  readonly elements: ReadonlyMap<string, LayoutRect>;
}

export interface SymmetryPairResult {
  readonly firstId: string;
  readonly secondId: string;
  /** 镜像偏差：|（firstCenter - axis）+（secondCenter - axis）|。 */
  readonly deviation: number;
}

export interface SymmetryOutput {
  readonly axis: 'HORIZONTAL' | 'VERTICAL';
  readonly axisPosition: number;
  readonly pairs: readonly SymmetryPairResult[];
  readonly maxDeviation: number;
  readonly meanDeviation: number;
}

export function calculateSymmetry(input: SymmetryInput): SymmetryOutput | undefined {
  if (input.pairs.length === 0) return undefined;

  const results: SymmetryPairResult[] = [];

  for (const pair of input.pairs) {
    const firstRect = input.elements.get(pair.firstId);
    const secondRect = input.elements.get(pair.secondId);
    if (!firstRect || !secondRect) continue;

    let deviation: number;
    if (input.axis === 'VERTICAL') {
      // 垂直轴对称：比较 X 中心
      const firstCenter = firstRect.x + firstRect.width / 2;
      const secondCenter = secondRect.x + secondRect.width / 2;
      deviation = Math.abs(firstCenter - input.axisPosition + (secondCenter - input.axisPosition));
    } else {
      // 水平轴对称：比较 Y 中心
      const firstCenter = firstRect.y + firstRect.height / 2;
      const secondCenter = secondRect.y + secondRect.height / 2;
      deviation = Math.abs(firstCenter - input.axisPosition + (secondCenter - input.axisPosition));
    }

    results.push({
      firstId: pair.firstId,
      secondId: pair.secondId,
      deviation,
    });
  }

  if (results.length === 0) return undefined;

  const maxDeviation = Math.max(...results.map((r) => r.deviation));
  const meanDeviation = results.reduce((sum, r) => sum + r.deviation, 0) / results.length;

  return {
    axis: input.axis,
    axisPosition: input.axisPosition,
    pairs: results,
    maxDeviation,
    meanDeviation,
  };
}
