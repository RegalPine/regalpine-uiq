# UIQ Visual Texture Workflow

## Purpose

Analyze UI visual texture across 7 dimensions using UIQ metrics and rules.

## Execution

```bash
uiq analyze <URL> \
  --texture full \
  --format json
```

### Single Dimension

```bash
uiq analyze <URL> \
  --dimensions surface \
  --format json
```

### Core Profile (Surface + Depth + Color)

```bash
uiq analyze <URL> \
  --texture core \
  --format json
```

## 7 Dimensions

| Dimension | Metrics | Rules | Key Metrics |
|-----------|---------|-------|-------------|
| Surface | 8 | 8 | SURFACE.RADIUS.CONSISTENCY, SURFACE.RADIUS.FRAGMENTATION, SURFACE.BORDER.CONSISTENCY, SURFACE.SHADOW.CONSISTENCY, SURFACE.SHADOW.COMPLEXITY, SURFACE.LAYER.CONSISTENCY, SURFACE.TRANSPARENCY.CONSISTENCY, SURFACE.MATERIAL.CONSISTENCY |
| Depth | 6 | 6 | DEPTH.ELEVATION.HIERARCHY, DEPTH.SHADOW.DEPTH, DEPTH.LAYER.CONSISTENCY, DEPTH.VISUAL.SEPARATION, DEPTH.OVERLAY.QUALITY, DEPTH.SPATIAL.PRIORITY |
| Color | 7 | 7 | COLOR.LIGHTNESS.HIERARCHY, COLOR.CHROMA.DISTRIBUTION, COLOR.HUE.RELATIONSHIP, COLOR.HARMONY, COLOR.TOKEN.CONSISTENCY, COLOR.NOISE, COLOR.CONTRAST.QUALITY |
| Typography | 7 | 7 | TYPOGRAPHY.FONT.CONSISTENCY, TYPOGRAPHY.SCALE.CONSISTENCY, TYPOGRAPHY.WEIGHT.HIERARCHY, TYPOGRAPHY.LINEHEIGHT.RHYTHM, TYPOGRAPHY.SPACING.QUALITY, TYPOGRAPHY.DENSITY.BALANCE, TYPOGRAPHY.HIERARCHY |
| Spatial | 7 | 7 | SPATIAL.GRID.CONSISTENCY, SPATIAL.ALIGNMENT.CONSISTENCY, SPATIAL.SPACING.RHYTHM, SPATIAL.WHITESPACE.QUALITY, SPATIAL.DENSITY.BALANCE, SPATIAL.PROPORTION.QUALITY, SPATIAL.COMPOSITION.BALANCE |
| Motion | 7 | 7 | MOTION.TRANSITION.QUALITY, MOTION.ANIMATION.TIMING, MOTION.EASING.QUALITY, MOTION.STATE.SMOOTHNESS, MOTION.CONSISTENCY, MOTION.LOADING.QUALITY, MOTION.DURATION.CONSISTENCY |
| Micro Detail | 16 | 16 | MICRO_DETAIL.STATE.COMPLETENESS, MICRO_DETAIL.COMPONENT.CONSISTENCY, MICRO_DETAIL.ICON.CONSISTENCY, MICRO_DETAIL.FOCUS.QUALITY, MICRO_DETAIL.DISABLED.QUALITY, MICRO_DETAIL.EMPTY.QUALITY, MICRO_DETAIL.BORDER.DETAIL, MICRO_DETAIL.RADIUS.DETAIL, MICRO_DETAIL.LOADING.QUALITY, MICRO_DETAIL.ERROR.QUALITY, MICRO_DETAIL.HOVER.COMPLETENESS, MICRO_DETAIL.ACTIVE.FEEDBACK, MICRO_DETAIL.SELECTED.DIFFERENTIATION, MICRO_DETAIL.ICON.ALIGNMENT, MICRO_DETAIL.COMPONENT.DENSITY, MICRO_DETAIL.FRAGMENTATION |

**Total: 58 Metrics, 58 Rules**

## JSON Output

```json
{
  "dimensions": [...],
  "crossDimensionRelations": [...],
  "findings": [...],
  "diagnostics": [...],
  "recommendations": [...],
  "verification": [...],
  "reproducibility": [...]
}
```

## Reference Pages

- `apps/reference/surface.html` — Surface Pass/Fail scenarios
- `apps/reference/depth.html` — Depth scenarios
- `apps/reference/color.html` — Color scenarios
- `apps/reference/typography.html` — Typography scenarios
- `apps/reference/spatial.html` — Spatial scenarios
- `apps/reference/motion.html` — Motion scenarios
- `apps/reference/micro-detail.html` — Micro Detail scenarios
- `apps/reference/cross-dimension.html` — Cross-dimension scenarios
- `apps/reference/systemic.html` — Systemic patterns
