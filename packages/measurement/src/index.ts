export { MeasurementError } from './types';
export type { UnitSystem, UnitValue, ConversionContext } from './types';
export { toPx, unitLabel, isLengthUnit } from './units';
export { validateMeasurement, validateSnapshot } from './validation';
export { SnapshotBuilder, resetIdCounter } from './builder';

// P8：布局基础类型
export type {
  LayoutRect,
  BoxSpacing,
  LayoutVisibility,
  LayoutElementMeasurement,
  LayoutRelation,
  LayoutGroup,
  AlignmentAxis,
  CollectionRecord,
} from './layout';
export {
  LAYOUT_SCHEMA_VERSION,
  LayoutInputError,
  alignmentCoordinate,
  assertLayoutRect,
  assertBoxSpacing,
  assertLayoutElement,
  assertLayoutGroup,
} from './layout';
