/**
 * P8：十一项布局规则算法（LAYOUT-03）。
 *
 * 每条规则为纯函数：消费对应指标输出 + 配置 → 评估状态。
 * 不直接依赖 MetricDefinition 或 EvaluationEngine；由 registry 包装为 customEvaluate 钩子。
 *
 * 执行顺序：配置校验 → 适用性 → 必需事实状态 → 条件比较。
 * 复合条件保留逐项结果，汇总优先 ERROR > UNKNOWN > FAIL > WARN > PASS，全不适用为 N/A。
 */

export type LayoutEvalState = 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN' | 'ERROR';

// ─── 1. ALIGNMENT.CONFORMANCE ───────────────────────────────────────────────

export interface AlignmentConformanceConfig {
  readonly maxAllowedDeviation: number;
}

export interface AlignmentConformanceInput {
  readonly maxAbsoluteDeviation: number;
  readonly config: AlignmentConformanceConfig;
}

export function evaluateAlignmentConformance(input: AlignmentConformanceInput): LayoutEvalState {
  if (input.config.maxAllowedDeviation < 0) return 'ERROR';
  return input.maxAbsoluteDeviation <= input.config.maxAllowedDeviation ? 'PASS' : 'FAIL';
}

// ─── 2. GRID.CONFORMANCE ────────────────────────────────────────────────────

export interface GridConformanceConfig {
  readonly tolerance: number;
}

export interface GridConformanceInput {
  readonly maxAbsoluteDeviationX: number;
  readonly maxAbsoluteDeviationY: number;
  readonly config: GridConformanceConfig;
}

export function evaluateGridConformance(input: GridConformanceInput): LayoutEvalState {
  if (input.config.tolerance < 0) return 'ERROR';
  const maxDev = Math.max(input.maxAbsoluteDeviationX, input.maxAbsoluteDeviationY);
  return maxDev <= input.config.tolerance ? 'PASS' : 'FAIL';
}

// ─── 3. SPACING.CONFORMANCE ─────────────────────────────────────────────────

export interface SpacingConformanceConfig {
  readonly expected: number;
  readonly tolerance: number;
}

export interface SpacingConformanceInput {
  readonly values: readonly number[];
  readonly config: SpacingConformanceConfig;
}

export function evaluateSpacingConformance(input: SpacingConformanceInput): LayoutEvalState {
  if (input.values.length === 0) return 'UNKNOWN';
  if (input.config.tolerance < 0) return 'ERROR';
  const { expected, tolerance } = input.config;
  const allInRange = input.values.every((v) => Math.abs(v - expected) <= tolerance);
  return allInRange ? 'PASS' : 'FAIL';
}

// ─── 4. CONTAINER.CONSTRAINT ────────────────────────────────────────────────

export interface ContainerConstraintConfig {
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
}

export interface ContainerConstraintInput {
  readonly actualWidth: number;
  readonly actualHeight: number;
  readonly config: ContainerConstraintConfig;
}

export function evaluateContainerConstraint(input: ContainerConstraintInput): LayoutEvalState {
  const { actualWidth, actualHeight, config } = input;
  if (config.minWidth !== undefined && actualWidth < config.minWidth) return 'FAIL';
  if (config.maxWidth !== undefined && actualWidth > config.maxWidth) return 'FAIL';
  if (config.minHeight !== undefined && actualHeight < config.minHeight) return 'FAIL';
  if (config.maxHeight !== undefined && actualHeight > config.maxHeight) return 'FAIL';
  return 'PASS';
}

// ─── 5. OVERFLOW.CONSTRAINT ─────────────────────────────────────────────────

export type OverflowMode = 'FORBID' | 'ALLOW' | 'ALLOW_AXIS';

export interface OverflowConstraintConfig {
  readonly mode: OverflowMode;
  readonly axis?: 'X' | 'Y';
}

export interface OverflowConstraintInput {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly config: OverflowConstraintConfig;
}

export function evaluateOverflowConstraint(input: OverflowConstraintInput): LayoutEvalState {
  const { left, right, top, bottom, config } = input;
  if (config.mode === 'ALLOW') return 'PASS';
  if (config.mode === 'ALLOW_AXIS') {
    if (config.axis === 'Y') {
      // Y 轴允许溢出（top/bottom），但 X 轴（left/right）仍需约束
      return left <= 0 && right <= 0 ? 'PASS' : 'FAIL';
    }
    if (config.axis === 'X') {
      return top <= 0 && bottom <= 0 ? 'PASS' : 'FAIL';
    }
    return 'ERROR';
  }
  // FORBID
  return left <= 0 && right <= 0 && top <= 0 && bottom <= 0 ? 'PASS' : 'FAIL';
}

// ─── 6. DENSITY.RANGE ───────────────────────────────────────────────────────

export interface DensityRangeConfig {
  readonly min?: number;
  readonly max?: number;
}

export interface DensityRangeInput {
  readonly density: number | undefined;
  readonly config: DensityRangeConfig;
}

