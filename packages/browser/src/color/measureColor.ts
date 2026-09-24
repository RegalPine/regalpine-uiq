import type { SRGB } from '@uiq/color';
import { parseColor } from '@uiq/color';
import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';
import { resolveBackgroundChain } from './resolveBackground';

/** 生成单条颜色 Measurement 的参数集合。 */
export interface ColorMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
  readonly lookup: { getElementId(element: Element): string };
}

/**
 * IMPL-07 §14-18：computed `color` → `color.srgb`。
 * Alpha 必须保留，不能静默转换为不透明色；解析失败 → UNKNOWN。
 */
export function measureForegroundColor(ctx: ColorMeasureContext): Measurement<SRGB | null> {
  const { subjectId, style, factory } = ctx;
  const raw = style.color;
  try {
    const value = parseColor(raw);
    return factory.create({ subjectId, type: 'color.srgb', value, metadata: { raw } });
  } catch (error) {
    return factory.create({
      subjectId,
      type: 'color.srgb',
      value: null,
      metadata: { raw, reason: error instanceof Error ? error.message : 'parse-failed' },
    });
  }
}

/**
 * IMPL-07 §19-24：有效背景 → `color.srgb.background`。
 * 透明背景沿祖先链解析；复杂背景 → UNKNOWN；结果必须是不透明色。
 */
export function measureBackgroundColor(ctx: ColorMeasureContext): Measurement<SRGB | null> {
  const { subjectId, element, factory, lookup } = ctx;
  const resolved = resolveBackgroundChain(element, {
    getComputedStyle: (el) => getComputedStyleSafe(el),
    getElementId: (el) => lookup.getElementId(el),
  });
  if (resolved.effective !== null) {
    return factory.create({
      subjectId,
      type: 'color.srgb.background',
      value: resolved.effective,
      metadata: { backgroundChain: resolved.layers },
    });
  }
  return factory.create({
    subjectId,
    type: 'color.srgb.background',
    value: null,
    metadata: { backgroundChain: resolved.layers, reason: resolved.reason ?? 'unresolved' },
  });
}

function getComputedStyleSafe(element: Element): CSSStyleDeclaration {
  const view = element.ownerDocument.defaultView;
  if (view === null) {
    throw new Error('element 未连接到浏览器视图，无法读取 computed style');
  }
  return view.getComputedStyle(element);
}
