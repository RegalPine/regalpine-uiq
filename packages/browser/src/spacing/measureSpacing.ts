import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';
import { parsePx } from '../typography/normalizeTypography';

export interface SpacingMeasureContext {
  readonly subjectId: string;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

const SPACING_PROPERTIES = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
] as const;

/** IMPL-07 §41-42：margin/padding/gap 全部标准化为 computed px；`auto`/无法解析 → UNKNOWN。 */
export function measureSpacing(ctx: SpacingMeasureContext): readonly Measurement<unknown>[] {
  const { subjectId, style, factory } = ctx;
  const measurements: Measurement<unknown>[] = [];
  for (const property of SPACING_PROPERTIES) {
    const raw = style[property];
    const value = parsePx(raw);
    measurements.push(
      value !== null
        ? factory.create({
            subjectId,
            type: `spacing.${property}`,
            value,
            unit: 'px',
            metadata: { raw },
          })
        : factory.create({
            subjectId,
            type: `spacing.${property}`,
            value: null,
            metadata: { raw },
          }),
    );
  }
  for (const gapProperty of ['rowGap', 'columnGap'] as const) {
    const raw = style[gapProperty];
    const value = parsePx(raw);
    const type = gapProperty === 'rowGap' ? 'spacing.row-gap' : 'spacing.column-gap';
    measurements.push(
      value !== null
        ? factory.create({ subjectId, type, value, unit: 'px', metadata: { raw } })
        : factory.create({ subjectId, type, value: null, metadata: { raw } }),
    );
  }
  return measurements;
}
