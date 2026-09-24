# UIQ Theme Workflow

## Purpose

Analyze one or more UI themes.

## Execution

Analyze each theme independently.

Example:

```bash
uiq analyze \
  --url <URL> \
  --theme light \
  --format json
```

```bash
uiq analyze \
  --url <URL> \
  --theme dark \
  --format json
```

## Rule

Do not merge theme snapshots.

Each theme has its own:

- MeasurementSnapshot
- Metrics
- Evaluations
- Findings
- Diagnostics

## Comparison

Comparison may report factual differences.

Do not declare a theme "better" without an explicit rule or policy.
