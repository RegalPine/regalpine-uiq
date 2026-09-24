/**
 * 页面内 Radix adapter 入口（tsup iife 构建，挂载为 window.UIQRadix）。
 * 模块运行时导出 createAdapter —— tsup iife wrapper 将其挂载到 globalName，
 * 与 @uiq/browser 的 browser-global 挂载模式一致。
 */
import type { RadixDomAdapterOptions } from './adapter';
import { RadixDomAdapter } from './adapter';

export function createAdapter(options?: RadixDomAdapterOptions): RadixDomAdapter {
  return new RadixDomAdapter(options);
}