export function evaluateDensityRange(input: DensityRangeInput): LayoutEvalState {
  if (input.density === undefined) return 'UNKNOWN';
  const { density, config } = input;
  if (config.min !== undefined && density < config.min) return 'FAIL';
  if (config.max !== undefined && density > config.max) return 'FAIL';
  return 'PASS';
}

// ─── 7. SYMMETRY.CONFORMANCE ────────────────────────────────────────────────

export interface SymmetryConformanceConfig {
  readonly maxAllowedDeviation: number;
}

export interface SymmetryConformanceInput {
  readonly maxDeviation: number | undefined;
  readonly config: SymmetryConformanceConfig;
}

export function evaluateSymmetryConformance(input: SymmetryConformanceInput): LayoutEvalState {
  if (input.maxDeviation === undefined) return 'NOT_APPLICABLE';
  if (input.config.maxAllowedDeviation < 0) return 'ERROR';
  return input.maxDeviation <= input.config.maxAllowedDeviation ? 'PASS' : 'FAIL';
}

// ─── 8. COMPONENT.SIZE_CONSISTENCY ──────────────────────────────────────────

export interface ComponentSizeConsistencyConfig {
  readonly maxVariance?: number;
  readonly widthRange?: { readonly min: number; readonly max: number };
  readonly heightRange?: { readonly min: number; readonly max: number };
}

export interface ComponentSizeConsistencyInput {
  readonly widthVariance: number;
  readonly heightVariance: number;
  readonly perInstance: ReadonlyArray<{
    readonly width: number;
    readonly height: number;
  }>;
  readonly config: ComponentSizeConsistencyConfig;
}

export function evaluateComponentSizeConsistency(
  input: ComponentSizeConsistencyInput,
): LayoutEvalState {
  const { config } = input;
  if (config.maxVariance !== undefined) {
    if (input.widthVariance > config.maxVariance) return 'FAIL';
    if (input.heightVariance > config.maxVariance) return 'FAIL';
  }
  if (config.widthRange) {
    for (const inst of input.perInstance) {
      if (inst.width < config.widthRange.min || inst.width > config.widthRange.max) {
        return 'FAIL';
      }
    }
  }
  if (config.heightRange) {
    for (const inst of input.perInstance) {
      if (inst.height < config.heightRange.min || inst.height > config.heightRange.max) {
        return 'FAIL';
      }
    }
  }
  return 'PASS';
}

// ─── 9. RESPONSIVE.CONSTRAINT ───────────────────────────────────────────────

export interface ResponsiveConstraintConfig {
  readonly maxPositionDelta?: number;
  readonly maxOverflowPerViewport?: number;
}

export interface ResponsiveConstraintInput {
  readonly positionDistance: number;
  readonly maxOverflow: number;
  readonly config: ResponsiveConstraintConfig;
}

export function evaluateResponsiveConstraint(input: ResponsiveConstraintInput): LayoutEvalState {
  const { config } = input;
  if (config.maxPositionDelta !== undefined && input.positionDistance > config.maxPositionDelta) {
    return 'FAIL';
  }
  if (
    config.maxOverflowPerViewport !== undefined &&
    input.maxOverflow > config.maxOverflowPerViewport
  ) {
    return 'FAIL';
  }
  return 'PASS';
}

// ─── 10. RESPONSIVE.NO_OVERFLOW ─────────────────────────────────────────────

export interface ResponsiveNoOverflowInput {
  readonly maxOverflow: number;
}

export function evaluateResponsiveNoOverflow(input: ResponsiveNoOverflowInput): LayoutEvalState {
  return input.maxOverflow <= 0 ? 'PASS' : 'FAIL';
}

// ─── 11. ORDER.CONFORMANCE ──────────────────────────────────────────────────

export interface OrderConformanceConfig {
  readonly expectedSubjectIds: readonly string[];
  readonly direction: 'ASC' | 'DESC';
  readonly allowTies?: boolean;
}

export interface OrderConformanceInput {
  /** 有向偏差 Record<subjectId, signedDeviation>，来自 ALIGNMENT 指标。 */
  readonly deviations: Readonly<Record<string, number>>;
  readonly config: OrderConformanceConfig;
}

export function evaluateOrderConformance(input: OrderConformanceInput): LayoutEvalState {
  const { deviations, config } = input;
  const allowTies = config.allowTies ?? false;

  // 检查所有期望成员是否存在
  for (const id of config.expectedSubjectIds) {
    if (!(id in deviations)) return 'UNKNOWN';
  }

  // 按期望顺序提取偏差值
  const values = config.expectedSubjectIds.map((id) => deviations[id]!);

  // 检查顺序
  for (let i = 0; i < values.length - 1; i++) {
    const current = values[i]!;
    const next = values[i + 1]!;
    if (config.direction === 'ASC') {
      if (current > next) return 'FAIL';
      if (!allowTies && current === next) return 'FAIL';
    } else {
      // DESC
      if (current < next) return 'FAIL';
      if (!allowTies && current === next) return 'FAIL';
    }
  }

  return 'PASS';
}
