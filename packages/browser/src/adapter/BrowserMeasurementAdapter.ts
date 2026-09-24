import type { MeasurementSnapshot } from '@uiq/core';

/**
 * IMPL-07 §6-7：Browser Adapter 接口与测量上下文。
 * Adapter 只负责 DOM → Measurement，不执行 Metric / Rule（§4、AC-BROWSER-12）。
 */
export interface BrowserMeasurementContext {
  readonly snapshotId?: string;
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly includeStyles?: boolean;
  readonly includeColor?: boolean;
  readonly includeTypography?: boolean;
  readonly includeGeometry?: boolean;
  /** IMPL-07 §41：间距为 V1.0 支持类别，默认关闭（第一优先级为 COLOR/TYPOGRAPHY/GEOMETRY）。 */
  readonly includeSpacing?: boolean;
  /** P5（IMPL-09 §32-33）：绑定采集开关，默认关闭；开启时 snapshot.bindings 携带绑定投影。 */
  readonly includeBindings?: boolean;
  /** P5（IMPL-09 §34）：tokenId → CSS 变量名，供 INFERRED 绑定推断。 */
  readonly cssVariableMap?: Readonly<Record<string, string>>;
  /** P8：布局事实采集开关，默认关闭；开启时采集可见性、显示模式与布局属性。 */
  readonly includeLayout?: boolean;
}

export interface BrowserMeasurementAdapter {
  measure(element: Element, context?: BrowserMeasurementContext): MeasurementSnapshot;
}
