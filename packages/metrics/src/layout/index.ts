/**
 * P8：布局指标算法统一导出。
 *
 * 每个算法为纯函数，不依赖 MetricDefinition 接口。
 * MetricDefinition 包装在 registry.ts 中通过 registerLayoutMetrics 注册。
 */

// ALIGNMENT
export { calculateAlignment, median } from './alignment/calculate';
export type { AlignmentInput, AlignmentOutput, AlignmentMember } from './alignment/calculate';

// GRID_ALIGNMENT
export { calculateGridAlignment, calculateGridGroup } from './grid/calculate';
export type {
  GridInput,
  GridOutput,
  GridGroupInput,
  GridGroupOutput,
  GridGroupMember,
} from './grid/calculate';

// DENSITY
export { calculateDensity } from './density/calculate';
export type { DensityInput, DensityOutput, DensityMode } from './density/calculate';

// SYMMETRY
export { calculateSymmetry } from './symmetry/calculate';
export type {
  SymmetryInput,
  SymmetryOutput,
  SymmetryPair,
  SymmetryPairResult,
} from './symmetry/calculate';

// OVERFLOW
export { calculateOverflow } from './overflow/calculate';
export type { OverflowInput, OverflowOutput } from './overflow/calculate';

// RESPONSIVE
export {
  calculateResponsiveSizeDelta,
  calculateResponsivePositionDelta,
} from './responsive/calculate';
export type {
  ResponsiveSizeDeltaInput,
  ResponsiveSizeDeltaOutput,
  ResponsivePositionDeltaInput,
  ResponsivePositionDeltaOutput,
} from './responsive/calculate';

// COMPONENT_SIZE_VARIANCE
export { calculateComponentSizeVariance } from './consistency/calculate';
export type {
  ComponentSizeVarianceInput,
  ComponentSizeVarianceOutput,
} from './consistency/calculate';

// SPACING_VARIANCE
export { calculateSpacingVariance } from './spacing/calculate';
export type { SpacingVarianceOutput } from './spacing/calculate';
