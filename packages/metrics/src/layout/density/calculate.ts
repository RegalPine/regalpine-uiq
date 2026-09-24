/**
 * P8：DENSITY 指标算法（LAYOUT-08 §12-14）。
 *
 * 配置明确 RAW_AREA/UNION_AREA 及容器。
 * RAW 原面积求和可大于 1；UNION 先裁剪再扫描线求并集，禁止最终 clamp。
 * 零可用面积 → UNKNOWN。
 */
import type { Rect } from '@uiq/geometry';
import { multiRectUnionArea, multiRectRawArea } from '@uiq/geometry';

export type DensityMode = 'RAW_AREA' | 'UNION_AREA';

export interface DensityInput {
  readonly mode: DensityMode;
  /** 子元素矩形（将被裁剪到容器内）。 */
  readonly children: readonly Rect[];
  /** 容器矩形。 */
  readonly container: Rect;
}

export interface DensityOutput {
  readonly mode: DensityMode;
  readonly occupiedArea: number;
  readonly availableArea: number;
  /** 零可用面积时为 undefined（UNKNOWN）。 */
  readonly density: number | undefined;
}

/** 将矩形裁剪到容器范围内（AD-16）。 */
function clipToContainer(rect: Rect, container: Rect): Rect {
  const x = Math.max(rect.x, container.x);
  const y = Math.max(rect.y, container.y);
  const right = Math.min(rect.x + rect.width, container.x + container.width);
  const bottom = Math.min(rect.y + rect.height, container.y + container.height);
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);
  return { x, y, width, height };
}

export function calculateDensity(input: DensityInput): DensityOutput {
  const availableArea = input.container.width * input.container.height;

  if (availableArea <= 0) {
    return {
      mode: input.mode,
      occupiedArea: 0,
      availableArea: 0,
      density: undefined,
    };
  }

  const clipped = input.children.map((c) => clipToContainer(c, input.container));

  const occupiedArea =
    input.mode === 'RAW_AREA' ? multiRectRawArea(clipped) : multiRectUnionArea(clipped);

  return {
    mode: input.mode,
    occupiedArea,
    availableArea,
    density: occupiedArea / availableArea,
  };
}
