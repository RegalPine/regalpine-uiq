# UIQ Visual Texture Workflow

## Purpose

Analyze UI visual texture across 7 dimensions using UIQ metrics and rules.

## Execution

```bash
uiq analyze \
  --profile visual-texture \
  --url <URL> \
  --format json
```

### Single Dimension

```bash
uiq analyze \
  --profile visual-texture \
  --dimensions surface \
  --url <URL> \
  --format json
```

## 7 Dimensions

| Dimension | Description | Key Metrics |
|-----------|-------------|-------------|
| Surface | Border radius, border, shadow consistency | SURFACE.RADIUS.CONSISTENCY |
| Depth | Elevation hierarchy, shadow depth | DEPTH.ELEVATION.HIERARCHY |
| Color | Lightness, chroma, hue, token consistency | COLOR.LIGHTNESS.HIERARCHY |
| Typography | Font, scale, weight, line-height | TYPOGRAPHY.FONT.CONSISTENCY |
| Spatial | Grid, alignment, spacing, whitespace | SPATIAL.GRID.CONSISTENCY |
| Motion | Transition, easing, duration consistency | MOTION.TRANSITION.QUALITY |
| Micro Detail | State, icon, focus, disabled quality | MICRO_DETAIL.STATE.COMPLETENESS |

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
