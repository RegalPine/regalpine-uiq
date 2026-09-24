# UIQ Analyze Workflow

## Purpose

Perform general UI quality analysis.

## Execution

```bash
uiq analyze \
  --url <URL> \
  --format json
```

If the target requires authentication, see the [Auth Workflow](auth.md) first.

## Optional Scope

Dimensions:

- accessibility
- color
- typography
- geometry
- spacing
- layout
- hierarchy
- design-system

Themes may be analyzed independently.

## Processing

Read:

- summary
- evaluation distribution
- findings
- diagnostics
- recommendations

## Response

Report factual results.

Example:

Accessibility:

- PASS: 42
- FAIL: 3
- UNKNOWN: 1

Color:

- PASS: 58
- FAIL: 2

Do not convert these values into an overall score.

## Recommendation

Only present recommendations supported by Findings and Diagnostics.
