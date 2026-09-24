# UIQ Inspect Workflow

## Purpose

Inspect a specific UI element or component.

## Input

Required:

- URL or active browser page

Optional:

- selector
- data-uiq-id
- component identifier

## Execution

Run:

```bash
uiq inspect --format json
```

If URL is provided:

```bash
uiq inspect \
  --url <URL> \
  --format json
```

If selector is provided:

```bash
uiq inspect \
  --url <URL> \
  --selector "<selector>" \
  --format json
```

## Result

Inspect:

1. Measurement
2. Metrics
3. Rules
4. Findings
5. Diagnostics
6. Tokens
7. Theme
8. Trace

## Response

Summarize:

- selected element
- important measurements
- failed rules
- findings
- diagnostic causes
- recommendations

Do not create subjective quality judgments.

## Evidence

Preserve the UIQ evidence chain.
