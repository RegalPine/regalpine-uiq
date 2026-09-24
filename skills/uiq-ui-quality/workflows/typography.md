# UIQ Typography Workflow

## Purpose

Analyze typography.

## Execution

```bash
uiq analyze \
  --url <URL> \
  --dimension typography \
  --format json
```

## Metrics

- FONT_SIZE
- FONT_WEIGHT
- LINE_HEIGHT
- LETTER_SPACING
- TEXT_MEASURE
- SCALE_RATIO
- DENSITY

## Output

For each issue:

Element
→ Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding

## Important

Do not assume that a larger or smaller value is better.

The Rule defines conformance.

Variable font weights should be preserved as measured.
