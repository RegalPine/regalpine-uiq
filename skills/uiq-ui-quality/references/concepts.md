# UIQ Concepts

## Core Chain

Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding
→ Diagnostic

Extended Chain:

Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding
→ Diagnostic
→ Recommendation
→ Verification

## Measurement

Observed fact.

## Metric

Quantitative property derived from Measurements.

## Rule

Explicit evaluation criterion.

## Evaluation

Determines:

- PASS
- FAIL
- WARN
- NOT_APPLICABLE
- UNKNOWN
- ERROR

## Finding

Traceable problem record.

## Diagnostic

Evidence-based explanation.

## Recommendation

Suggested review or improvement action.

## Verification

Evidence that an implementation change satisfies the expected criterion.

## Design System

Token and component conformance is independent from visual/accessibility evaluation.

## Regression

Comparison of baseline and current UIQ results.

## Component Boundary

A DOM region explicitly marked with `data-uiq-component` attribute,
defining the scope of a visual component for cross-component analysis.

## Cross-Component Visual Continuity

Analysis of visual relationships between explicitly marked components.
Detects token drift, visual breaks, color disharmony, and state
incoherence across component boundaries.

Requires `data-uiq-component` attributes on page elements.
Without component markers, this analysis is skipped (graceful degradation).
