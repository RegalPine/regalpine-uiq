import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';
import {
  normalizeFontWeight,
  normalizeLetterSpacing,
  normalizeLineHeight,
  parsePx,
} from './normalizeTypography';

export interface TypographyMeasureContext {
  readonly subjectId: string;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

/** IMPL-07 §26：读取 computed 排版属性。单属性错误由调用方隔离。 */
export function measureTypography(ctx: TypographyMeasureContext): readonly Measurement<unknown>[] {
  const { subjectId, style, factory } = ctx;
  const measurements: Measurement<unknown>[] = [];
  const fontFamily = style.fontFamily;

  const fontSize = parsePx(style.fontSize);
  measurements.push(
    fontSize !== null
      ? factory.create<unknown>({
          subjectId,
          type: 'typography.font-size',
          value: fontSize,
          unit: 'px',
          metadata: { raw: style.fontSize, fontFamily },
        })
      : factory.create<unknown>({
          subjectId,
          type: 'typography.font-size',
          value: null,
          metadata: { raw: style.fontSize, fontFamily },
        }),
  );

  const lineHeight = fontSize !== null ? normalizeLineHeight(style.lineHeight, fontSize) : null;
  measurements.push(
    lineHeight !== null
      ? factory.create<unknown>({
          subjectId,
          type: 'typography.line-height',
          value: lineHeight,
          unit: 'px',
          metadata: { raw: style.lineHeight },
        })
      : factory.create<unknown>({
          subjectId,
          type: 'typography.line-height',
          value: null,
          metadata: { raw: style.lineHeight, reason: 'normal-or-unparsable' },
        }),
  );

  const fontWeight = normalizeFontWeight(style.fontWeight);
  measurements.push(
    fontWeight !== null
      ? factory.create<unknown>({
          subjectId,
          type: 'typography.font-weight',
          value: fontWeight,
          metadata: { raw: style.fontWeight },
        })
      : factory.create<unknown>({
          subjectId,
          type: 'typography.font-weight',
          value: null,
          metadata: { raw: style.fontWeight },
        }),
  );

  const letterSpacing = normalizeLetterSpacing(style.letterSpacing);
  measurements.push(
    letterSpacing !== null
      ? factory.create<unknown>({
          subjectId,
          type: 'typography.letter-spacing',
          value: letterSpacing,
          unit: 'px',
          metadata: { raw: style.letterSpacing },
        })
      : factory.create<unknown>({
          subjectId,
          type: 'typography.letter-spacing',
          value: null,
          metadata: { raw: style.letterSpacing },
        }),
  );

  return measurements;
}
