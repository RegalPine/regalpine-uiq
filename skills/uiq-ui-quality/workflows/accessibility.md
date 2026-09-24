# UIQ Accessibility Workflow

## Purpose

Analyze accessibility-related UI rules.

## Execution

```bash
uiq analyze \
  --url <URL> \
  --dimension accessibility \
  --format json
```

## Metrics

Relevant UIQ metrics may include:

- CONTRAST
- TARGET_SIZE
- FOCUS_VISIBILITY
- TEXT_LEGIBILITY

## Rules

Use the exact rule ID and version returned by UIQ.

Do not independently reproduce accessibility thresholds.

## Output

For each failure:

Rule
→ Metric
→ Value
→ Threshold
→ Finding
→ Diagnostic
→ Recommendation
→ Verification

## Unknown

If measurement is unavailable:

Evaluation = UNKNOWN

Do not reinterpret it as FAIL.
