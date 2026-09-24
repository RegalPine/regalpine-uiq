export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface Size {
  readonly width: number;
  readonly height: number;
}
export interface Rect extends Point, Size {}

export interface EdgeDistanceResult {
  readonly horizontal: number;
  readonly vertical: number;
  readonly minimum: number;
}

export interface OverlapResult {
  readonly area: number;
  readonly ratioA: number;
  readonly ratioB: number;
}

export class GeometryError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GeometryError';
  }
}

export function assertFinite(...values: readonly number[]): void {
  if (!values.every((v) => typeof v === 'number' && Number.isFinite(v))) {
    throw new GeometryError('INVALID_GEOMETRY', '几何分量必须是有限数值');
  }
}

export function assertNonNegative(...values: readonly number[]): void {
  assertFinite(...values);
  if (values.some((v) => v < 0)) {
    throw new GeometryError('INVALID_GEOMETRY', '几何尺寸不得为负值');
  }
}
