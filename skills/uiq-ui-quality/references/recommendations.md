# UIQ Recommendations

Recommendations are downstream outputs from Findings and Diagnostics.

## Types

REVIEW_MEASUREMENT
REVIEW_METRIC
REVIEW_RULE_CONFIGURATION
REVIEW_TOKEN
REVIEW_COMPONENT
REVIEW_THEME
REVIEW_LAYOUT
REVIEW_TYPOGRAPHY
REVIEW_COLOR
REVIEW_ACCESSIBILITY

## Structure

A recommendation should contain:

- What
- Why
- Where
- Evidence
- Impact
- Verification

## Examples

Contrast failure:

REVIEW_COLOR

Token deviation:

REVIEW_TOKEN

Component conformance failure:

REVIEW_COMPONENT

Theme-specific failure:

REVIEW_THEME

Unsupported measurement:

REVIEW_MEASUREMENT

## Prohibited

Recommendations must not automatically modify UI.
