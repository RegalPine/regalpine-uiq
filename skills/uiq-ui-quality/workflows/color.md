# UIQ Color Workflow

## Purpose

Analyze UI color using UIQ color metrics.

## Execution

```bash
uiq analyze \
  --url <URL> \
  --dimension color \
  --format json
```

## Relevant Metrics

- COLOR.SRGB
- COLOR.OKLAB
- COLOR.OKLCH
- COLOR.LIGHTNESS
- COLOR.CHROMA
- COLOR.HUE
- COLOR.CONTRAST
- COLOR.GAMUT_DISTANCE

## Interpretation

Use measured values.

When explaining color differences, distinguish:

- Lightness
- Chroma
- Hue
- Contrast
- Gamut
- Alpha
- Context

Do not use "dirty color" as an independent metric.

## Important

Contrast is not color difference.

OKLCH distance must not automatically be called Delta E.

## Recommendation

If a color-related rule fails, present the relevant token,
component, theme, or element trace before recommending review.
