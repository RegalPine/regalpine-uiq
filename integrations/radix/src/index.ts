/**
 * @uiq/radix — Radix 渲染后 DOM 约定 adapter（IMPL-13 §31-39）。
 * 依赖白名单：core/tokens/theme/browser（ARCH-01 §4.2/§4.3）；React 不安装（纯 DOM）。
 */
export type {
  ComponentBinding,
  RadixDomAdapterOptions,
  ThemeContext,
  UIQDesignSystemAdapter,
} from './adapter';
export { RadixDomAdapter } from './adapter';
