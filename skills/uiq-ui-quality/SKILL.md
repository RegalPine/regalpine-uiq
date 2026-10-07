---
name: uiq-ui-quality
description: >
  Quantitatively inspect, analyze, diagnose, and verify rendered UI quality using UIQ CLI.
  Covers measurement, metrics, rules, accessibility, color, typography, theme conformance,
  regression detection, and recommendation reports.
  Use when the user asks about UI quality, design conformance, accessibility checks,
  color contrast, typography issues, regression comparison, or wants a quality report.
---

# UIQ UI Quality Skill

## Identity

Skill ID: uiq-ui-quality
Version: 1.0.0

## Purpose

Use UIQ to quantitatively inspect, analyze, diagnose,
and verify rendered UI.

UIQ provides deterministic evidence for:

- Measurement
- Metric
- Rule
- Evaluation
- Finding
- Diagnostic
- Design System Conformance
- Regression
- Recommendation
- Verification

## Source of Truth

UIQ is the source of truth for deterministic UI quality results.

Do not independently calculate or override:

- metrics
- thresholds
- rule results
- evaluation states
- regression classifications

## Core Workflow

Resolve:

1. User intent
2. Target
3. Scope
4. Theme
5. Browser
6. Baseline if required

Then execute the corresponding UIQ CLI workflow.

Prefer JSON output.

## Workflows

### Inspect

Use for a specific element or component.

### Analyze

Use for general UI quality analysis.

### Accessibility

Use for accessibility-focused analysis.

### Color

Use for color-focused analysis.

### Typography

Use for typography-focused analysis.

### Design System

Use for Token / Component / Theme conformance.

### Visual Texture

Use for visual texture analysis across 7 dimensions
(Surface, Depth, Color, Typography, Spatial, Motion, Micro Detail).

58 Metrics, 58 Rules. Use `--texture full|core` or `--dimensions`.

See [Visual Texture Workflow](workflows/visual-texture.md) for details.

### Theme

Use for theme-specific analysis.

### Regression

Use for baseline/current comparison.

### Report

Use for quality assessment and improvement reports.

### Verify

Use after implementation changes.

### Auth

Use when the target URL requires login.

Handles authentication via playwright-cli skill,
then passes storageState to UIQ browser commands.

### SPA Navigation

Use when the target page requires clicking through
menus or interactions to reach (Single Page Applications).

Uses playwright-cli skill to automate navigation,
exports storageState + final URL,
then passes to UIQ CLI for analysis.

See [Auth Workflow](workflows/auth.md) for details.

## Evidence Rule

Recommendations must be traceable:

Recommendation
→ Finding
→ Evaluation
→ Metric
→ Measurement
→ Element

Do not invent evidence.

## State Rule

Keep these states distinct:

- PASS
- FAIL
- WARN
- NOT_APPLICABLE
- UNKNOWN
- ERROR

UNKNOWN is not FAIL.

NOT_APPLICABLE is not PASS.

## Severity Rule

Severity and evaluation state are independent.

Do not convert:

HIGH → FAIL

or:

LOW → PASS

without the actual evaluation state.

## Diagnostic Rule

Diagnostics explain Findings.

Diagnostics do not change Evaluation.

## Recommendation Rule

Recommendations explain what should be reviewed.

They do not automatically modify:

- source code
- CSS
- tokens
- themes
- components

## Verification Rule

Implementation is not verification.

Verification requires:

Remeasure
→ Evaluate
→ Regression
→ Verification

## Prohibited

Never:

- create an overall beauty score
- create an aesthetic score
- invent hidden thresholds
- invent metrics
- override UIQ results
- treat UNKNOWN as FAIL
- treat UNKNOWN as PASS
- invent root causes
- claim regression without comparison
- claim verification without remeasurement
- automatically modify UI
- automatically modify source code
- automatically modify design tokens

## Output Rule

When explaining results, preserve:

- scope
- state
- severity
- evidence
- affected subjects
- diagnostic
- recommendation
- verification

Use concise natural language around the structured UIQ result.
