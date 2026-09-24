/**
 * P8：GRID_ALIGNMENT 指标算法（LAYOUT-08 §8-9）。
 *
 * X/Y 坐标、显式 origin 与正 gridSize。
 * nearestGridLine = origin + Math.round((coord - origin) / gridSize) * gridSize。
 * 半格按 Math.round 取较大索引。
 */

export interface GridInput {
  readonly coordinate: number;
  readonly gridSize: number;
  readonly origin: number;
}

export interface GridOutput {
  readonly coordinate: number;
  readonly nearestGridLine: number;
  /** 有向偏差 = coordinate - nearestGridLine。 */
  readonly deviation: number;
}

export function calculateGridAlignment(input: GridInput): GridOutput {
  if (!Number.isFinite(input.gridSize) || input.gridSize <= 0) {
    throw new Error('gridSize must be greater than zero');
  }

  const nearestGridLine =
    input.origin + Math.round((input.coordinate - input.origin) / input.gridSize) * input.gridSize;

  return {
    coordinate: input.coordinate,
    nearestGridLine,
    deviation: input.coordinate - nearestGridLine,
  };
}

export interface GridGroupMember {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

export interface GridGroupInput {
  readonly members: readonly GridGroupMember[];
  readonly gridSizeX: number;
  readonly gridSizeY: number;
  readonly originX: number;
  readonly originY: number;
}

export interface GridGroupOutput {
  readonly perMember: ReadonlyArray<{
    readonly id: string;
    readonly deviationX: number;
    readonly deviationY: number;
  }>;
  readonly maxAbsoluteDeviationX: number;
  readonly maxAbsoluteDeviationY: number;
}

export function calculateGridGroup(input: GridGroupInput): GridGroupOutput {
  const perMember = input.members.map((m) => {
    const gx = calculateGridAlignment({
      coordinate: m.x,
      gridSize: input.gridSizeX,
      origin: input.originX,
    });
    const gy = calculateGridAlignment({
      coordinate: m.y,
      gridSize: input.gridSizeY,
      origin: input.originY,
    });
    return {
      id: m.id,
      deviationX: gx.deviation,
      deviationY: gy.deviation,
    };
  });

  return {
    perMember,
    maxAbsoluteDeviationX: Math.max(...perMember.map((v) => Math.abs(v.deviationX)), 0),
    maxAbsoluteDeviationY: Math.max(...perMember.map((v) => Math.abs(v.deviationY)), 0),
  };
}
