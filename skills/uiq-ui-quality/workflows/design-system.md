# UIQ Design System Workflow

## Purpose

Analyze whether rendered UI conforms to Design System definitions.

## Execution

```bash
uiq conformance \
  --url <URL> \
  --format json
```

## Analyze

- TOKEN_MATCH
- TOKEN_DEVIATION
- TOKEN_FRAGMENTATION
- COMPONENT_CONFORMANCE
- THEME_CONFORMANCE

## Token Trace

When available:

Element
→ Component Token
→ Semantic Token
→ Primitive Token
→ CSS Variable
→ Computed Value
→ Rendered Value

## Important

Token deviation does not automatically mean visual failure.

Example:

TOKEN_MATCH = FAIL
CONTRAST = PASS

Report both independently.

## Impact

If token impact is available, distinguish:

Potential Impact

from:

Observed Regression
