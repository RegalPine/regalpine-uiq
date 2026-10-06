/**
 * Surface Texture 度量类型定义。
 * 规范基线：UIQ-VISUAL-QUALITY-11, UIQ-VISUAL-QUALITY-26
 */

/** 单个元素的圆角测量值。 */
export interface RadiusMeasurementValue {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomRight: number;
  readonly bottomLeft: number;
  readonly unit: 'px';
}

/** 单个元素的边界测量值。 */
export interface BorderMeasurementValue {
  readonly topWidth: number;
  readonly rightWidth: number;
  readonly bottomWidth: number;
  readonly leftWidth: number;
  readonly topStyle: string;
  readonly rightStyle: string;
  readonly bottomStyle: string;
  readonly leftStyle: string;
  readonly unit: 'px';
}

/** 单个元素的阴影测量值。 */
export interface ShadowMeasurementValue {
  readonly layers: readonly ShadowLayerData[];
  readonly layerCount: number;
  readonly unit: 'px';
}

export interface ShadowLayerData {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: string;
  readonly inset: boolean;
}

/** 单个元素的透明度测量值。 */
export interface TransparencyMeasurementValue {
  readonly opacity: number;
  readonly hasBackdropFilter: boolean;
}

/** 单个元素的层叠测量值。 */
export interface LayerMeasurementValue {
  readonly zIndex: number | 'auto';
  readonly position: string;
  readonly createsStackingContext: boolean;
}

/** Radius Consistency Metric 输出值。 */
export interface RadiusConsistencyValue {
  readonly populationSize: number;
  readonly distinctValues: number;
  readonly dominantValue: number | undefined;
  readonly dominantCount: number;
  readonly deviationCount: number;
  readonly fragmentationRatio: number;
}

/** Radius Fragmentation Metric 输出值。 */
export interface RadiusFragmentationValue {
  readonly relevantElements: number;
  readonly distinctValues: number;
  readonly fragmentationRatio: number;
  readonly values: readonly number[];
}

/** Border Consistency Metric 输出值。 */
export interface BorderConsistencyValue {
  readonly populationSize: number;
  readonly distinctWidths: number;
  readonly distinctStyles: number;
  readonly dominantWidth: number | undefined;
  readonly dominantStyle: string | undefined;
  readonly deviationCount: number;
}

/** Shadow Consistency Metric 输出值。 */
export interface ShadowConsistencyValue {
  readonly populationSize: number;
  readonly distinctLayerCounts: number;
  readonly distinctBlurs: number;
  readonly dominantBlur: number | undefined;
  readonly deviationCount: number;
}

/** Shadow Complexity Metric 输出值（纯事实，不判断好坏）。 */
export interface ShadowComplexityValue {
  readonly totalShadows: number;
  readonly totalLayers: number;
  readonly distinctBlurs: number;
  readonly distinctSpreads: number;
  readonly maxLayerCount: number;
}

/** Layer Consistency Metric 输出值。 */
export interface LayerConsistencyValue {
  readonly populationSize: number;
  readonly distinctZIndices: number;
  readonly positionDistribution: Readonly<Record<string, number>>;
}

/** Transparency Consistency Metric 输出值。 */
export interface TransparencyConsistencyValue {
  readonly populationSize: number;
  readonly distinctOpacities: number;
  readonly dominantOpacity: number | undefined;
  readonly deviationCount: number;
}

/** Material Consistency Metric 输出值。 */
export interface MaterialConsistencyValue {
  readonly populationSize: number;
  readonly distinctSignatures: number;
  readonly dominantSignature: string | undefined;
  readonly deviationCount: number;
}
