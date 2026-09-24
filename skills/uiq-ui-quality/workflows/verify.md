# UIQ Verification Workflow

## Purpose

Verify that an implementation change actually resolves a UI issue.

## Preconditions

There must be:

- previous Finding
- Recommendation
- Verification Criterion

## Execution

Verification is a composite workflow using UIQ CLI:

1. Remeasure:

```bash
uiq analyze \
  --url <URL> \
  --format json
```

2. Compare with baseline:

```bash
uiq regression \
  --baseline <baseline.json> \
  --current <current.json> \
  --format json
```

3. Check Verification Criterion against regression result.

## Example

Before:

Contrast = 4.48
Rule = FAIL

After:

Contrast = 5.17
Rule = PASS

Regression:

FIXED_FAILURE

Verification:

VERIFIED

## Important

Do not claim VERIFIED based only on source-code changes.

Verification requires measured evidence.
