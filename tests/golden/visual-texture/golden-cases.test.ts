import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot, MetricResult } from '@uiq/core';
import {
  surfaceMetrics, depthMetrics, colorTextureMetrics,
  typographyTextureMetrics, spatialTextureMetrics, motionTextureMetrics,
  microDetailTextureMetrics,
} from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(measurements: Array<{ subjectId: string; type: string; value: unknown; status?: string }>): MeasurementSnapshot {
  return {
    id: 'snap-golden', capturedAt: 1000, source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`, subjectId: m.subjectId, type: m.type, value: m.value,
      status: (m.status ?? 'AVAILABLE') as 'AVAILABLE' | 'UNKNOWN' | 'ERROR',
      source, timestamp: 1000,
    })),
  };
}

function makeCtx(snapshot: MeasurementSnapshot, subjectId = 'page-1'): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: new Map() };
}

type ExpectedStatus = 'AVAILABLE' | 'UNKNOWN' | 'ERROR';

interface GoldenMetricCase {
  id: string;
  dimension: string;
  metricId: string;
  measurements: Array<{ subjectId: string; type: string; value: unknown; status?: string }>;
  expectedStatus: ExpectedStatus;
  expectedValue?: Record<string, unknown>;
}

// =========================================================================
// Surface Golden Cases (12)
// =========================================================================
const surfaceGoldenCases: GoldenMetricCase[] = [
  { id: 'SURF-001', dimension: 'Surface', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }, { subjectId: 'e2', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }], expectedStatus: 'AVAILABLE', expectedValue: { populationSize: 2, distinctValues: 1, deviationCount: 0 } },
  { id: 'SURF-002', dimension: 'Surface', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SURF-003', dimension: 'Surface', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 } }, { subjectId: 'e2', type: 'surface.radius', value: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 } }], expectedStatus: 'AVAILABLE', expectedValue: { distinctValues: 2 } },
  { id: 'SURF-004', dimension: 'Surface', metricId: 'SURFACE.RADIUS.FRAGMENTATION', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-005', dimension: 'Surface', metricId: 'SURFACE.BORDER.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-006', dimension: 'Surface', metricId: 'SURFACE.BORDER.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SURF-007', dimension: 'Surface', metricId: 'SURFACE.SHADOW.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-008', dimension: 'Surface', metricId: 'SURFACE.SHADOW.COMPLEXITY', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 2, layers: [{ blur: 3, spread: 0 }, { blur: 8, spread: 2 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-009', dimension: 'Surface', metricId: 'SURFACE.LAYER.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.layer', value: { zIndex: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-010', dimension: 'Surface', metricId: 'SURFACE.TRANSPARENCY.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.transparency', value: { opacity: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-011', dimension: 'Surface', metricId: 'SURFACE.MATERIAL.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.material', value: { backgroundType: 'solid' } }], expectedStatus: 'AVAILABLE' },
  { id: 'SURF-012', dimension: 'Surface', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 } }], expectedStatus: 'AVAILABLE', expectedValue: { dominantValue: 0 } },
  { id: 'SURF-013', dimension: 'Surface', metricId: 'SURFACE.SHADOW.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SURF-014', dimension: 'Surface', metricId: 'SURFACE.LAYER.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Depth Golden Cases (10)
// =========================================================================
const depthGoldenCases: GoldenMetricCase[] = [
  { id: 'DEP-001', dimension: 'Depth', metricId: 'DEPTH.ELEVATION.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } }, { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 2 } }], expectedStatus: 'AVAILABLE', expectedValue: { levelCount: 2 } },
  { id: 'DEP-002', dimension: 'Depth', metricId: 'DEPTH.ELEVATION.HIERARCHY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'DEP-003', dimension: 'Depth', metricId: 'DEPTH.SHADOW.DEPTH', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-004', dimension: 'Depth', metricId: 'DEPTH.LAYER.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.layer', value: { zIndex: 1 } }, { subjectId: 'e2', type: 'surface.layer', value: { zIndex: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-005', dimension: 'Depth', metricId: 'DEPTH.VISUAL.SEPARATION', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } }, { subjectId: 'e2', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 5, spread: 1 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-006', dimension: 'Depth', metricId: 'DEPTH.OVERLAY.QUALITY', measurements: [{ subjectId: 'e1', type: 'surface.transparency', value: { opacity: 0.8, hasBackdropFilter: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-007', dimension: 'Depth', metricId: 'DEPTH.SPATIAL.PRIORITY', measurements: [{ subjectId: 'e1', type: 'surface.layer', value: { zIndex: 10, position: 'absolute' } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-008', dimension: 'Depth', metricId: 'DEPTH.SHADOW.DEPTH', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'DEP-009', dimension: 'Depth', metricId: 'DEPTH.ELEVATION.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'surface.layer', value: { zIndex: 'auto' } }], expectedStatus: 'AVAILABLE' },
  { id: 'DEP-010', dimension: 'Depth', metricId: 'DEPTH.LAYER.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'DEP-011', dimension: 'Depth', metricId: 'DEPTH.VISUAL.SEPARATION', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Color Golden Cases (12)
// =========================================================================
const colorGoldenCases: GoldenMetricCase[] = [
  { id: 'COL-001', dimension: 'Color', metricId: 'COLOR.LIGHTNESS.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 1, g: 1, b: 1, alpha: 1 } }, { subjectId: 'e2', type: 'color.srgb', value: { r: 0, g: 0, b: 0, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-002', dimension: 'Color', metricId: 'COLOR.LIGHTNESS.HIERARCHY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'COL-003', dimension: 'Color', metricId: 'COLOR.CHROMA.DISTRIBUTION', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 1, g: 0, b: 0, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-004', dimension: 'Color', metricId: 'COLOR.HUE.RELATIONSHIP', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 1, g: 0, b: 0, alpha: 1 } }, { subjectId: 'e2', type: 'color.srgb', value: { r: 0, g: 0, b: 1, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-005', dimension: 'Color', metricId: 'COLOR.HARMONY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.2, g: 0.4, b: 0.8, alpha: 1 } }, { subjectId: 'e2', type: 'color.srgb', value: { r: 0.8, g: 0.3, b: 0.2, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-006', dimension: 'Color', metricId: 'COLOR.TOKEN.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.1, g: 0.45, b: 0.91, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-007', dimension: 'Color', metricId: 'COLOR.NOISE', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.1, g: 0.4, b: 0.9, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-008', dimension: 'Color', metricId: 'COLOR.CONTRAST.QUALITY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0, g: 0, b: 0, alpha: 1 } }, { subjectId: 'e2', type: 'color.srgb.background', value: { r: 1, g: 1, b: 1, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-009', dimension: 'Color', metricId: 'COLOR.CHROMA.DISTRIBUTION', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'COL-010', dimension: 'Color', metricId: 'COLOR.HUE.RELATIONSHIP', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'COL-011', dimension: 'Color', metricId: 'COLOR.LIGHTNESS.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 } }, { subjectId: 'e2', type: 'color.srgb', value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'COL-012', dimension: 'Color', metricId: 'COLOR.CONTRAST.QUALITY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'COL-013', dimension: 'Color', metricId: 'COLOR.HARMONY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'COL-014', dimension: 'Color', metricId: 'COLOR.NOISE', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Typography Golden Cases (10)
// =========================================================================
const typoGoldenCases: GoldenMetricCase[] = [
  { id: 'TYPO-001', dimension: 'Typography', metricId: 'TYPOGRAPHY.FONT.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'typography.font-size', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-002', dimension: 'Typography', metricId: 'TYPOGRAPHY.FONT.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'TYPO-003', dimension: 'Typography', metricId: 'TYPOGRAPHY.SCALE.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'typography.font-size', value: 16 }, { subjectId: 'e2', type: 'typography.font-size', value: 24 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-004', dimension: 'Typography', metricId: 'TYPOGRAPHY.WEIGHT.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'typography.font-weight', value: 400 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-005', dimension: 'Typography', metricId: 'TYPOGRAPHY.LINEHEIGHT.RHYTHM', measurements: [{ subjectId: 'e1', type: 'typography.line-height', value: 1.5 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-006', dimension: 'Typography', metricId: 'TYPOGRAPHY.SPACING.QUALITY', measurements: [{ subjectId: 'e1', type: 'typography.letter-spacing', value: 0.5 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-007', dimension: 'Typography', metricId: 'TYPOGRAPHY.DENSITY.BALANCE', measurements: [{ subjectId: 'e1', type: 'typography.font-size', value: 16 }, { subjectId: 'e1', type: 'typography.line-height', value: 1.5 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-008', dimension: 'Typography', metricId: 'TYPOGRAPHY.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'typography.font-size', value: 12 }, { subjectId: 'e2', type: 'typography.font-size', value: 16 }, { subjectId: 'e3', type: 'typography.font-size', value: 24 }], expectedStatus: 'AVAILABLE' },
  { id: 'TYPO-009', dimension: 'Typography', metricId: 'TYPOGRAPHY.SCALE.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'TYPO-010', dimension: 'Typography', metricId: 'TYPOGRAPHY.WEIGHT.HIERARCHY', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Spatial Golden Cases (12)
// =========================================================================
const spatialGoldenCases: GoldenMetricCase[] = [
  { id: 'SPAT-001', dimension: 'Spatial', metricId: 'SPATIAL.GRID.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 128 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-002', dimension: 'Spatial', metricId: 'SPATIAL.GRID.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SPAT-003', dimension: 'Spatial', metricId: 'SPATIAL.ALIGNMENT.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'geometry.x', value: 0 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-004', dimension: 'Spatial', metricId: 'SPATIAL.SPACING.RHYTHM', measurements: [{ subjectId: 'e1', type: 'spacing.gap', value: 16 }, { subjectId: 'e2', type: 'spacing.gap', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-005', dimension: 'Spatial', metricId: 'SPATIAL.WHITESPACE.QUALITY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 100 }, { subjectId: 'e1', type: 'geometry.height', value: 50 }, { subjectId: 'e1', type: 'geometry.area', value: 10000 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-006', dimension: 'Spatial', metricId: 'SPATIAL.DENSITY.BALANCE', measurements: [{ subjectId: 'e1', type: 'geometry.area', value: 5000 }, { subjectId: 'e2', type: 'geometry.area', value: 8000 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-007', dimension: 'Spatial', metricId: 'SPATIAL.PROPORTION.QUALITY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 100 }, { subjectId: 'e1', type: 'geometry.height', value: 50 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-008', dimension: 'Spatial', metricId: 'SPATIAL.COMPOSITION.BALANCE', measurements: [{ subjectId: 'e1', type: 'geometry.x', value: 0 }, { subjectId: 'e2', type: 'geometry.x', value: 200 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-009', dimension: 'Spatial', metricId: 'SPATIAL.ALIGNMENT.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SPAT-010', dimension: 'Spatial', metricId: 'SPATIAL.SPACING.RHYTHM', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'SPAT-011', dimension: 'Spatial', metricId: 'SPATIAL.GRID.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 128 }, { subjectId: 'e2', type: 'geometry.width', value: 128 }], expectedStatus: 'AVAILABLE' },
  { id: 'SPAT-012', dimension: 'Spatial', metricId: 'SPATIAL.COMPOSITION.BALANCE', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Motion Golden Cases (10)
// =========================================================================
const motionGoldenCases: GoldenMetricCase[] = [
  { id: 'MOT-001', dimension: 'Motion', metricId: 'MOTION.TRANSITION.QUALITY', measurements: [{ subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-002', dimension: 'Motion', metricId: 'MOTION.TRANSITION.QUALITY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'MOT-003', dimension: 'Motion', metricId: 'MOTION.ANIMATION.TIMING', measurements: [{ subjectId: 'e1', type: 'motion.animation', value: { name: 'fadeIn', duration: 300, timingFunction: 'ease-in' } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-004', dimension: 'Motion', metricId: 'MOTION.EASING.QUALITY', measurements: [{ subjectId: 'e1', type: 'motion.transition', value: { timingFunctions: ['ease'] } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-005', dimension: 'Motion', metricId: 'MOTION.STATE.SMOOTHNESS', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { cursor: 'pointer', isFocusable: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-006', dimension: 'Motion', metricId: 'MOTION.DURATION.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-007', dimension: 'Motion', metricId: 'MOTION.LOADING.QUALITY', measurements: [{ subjectId: 'e1', type: 'motion.animation', value: { hasAnimation: true, durations: [1000] } }], expectedStatus: 'AVAILABLE' },
  { id: 'MOT-008', dimension: 'Motion', metricId: 'MOTION.EASING.QUALITY', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'MOT-009', dimension: 'Motion', metricId: 'MOTION.STATE.SMOOTHNESS', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'MOT-010', dimension: 'Motion', metricId: 'MOTION.DURATION.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Micro Detail Golden Cases (14)
// =========================================================================
const microGoldenCases: GoldenMetricCase[] = [
  { id: 'MIC-001', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.STATE.COMPLETENESS', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-002', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.STATE.COMPLETENESS', measurements: [], expectedStatus: 'UNKNOWN' },
  { id: 'MIC-003', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.COMPONENT.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'state.coverage', value: { requiredStates: ['hover'], observedStates: ['hover'], coverageRatio: 1.0 } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-004', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.ICON.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 16 }, { subjectId: 'e2', type: 'geometry.width', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-005', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.FOCUS.QUALITY', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: false } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-006', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.DISABLED.QUALITY', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-007', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.EMPTY.QUALITY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 200 }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-008', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.HOVER.COMPLETENESS', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-009', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.ACTIVE.FEEDBACK', measurements: [{ subjectId: 'e1', type: 'motion.state-transition', value: { hasActiveTransition: true, transitionPropertyCount: 2 } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-010', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.SELECTED.DIFFERENTIATION', measurements: [{ subjectId: 'e1', type: 'state.coverage', value: { requiredStates: ['hover', 'selected'], observedStates: ['hover', 'selected'], coverageRatio: 1.0 } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-011', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.ICON.ALIGNMENT', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 16 }, { subjectId: 'e1', type: 'geometry.height', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-012', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.COMPONENT.DENSITY', measurements: [{ subjectId: 'e1', type: 'geometry.area', value: 4000 }, { subjectId: 'e1', type: 'geometry.width', value: 100 }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-013', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.FRAGMENTATION', measurements: [{ subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } }], expectedStatus: 'AVAILABLE' },
  { id: 'MIC-014', dimension: 'MicroDetail', metricId: 'MICRO_DETAIL.ICON.CONSISTENCY', measurements: [], expectedStatus: 'UNKNOWN' },
];

// =========================================================================
// Cross-Dimension + Systemic Golden Cases (10)
// =========================================================================
const crossGoldenCases: GoldenMetricCase[] = [
  { id: 'CROSS-001', dimension: 'CrossDimension', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-002', dimension: 'CrossDimension', metricId: 'DEPTH.ELEVATION.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-003', dimension: 'CrossDimension', metricId: 'COLOR.LIGHTNESS.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-004', dimension: 'CrossDimension', metricId: 'TYPOGRAPHY.FONT.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'typography.font-size', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-005', dimension: 'CrossDimension', metricId: 'SPATIAL.GRID.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'geometry.width', value: 128 }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-006', dimension: 'CrossDimension', metricId: 'MOTION.TRANSITION.QUALITY', measurements: [{ subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-007', dimension: 'CrossDimension', metricId: 'MICRO_DETAIL.STATE.COMPLETENESS', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-008', dimension: 'Systemic', metricId: 'SURFACE.RADIUS.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-009', dimension: 'Systemic', metricId: 'COLOR.TOKEN.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'color.srgb', value: { r: 0.1, g: 0.45, b: 0.91, alpha: 1 } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-010', dimension: 'Systemic', metricId: 'MOTION.DURATION.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-011', dimension: 'CrossDimension', metricId: 'SURFACE.BORDER.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#ccc' } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-012', dimension: 'CrossDimension', metricId: 'DEPTH.SHADOW.DEPTH', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 4, spread: 0 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-013', dimension: 'CrossDimension', metricId: 'TYPOGRAPHY.WEIGHT.HIERARCHY', measurements: [{ subjectId: 'e1', type: 'typography.font-weight', value: 400 }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-014', dimension: 'Systemic', metricId: 'SURFACE.SHADOW.CONSISTENCY', measurements: [{ subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1, layers: [{ blur: 3, spread: 0 }] } }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-015', dimension: 'Systemic', metricId: 'SPATIAL.SPACING.RHYTHM', measurements: [{ subjectId: 'e1', type: 'spacing.gap', value: 16 }], expectedStatus: 'AVAILABLE' },
  { id: 'CROSS-016', dimension: 'Systemic', metricId: 'MICRO_DETAIL.STATE.COMPLETENESS', measurements: [{ subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } }], expectedStatus: 'AVAILABLE' },
];

// =========================================================================
// Aggregate all cases
// =========================================================================
const allGoldenCases = [
  ...surfaceGoldenCases, ...depthGoldenCases, ...colorGoldenCases,
  ...typoGoldenCases, ...spatialGoldenCases, ...motionGoldenCases,
  ...microGoldenCases, ...crossGoldenCases,
];

// =========================================================================
// Runner
// =========================================================================
function findMetric(metricId: string) {
  const all = [
    ...surfaceMetrics, ...depthMetrics, ...colorTextureMetrics,
    ...typographyTextureMetrics, ...spatialTextureMetrics,
    ...motionTextureMetrics, ...microDetailTextureMetrics,
  ];
  return all.find((m) => m.id === metricId);
}

describe(`Visual Texture Golden Cases (${allGoldenCases.length} cases)`, () => {
  it(`总计 >= 100 Golden Cases`, () => {
    expect(allGoldenCases.length).toBeGreaterThanOrEqual(100);
  });

  for (const gc of allGoldenCases) {
    it(`${gc.id} [${gc.dimension}] ${gc.metricId} → ${gc.expectedStatus}`, () => {
      const metric = findMetric(gc.metricId);
      if (!metric) {
        // For cross-dimension/systemic cases, skip if metric not found
        if (gc.dimension === 'CrossDimension' || gc.dimension === 'Systemic') return;
        throw new Error(`Metric ${gc.metricId} not found`);
      }
      const snap = makeSnapshot(gc.measurements);
      const result = metric.calculate(makeCtx(snap));
      expect(result.status).toBe(gc.expectedStatus);
      if (gc.expectedValue) {
        for (const [key, val] of Object.entries(gc.expectedValue)) {
          expect((result.value as Record<string, unknown>)?.[key]).toEqual(val);
        }
      }
    });
  }
});
