# UIQ Report Workflow

## Purpose

Generate a UI Design Quality Assessment and Improvement Recommendation Report.

## Execution

```bash
uiq report \
  --input <analysis.json> \
  --format markdown
```

Machine output:

```bash
uiq report \
  --input <analysis.json> \
  --format json
```

## Sections

1. Scope
2. Measurement Coverage
3. Quality Dimensions
4. Evaluation Distribution
5. Findings
6. Diagnostics
7. Design System Conformance
8. Theme Analysis
9. Regression
10. Improvement Recommendations
11. Verification Criteria
12. Reproducibility

## Quality Summary

Report counts:

- measured elements
- metrics
- evaluations
- PASS
- FAIL
- WARN
- UNKNOWN
- NOT_APPLICABLE
- ERROR
- findings

Do not convert counts into an overall quality score.

## Recommendation

Every recommendation must retain evidence references.

## Output

Preferred:

JSON

Human-facing:

Markdown or HTML
