export type { Point, Size, Rect, EdgeDistanceResult, OverlapResult } from './types';
export { GeometryError, assertFinite, assertNonNegative } from './types';
export { createRect, isValidRect, rectRight, rectBottom, rectCenterX, rectCenterY } from './rect';
export { rectArea } from './area';
export { intersectRects, intersects } from './intersection';
export { unionRects, unionArea } from './union';
export { centerDistance, edgeDistance, overlap } from './distance';

// P8：多矩形并集与有向 gap（布局 DENSITY/SPACING/ORDER 依赖）
export { multiRectUnionArea, multiRectRawArea } from './multi-union';
export { signedHorizontalGap, signedVerticalGap, signedAxisGaps } from './signed-gap';
