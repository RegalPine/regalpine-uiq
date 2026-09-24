export type {
  BrowserMeasurementAdapter,
  BrowserMeasurementContext,
} from './adapter/BrowserMeasurementAdapter';
export { BrowserMeasurementAdapterImpl } from './adapter/BrowserMeasurementAdapterImpl';
export { resolveEntityId, hasStableEntityId } from './entity/resolveEntityId';
export type { ResolvedEntityId } from './entity/resolveEntityId';
export { computeDomPath } from './entity/domPath';
export {
  ADAPTER_NAME,
  ADAPTER_VERSION,
  browserSource,
  createMeasurementFactory,
} from './measurement-factory';
export type { MeasurementFactory, MeasurementParams } from './measurement-factory';
export {
  classifyBackground,
  composeBackgroundLayers,
  resolveBackgroundChain,
} from './color/resolveBackground';
export type {
  BackgroundKind,
  BackgroundLayer,
  ResolvedBackground,
} from './color/resolveBackground';
export { measureForegroundColor, measureBackgroundColor } from './color/measureColor';
export { measureTypography } from './typography/measureTypography';
export {
  normalizeFontWeight,
  normalizeLetterSpacing,
  normalizeLineHeight,
  parsePx,
} from './typography/normalizeTypography';
export type { LineHeightValue } from './typography/normalizeTypography';
export { measureGeometry } from './geometry/measureGeometry';
export { rectMeasurements } from './geometry/measureRect';
export type { RectData } from './geometry/measureRect';
export { measureSpacing } from './spacing/measureSpacing';
export { measureEnvironment } from './environment/measureViewport';
export { detectBrowser } from './environment/measureBrowser';
export type { BrowserInfo } from './environment/measureBrowser';
export { collectBinding, EXPLICIT_BINDING_ATTRIBUTE } from './binding/collectBindings';
export type { BindingCollectionInput } from './binding/collectBindings';
export { classifyVisibility, classifyDisplayMode, measureLayout } from './layout/';
export type {
  VisibilityState,
  VisibilityClassification,
  VisibilityInput,
  LayoutDisplayMode,
  DisplayModeClassification,
  LayoutMeasureContext,
  LayoutMeasurementResult,
} from './layout/';
