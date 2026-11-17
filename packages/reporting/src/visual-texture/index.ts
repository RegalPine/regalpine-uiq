export { recommendSurface } from './recommendations';
export type { SurfaceRecommendation } from './recommendations';
export { recommendVisualTexture } from './recommend-all';
export type { VisualTextureRecommendation } from './recommend-all';
export { aggregateVisualTexture } from './aggregation';
export type { VisualTextureAggregation, DimensionSummary } from './aggregation';
export { generateVerification } from './verification';
export { detectCrossDimensionRelations } from './crossDimension';
export { detectSystemicPatterns } from './systemic';
export { buildVisualTextureReport } from './report';
// Cross-Component Visual Continuity
export { analyzeCrossComponentContinuity, inferComponentRelations } from './crossComponent';
export { groupMeasurementsByComponent, groupByExplicitBoundaries } from './componentGrouping';
export type { ComponentMetricGroup } from './componentGrouping';
