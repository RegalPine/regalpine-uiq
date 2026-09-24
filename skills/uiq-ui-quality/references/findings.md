# UIQ Findings

A Finding is a traceable issue record.

## Lifecycle

DETECTED
→ DIAGNOSED
→ RESOLVED
→ VERIFIED

## Finding Types

VALUE_VIOLATION
ACCESSIBILITY
TOKEN_DEVIATION
COMPONENT_DEVIATION
THEME_DEVIATION
LAYOUT_RELATIONSHIP
TYPOGRAPHY
COLOR
UNKNOWN_CAUSE
EXECUTION_ERROR

## Finding Identity

Finding identity should remain stable across report generation.

## Evidence

A Finding should retain references to:

- subject
- evaluation
- metric
- measurement
- rule
- token
- DOM

## Aggregation

Repeated Findings may be grouped.

Grouping must not delete the original Findings.
