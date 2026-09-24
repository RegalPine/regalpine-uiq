import type { Measurement, MeasurementSnapshot, TokenBinding } from '@uiq/core';
import { BrowserMeasurementAdapterImpl } from './adapter/BrowserMeasurementAdapterImpl';
import type { BrowserMeasurementContext } from './adapter/BrowserMeasurementAdapter';
import { collectBinding } from './binding/collectBindings';
import { ADAPTER_VERSION, createMeasurementFactory } from './measurement-factory';
import { measureEnvironment } from './environment/measureViewport';
import { resolveEntityId } from './entity/resolveEntityId';

/**
 * 页面内采集入口（tsup iife 构建，挂载为 window.UIQBrowser）。
 * CLI 宿主通过 page.addScriptTag 注入后调用 capture()，返回 JSON 可序列化快照。
 */
export interface CaptureOptions extends BrowserMeasurementContext {
  /** CSS 选择器或选择器列表；默认采集全部 [data-uiq-id] 元素。 */
  readonly subjects?: string | readonly string[];
}

function resolveSubjects(subjects: string | readonly string[] | undefined): readonly Element[] {
  if (subjects === undefined) {
    return Array.from(document.querySelectorAll('[data-uiq-id]'));
  }
  const selector = typeof subjects === 'string' ? subjects : subjects.join(',');
  if (selector.trim() === '') {
    return Array.from(document.querySelectorAll('[data-uiq-id]'));
  }
  return Array.from(document.querySelectorAll(selector));
}

/** IMPL-07 §46/§50：一次 capture 内所有 subject 共享同一时间戳与环境状态。 */
export function capture(options: CaptureOptions = {}): MeasurementSnapshot {
  const elements = resolveSubjects(options.subjects);
  const timestamp = Date.now();
  const factory = createMeasurementFactory(timestamp);
  const adapter = new BrowserMeasurementAdapterImpl();
  const measurements: Measurement[] = [];
  elements.forEach((element, index) => {
    measurements.push(...adapter.measureElement(element, factory, options, index + 1));
  });
  // P5（IMPL-09 §32-33）：绑定投影与测量同序采集，subjectId 解析规则一致。
  const bindings: TokenBinding[] | undefined =
    options.includeBindings === true
      ? elements.map((element, index) =>
          collectBinding({
            element,
            subjectId: resolveEntityId(element, index + 1).id,
            ...(options.cssVariableMap !== undefined
              ? { cssVariableMap: options.cssVariableMap }
              : {}),
          }),
        )
      : undefined;
  const view = window;
  const env = measureEnvironment(view);
  return {
    id: options.snapshotId ?? `snap-${timestamp}`,
    capturedAt: timestamp,
    source: factory.source,
    ...(options.viewport !== undefined
      ? { environment: { ...env, viewport: options.viewport } }
      : { environment: env }),
    measurements,
    ...(bindings !== undefined ? { bindings } : {}),
  };
}

export interface UIQBrowserGlobal {
  readonly version: string;
  capture(options?: CaptureOptions): MeasurementSnapshot;
}

const globalApi: UIQBrowserGlobal = {
  version: ADAPTER_VERSION,
  capture,
};

declare global {
  interface Window {
    UIQBrowser?: UIQBrowserGlobal;
  }
}

window.UIQBrowser = globalApi;
