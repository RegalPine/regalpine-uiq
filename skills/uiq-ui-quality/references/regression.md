# UIQ Regression

Regression compares two UIQ states.

## Input

Baseline

- Current

## Categories

PASS → FAIL
= NEW_FAILURE

FAIL → PASS
= FIXED_FAILURE

FAIL → FAIL
= PERSISTING_FAILURE

Metric changed while Rule remains unchanged
= CHANGED_RESULT

AVAILABLE → UNKNOWN
= NEW_UNKNOWN

UNKNOWN → AVAILABLE
= RESOLVED_UNKNOWN

## Identity

Match entities using stable UIQ Entity ID.

Never use array index.

## Regression != Impact Trace

Impact Trace:

potential impact

Regression:

observed change
