import type { MeasurementEnvironment } from '@uiq/core';
import { detectBrowser } from './measureBrowser';

/**
 * IMPL-07 §43/§45/§52：Snapshot 必须记录 viewport、DPR、zoom、browser
 * 与滚动位置（viewport-relative 坐标受 scroll 影响）。
 */
export function measureEnvironment(view: Window): MeasurementEnvironment {
  const visualViewport = view.visualViewport;
  const browser = detectBrowser(view.navigator.userAgent);
  return {
    viewport: { width: view.innerWidth, height: view.innerHeight },
    devicePixelRatio: view.devicePixelRatio,
    ...(visualViewport !== null && visualViewport !== undefined && visualViewport.scale !== 1
      ? { zoom: visualViewport.scale }
      : {}),
    scrollX: view.scrollX,
    scrollY: view.scrollY,
    browser,
  };
}
