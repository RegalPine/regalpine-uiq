/** Depth Texture 度量类型定义。 */

export interface ElevationHierarchyValue {
  readonly populationSize: number;
  readonly levelCount: number;
  readonly hierarchyDepth: number;
}

export interface ShadowDepthValue {
  readonly populationSize: number;
  readonly distinctDepths: number;
  readonly dominantDepth: number | undefined;
  readonly maxDepth: number;
}

export interface DepthLayerConsistencyValue {
  readonly populationSize: number;
  readonly distinctLayers: number;
  readonly layerDistribution: Readonly<Record<string, number>>;
}

export interface VisualSeparationValue {
  readonly populationSize: number;
  readonly separatedPairs: number;
  readonly totalPairs: number;
  readonly separationRatio: number;
}

export interface OverlayQualityValue {
  readonly overlayCount: number;
  readonly hasBackdrop: boolean;
  readonly avgOpacity: number;
}

export interface SpatialPriorityValue {
  readonly populationSize: number;
  readonly priorityLevels: number;
  readonly positionOrder: readonly string[];
}
