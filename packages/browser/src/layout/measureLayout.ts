import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';
import { parsePx } from '../typography/normalizeTypography';
import { classifyDisplayMode, classifyVisibility } from './classifyVisibility';
import type { VisibilityState, LayoutDisplayMode } from './classifyVisibility';

export interface LayoutMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

export interface LayoutMeasurementResult {
  readonly measurements: readonly Measurement<unknown>[];
  readonly visibility: VisibilityState;
  readonly displayMode: LayoutDisplayMode;
}

/**
 * P8-01：布局事实采集。
 *
 * 复用既有 rect/spacing 读取，额外采集：
 * - 可见性分类（DISPLAY_NONE / VISIBILITY_HIDDEN / ZERO_SIZE / OFFSCREEN / CLIPPED / VISIBLE）
 * - 布局显示模式（BLOCK / FLEX / GRID 等）
 * - CSS 布局属性（flexDirection, justifyContent, alignItems, alignContent, flexWrap,
 *   gridTemplateColumns, gridTemplateRows, gap）
 * - data-uiq-layout-role 属性（可选布局角色标识）
 *
 * 不计算布局评价；只输出事实 Measurement。
 */
export function measureLayout(ctx: LayoutMeasureContext): LayoutMeasurementResult {
  const { subjectId, element, style, factory, viewportWidth, viewportHeight } = ctx;
  const rect = element.getBoundingClientRect();

  const visibility = classifyVisibility({
    display: style.display,
    visibility: style.visibility,
    width: rect.width,
    height: rect.height,
    viewportWidth,
    viewportHeight,
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    overflow: style.overflow,
    clip: style.clip,
  });

  const displayMode = classifyDisplayMode(style.display, style.position);

  const measurements: Measurement<unknown>[] = [];

  // 可见性事实
  measurements.push(
    factory.create({
      subjectId,
      type: 'layout.visibility',
      value: visibility.state,
      metadata: {
        ...(visibility.reasons.length > 0 ? { reasons: visibility.reasons } : {}),
      },
    }),
  );

  // 显示模式事实
  measurements.push(
    factory.create({
      subjectId,
      type: 'layout.display-mode',
      value: displayMode.mode,
      metadata: { display: displayMode.display, position: displayMode.position },
    }),
  );

  // Flex 容器属性（仅 flex/inline-flex 时采集）
  if (displayMode.mode === 'FLEX' || displayMode.mode === 'INLINE_FLEX') {
    for (const [cssProp, type] of [
      ['flexDirection', 'layout.flex-direction'],
      ['justifyContent', 'layout.justify-content'],
      ['alignItems', 'layout.align-items'],
      ['alignContent', 'layout.align-content'],
      ['flexWrap', 'layout.flex-wrap'],
    ] as const) {
      const value = style[cssProp as keyof CSSStyleDeclaration] as string;
      measurements.push(factory.create({ subjectId, type, value: value || null }));
    }
  }

  // Grid 容器属性（仅 grid/inline-grid 时采集）
  if (displayMode.mode === 'GRID' || displayMode.mode === 'INLINE_GRID') {
    for (const [cssProp, type] of [
      ['gridTemplateColumns', 'layout.grid-template-columns'],
      ['gridTemplateRows', 'layout.grid-template-rows'],
    ] as const) {
      const value = style[cssProp as keyof CSSStyleDeclaration] as string;
      measurements.push(factory.create({ subjectId, type, value: value || null }));
    }
  }

  // gap 属性（flex/grid 容器均适用）
  if (
    displayMode.mode === 'FLEX' ||
    displayMode.mode === 'INLINE_FLEX' ||
    displayMode.mode === 'GRID' ||
    displayMode.mode === 'INLINE_GRID'
  ) {
    for (const [cssProp, type] of [
      ['rowGap', 'layout.row-gap'],
      ['columnGap', 'layout.column-gap'],
    ] as const) {
      const raw = style[cssProp as keyof CSSStyleDeclaration] as string;
      const parsed = parsePx(raw);
      measurements.push(
        parsed !== null
          ? factory.create({ subjectId, type, value: parsed, unit: 'px', metadata: { raw } })
          : factory.create({ subjectId, type, value: null, metadata: { raw } }),
      );
    }
  }

  // 布局角色标识（data-uiq-layout-role 可选属性）
  const layoutRole = element.getAttribute('data-uiq-layout-role');
  if (layoutRole !== null) {
    measurements.push(factory.create({ subjectId, type: 'layout.role', value: layoutRole }));
  }

  return { measurements, visibility: visibility.state, displayMode: displayMode.mode };
}
