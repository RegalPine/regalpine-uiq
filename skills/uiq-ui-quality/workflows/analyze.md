# UIQ Analyze Workflow

## Purpose

Perform general UI quality analysis.

## Execution

```bash
uiq analyze <URL> \
  --format json
```

### Visual Texture Profile

```bash
# Full profile (all 7 dimensions, 58 metrics/rules)
uiq analyze <URL> --texture full --format json

# Core profile (Surface + Depth + Color)
uiq analyze <URL> --texture core --format json

# Custom dimensions
uiq analyze <URL> --dimensions surface,color,typography --format json
```

If the target requires authentication, see the [Auth Workflow](auth.md) first.

If the target is a SPA page that requires clicking through interactions
to reach, use the **playwright-cli** skill to navigate first,
then pass the final URL + auth state to UIQ. See [Auth Workflow](auth.md#spa-navigation-pattern).

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
