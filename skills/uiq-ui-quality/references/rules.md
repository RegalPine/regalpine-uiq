# UIQ Rules

Rules provide explicit evaluation criteria.

## Initial Rules

ACCESSIBILITY.CONTRAST.WCAG_AA
ACCESSIBILITY.TARGET_SIZE.MINIMUM
TYPOGRAPHY.FONT_SIZE.MINIMUM
TYPOGRAPHY.LINE_HEIGHT.MINIMUM
SPACING.SCALE_CONFORMANCE
TOKEN.TOKEN_MATCH
TOKEN.COMPONENT_CONFORMANCE

## Rule Identity

Every rule requires:

id
version

## Rule Result

A Rule produces an Evaluation.

Possible states:

PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR

## Important

Metric:

"contrast = 4.48"

Rule:

"contrast >= 4.5"

Evaluation:

"FAIL"

Do not combine these concepts.
