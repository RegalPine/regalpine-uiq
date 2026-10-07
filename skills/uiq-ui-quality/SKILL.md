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

## CLI Path

UIQ CLI 已全局安装，直接使用 `uiq` 命令即可。
禁止使用 `where uiq`、`which uiq`、`npx uiq` 等探测命令。技能存在即代表 CLI 可用。

## Result Presentation

使用 `uiq report` 生成报告，禁止编写脚本（Python/Node/等）解析 JSON。

```bash
# 分析并保存产物
uiq analyze <target> --texture full --output analysis.json

# 生成报告（直接输出或保存文件）
uiq report analysis.json --format markdown
uiq report analysis.json --format html --output report.html
```

直接用 CLI 的 JSON 输出回答问题即可，不要写脚本解析。

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

Includes cross-component visual continuity detection when pages
use `data-uiq-component` attributes to mark component boundaries.
Detects token drift, visual breaks, color disharmony, and state
incoherence across components.

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
