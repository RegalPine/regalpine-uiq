# UIQ Regression Workflow

## Purpose

Determine what changed between baseline and current UI.

## Execution

```bash
uiq regression \
  --baseline <baseline.json> \
  --current <current.json> \
  --format json
```

## Categories

- NEW_FAILURE
- FIXED_FAILURE
- PERSISTING_FAILURE
- CHANGED_RESULT
- NEW_UNKNOWN
- RESOLVED_UNKNOWN

## Important

Regression compares UIQ results.

It does not rerun Rules itself.

## Response

Summarize:

- new failures
- fixed failures
- persisting failures
- changed results
- new unknowns
- resolved unknowns

Preserve subject identity.

Do not use array position as identity.
