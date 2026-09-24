# UIQ-SKILL-03
# UIQ UI Quality Skill Package V1.0

**Version:** 1.0.0  
**Skill ID:** `uiq-ui-quality`  
**Status:** Implementation Ready

---

# 1. Package Structure

最终目录：

```text
skills/
└── uiq-ui-quality/
    ├── SKILL.md
    │
    ├── workflows/
    │   ├── inspect.md
    │   ├── analyze.md
    │   ├── accessibility.md
    │   ├── color.md
    │   ├── typography.md
    │   ├── design-system.md
    │   ├── theme.md
    │   ├── regression.md
    │   ├── report.md
    │   └── verify.md
    │
    └── references/
        ├── concepts.md
        ├── cli.md
        ├── metrics.md
        ├── rules.md
        ├── findings.md
        ├── diagnostics.md
        ├── recommendations.md
        ├── conformance.md
        └── regression.md
```

V1.0 **不再增加其他 Skill 文件类型**。

---

# 2. SKILL.md

```markdown
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

### Theme

Use for theme-specific analysis.

### Regression

Use for baseline/current comparison.

### Report

Use for quality assessment and improvement reports.

### Verify

Use after implementation changes.

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
```

---

# 3. Workflow: Inspect

`workflows/inspect.md`

```markdown
# UIQ Inspect Workflow

## Purpose

Inspect a specific UI element or component.

## Input

Required:

- URL or active browser page

Optional:

- selector
- data-uiq-id
- component identifier

## Execution

Run:

uiq inspect --format json

If URL is provided:

uiq inspect \
  --url <URL> \
  --format json

If selector is provided:

uiq inspect \
  --url <URL> \
  --selector "<selector>" \
  --format json

## Result

Inspect:

1. Measurement
2. Metrics
3. Rules
4. Findings
5. Diagnostics
6. Tokens
7. Theme
8. Trace

## Response

Summarize:

- selected element
- important measurements
- failed rules
- findings
- diagnostic causes
- recommendations

Do not create subjective quality judgments.

## Evidence

Preserve the UIQ evidence chain.
```

---

# 4. Workflow: Analyze

`workflows/analyze.md`

```markdown
# UIQ Analyze Workflow

## Purpose

Perform general UI quality analysis.

## Execution

uiq analyze \
  --url <URL> \
  --format json

## Optional Scope

Dimensions:

- accessibility
- color
- typography
- geometry
- spacing
- layout
- hierarchy
- design-system

Themes may be analyzed independently.

## Processing

Read:

- summary
- evaluation distribution
- findings
- diagnostics
- recommendations

## Response

Report factual results.

Example:

Accessibility:
- PASS: 42
- FAIL: 3
- UNKNOWN: 1

Color:
- PASS: 58
- FAIL: 2

Do not convert these values into an overall score.

## Recommendation

Only present recommendations supported by Findings and Diagnostics.
```

---

# 5. Workflow: Accessibility

`workflows/accessibility.md`

```markdown
# UIQ Accessibility Workflow

## Purpose

Analyze accessibility-related UI rules.

## Execution

uiq analyze \
  --url <URL> \
  --dimension accessibility \
  --format json

## Metrics

Relevant UIQ metrics may include:

- CONTRAST
- TARGET_SIZE
- FOCUS_VISIBILITY
- TEXT_LEGIBILITY

## Rules

Use the exact rule ID and version returned by UIQ.

Do not independently reproduce accessibility thresholds.

## Output

For each failure:

Rule
→ Metric
→ Value
→ Threshold
→ Finding
→ Diagnostic
→ Recommendation
→ Verification

## Unknown

If measurement is unavailable:

Evaluation = UNKNOWN

Do not reinterpret it as FAIL.
```

---

# 6. Workflow: Color

`workflows/color.md`

```markdown
# UIQ Color Workflow

## Purpose

Analyze UI color using UIQ color metrics.

## Execution

uiq analyze \
  --url <URL> \
  --dimension color \
  --format json

## Relevant Metrics

- COLOR.SRGB
- COLOR.OKLAB
- COLOR.OKLCH
- COLOR.LIGHTNESS
- COLOR.CHROMA
- COLOR.HUE
- COLOR.CONTRAST
- COLOR.GAMUT_DISTANCE

## Interpretation

Use measured values.

When explaining color differences, distinguish:

- Lightness
- Chroma
- Hue
- Contrast
- Gamut
- Alpha
- Context

Do not use "dirty color" as an independent metric.

## Important

Contrast is not color difference.

OKLCH distance must not automatically be called Delta E.

## Recommendation

If a color-related rule fails, present the relevant token,
component, theme, or element trace before recommending review.
```

---

# 7. Workflow: Typography

`workflows/typography.md`

```markdown
# UIQ Typography Workflow

## Purpose

Analyze typography.

## Execution

uiq analyze \
  --url <URL> \
  --dimension typography \
  --format json

## Metrics

- FONT_SIZE
- FONT_WEIGHT
- LINE_HEIGHT
- LETTER_SPACING
- TEXT_MEASURE
- SCALE_RATIO
- DENSITY

## Output

For each issue:

Element
→ Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding

## Important

Do not assume that a larger or smaller value is better.

The Rule defines conformance.

Variable font weights should be preserved as measured.
```

---

# 8. Workflow: Design System

`workflows/design-system.md`

```markdown
# UIQ Design System Workflow

## Purpose

Analyze whether rendered UI conforms to Design System definitions.

## Execution

uiq conformance \
  --url <URL> \
  --format json

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
```

---

# 9. Workflow: Theme

`workflows/theme.md`

```markdown
# UIQ Theme Workflow

## Purpose

Analyze one or more UI themes.

## Execution

Analyze each theme independently.

Example:

uiq analyze \
  --url <URL> \
  --theme light \
  --format json

uiq analyze \
  --url <URL> \
  --theme dark \
  --format json

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
```

---

# 10. Workflow: Regression

`workflows/regression.md`

```markdown
# UIQ Regression Workflow

## Purpose

Determine what changed between baseline and current UI.

## Execution

uiq regression \
  --baseline <baseline.json> \
  --current <current.json> \
  --format json

## Categories

- NEW_FAILURE
- FIXED_FAILURE
- PERSISTING_FAILURE
- CHANGED_RESULT
- NEW_UNKNOWN
- RESOLVED_UNKNOWN

## Important

Regression compares UIQ results.

It does not rerun Rules itself.

## Response

Summarize:

- new failures
- fixed failures
- persisting failures
- changed results
- new unknowns
- resolved unknowns

Preserve subject identity.

Do not use array position as identity.
```

---

# 11. Workflow: Report

`workflows/report.md`

```markdown
# UIQ Report Workflow

## Purpose

Generate a UI Design Quality Assessment and Improvement Recommendation Report.

## Execution

uiq report \
  --input <analysis.json> \
  --format markdown

Machine output:

uiq report \
  --input <analysis.json> \
  --format json

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
```

---

# 12. Workflow: Verify

`workflows/verify.md`

```markdown
# UIQ Verification Workflow

## Purpose

Verify that an implementation change actually resolves a UI issue.

## Preconditions

There must be:

- previous Finding
- Recommendation
- Verification Criterion

## Execution

1. Run measurement again.
2. Recalculate Metrics.
3. Evaluate Rules.
4. Compare baseline/current.
5. Run Regression.
6. Check Verification Criterion.

## Example

Before:

Contrast = 4.48
Rule = FAIL

After:

Contrast = 5.17
Rule = PASS

Regression:

FIXED_FAILURE

Verification:

VERIFIED

## Important

Do not claim VERIFIED based only on source-code changes.

Verification requires measured evidence.
```

---

# 13. Reference: Concepts

`references/concepts.md`

```markdown
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
```

---

# 14. Reference: CLI

`references/cli.md`

```markdown
# UIQ CLI Reference

## Commands

uiq inspect
uiq measure
uiq analyze
uiq evaluate
uiq conformance
uiq regression
uiq snapshot
uiq report

## Machine Output

Always prefer:

--format json

## Human Output

Supported:

--format terminal
--format markdown
--format html

## Version

Reproducible analysis must use explicit versions.

Do not use:

latest
```

---

# 15. Reference: Metrics

`references/metrics.md`

```markdown
# UIQ Metrics

## Color

COLOR.SRGB
COLOR.XYZ
COLOR.OKLAB
COLOR.OKLCH
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
COLOR.DELTA_L
COLOR.DELTA_C
COLOR.DELTA_H
COLOR.DELTA_E
COLOR.CONTRAST
COLOR.GAMUT_DISTANCE

## Geometry

WIDTH
HEIGHT
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP

## Typography

FONT_SIZE
FONT_WEIGHT
LINE_HEIGHT
LETTER_SPACING
TEXT_MEASURE
SCALE_RATIO
DENSITY

## Spacing

MARGIN
PADDING
GAP
DISTANCE
TOKEN_DEVIATION
SCALE_CONFORMANCE

## Layout

ALIGNMENT
GRID_ALIGNMENT
DENSITY
SYMMETRY

## Hierarchy

SEMANTIC_IMPORTANCE
VISUAL_SALIENCE
SALIENCE_DIFFERENCE

## Accessibility

CONTRAST
TARGET_SIZE
FOCUS_VISIBILITY
TEXT_LEGIBILITY

## Conformance

TOKEN_MATCH
TOKEN_DEVIATION
TOKEN_FRAGMENTATION
COMPONENT_CONFORMANCE

## Rule

Metrics do not determine good/bad by themselves.
```

---

# 16. Reference: Rules

`references/rules.md`

```markdown
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
```

---

# 17. Reference: Findings

`references/findings.md`

```markdown
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
```

---

# 18. Reference: Diagnostics

`references/diagnostics.md`

```markdown
# UIQ Diagnostics

Diagnostics explain Findings.

## Principle

Diagnostic != Evaluation

Diagnostic != Recommendation

## Evidence Graph

DOM
↓
Measurement
↓
Metric
↓
Rule
↓
Evaluation
↓
Finding
↓
Diagnostic

## Root Cause

Possible causes:

- MEASUREMENT
- METRIC
- TOKEN
- COMPONENT
- THEME
- CONFIGURATION
- UNKNOWN

## Confidence

- DIRECT
- SUPPORTED
- INFERRED
- UNKNOWN

Do not invent a root cause when evidence is insufficient.
```

---

# 19. Reference: Recommendations

`references/recommendations.md`

```markdown
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
```

---

# 20. Reference: Conformance

`references/conformance.md`

```markdown
# UIQ Conformance

## Levels

CORE
STANDARD
BROWSER
FULL

## CORE

- Core contracts
- Metric calculations
- Rule evaluation
- Schema
- Fingerprint

## STANDARD

CORE plus:

- Metric Golden
- Rule Golden
- Token Golden
- Diagnostic Golden

## BROWSER

STANDARD plus:

- Chromium
- Firefox
- WebKit

## FULL

BROWSER plus:

- Theme
- Component
- Regression
- E2E

## Principle

Conformance verifies implementation against UIQ contracts.
```

---

# 21. Reference: Regression

`references/regression.md`

```markdown
# UIQ Regression

Regression compares two UIQ states.

## Input

Baseline
+
Current

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
```

---

# 22. Agent Response Template

对于一般分析请求，推荐：

```text
分析范围
────────
页面：
主题：
浏览器：

结果摘要
────────
PASS：
FAIL：
WARN：
UNKNOWN：

主要问题
────────
1. [Severity] [Finding]
   Rule：
   Evidence：
   Diagnostic：

2. ...

改进建议
────────
1. [Recommendation]
   原因：
   影响：
   验证：

验证
────────
Verification Criterion：
```

---

# 23. Example: Button

用户：

> 检查登录按钮。

Skill：

```text
uiq inspect
```

UIQ 返回：

```text
Foreground = #777777
Background = #FFFFFF
Contrast = 4.48

Rule:
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

Evaluation:
FAIL

Finding:
ACCESSIBILITY

Diagnostic:
foreground/background contrast insufficient

Recommendation:
REVIEW_COLOR
```

Agent 应解释为：

```text
登录按钮存在一个无障碍对比度问题。

对比度：
4.48

当前规则：
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

结果：
FAIL

建议检查：
该 Button 的颜色 Token / Component Token 映射。

验证：
修改后重新测量，并确认该 Rule 从 FAIL 变为 PASS。
```

---

# 24. Example: Design System Deviation

```text
TOKEN_MATCH = FAIL
CONTRAST = PASS
```

正确解释：

```text
该元素的颜色满足当前对比度规则，
但实际值没有匹配设计系统 Token。

因此这是 Design System Conformance 问题，
而不是当前对比度规则失败。
```

---

# 25. Example: UNKNOWN

```text
background:
linear-gradient(...)
```

UIQ：

```text
Measurement = UNKNOWN
Metric = UNKNOWN
Evaluation = UNKNOWN
```

Agent：

```text
当前无法获得可靠的背景颜色测量，
因此该规则结果为 UNKNOWN。

这不是 FAIL，
也不能据此判断页面存在颜色问题。
```

---

# 26. Example: Regression

```text
Baseline:

Contrast = 5.17
Rule = PASS

Current:

Contrast = 4.48
Rule = FAIL
```

UIQ：

```text
NEW_FAILURE
```

Agent：

```text
检测到一个 NEW_FAILURE。

该 Button 的对比度从 5.17
下降到 4.48。

对应规则：

ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

当前状态：

FAIL
```

---

# 27. Example: Verification

```text
Before:
FAIL

After:
PASS

Regression:
FIXED_FAILURE

Verification:
VERIFIED
```

Agent：

```text
该问题已经通过 UIQ 重新测量和回归验证。

原状态：
FAIL

当前状态：
PASS

Regression：
FIXED_FAILURE

Verification：
VERIFIED
```

---

# 28. Skill Runtime Contract

Skill 与 UIQ CLI 的唯一稳定接口：

```text
Skill
 ↓
CLI
 ↓
JSON
```

不允许 Skill：

```text
↓
直接访问 UIQ 内部数据库
↓
直接修改 UIQ Runtime
↓
重新实现 Metric
↓
重新实现 Rule
```

---

# 29. Skill Runtime State

Skill 自身只维护：

```ts
interface SkillContext {
  intent: UIQIntent;
  target?: Target;
  scope?: Scope;
  theme?: string;
  browser?: string;
  baseline?: string;
}
```

UIQ 负责：

```text
MeasurementSnapshot
MetricResult
EvaluationResult
Finding
Diagnostic
Recommendation
RegressionReport
```

---

# 30. Security Boundary

默认权限：

```text
READ
EXECUTE UIQ
READ ARTIFACT
GENERATE REPORT
```

默认禁止：

```text
WRITE SOURCE
WRITE CSS
WRITE TOKEN
WRITE THEME
GIT COMMIT
GIT PUSH
DEPLOY
```

---

# 31. Skill Package Versioning

Skill：

```text
uiq-ui-quality@1.0.0
```

UIQ：

```text
UIQ@1.0.0
```

CLI：

```text
uiq-cli@1.0.0
```

Schema：

```text
UIQ-SCHEMA@1.0.0
```

所有结果必须保留版本信息。

---

# 32. V1.0 Architecture Freeze

Skill V1.0 至此冻结：

```text
Agent
 ↓
Skill
 ↓
CLI
 ↓
Playwright / Static Input
 ↓
UIQ Runtime
 ↓
JSON Artifact
 ↓
Agent Explanation
```

不增加：

```text
AI Quality Engine
AI Aesthetic Engine
AI Metric Engine
AI Rule Engine
AI Design Engine
```

---

# 33. Definition of Done

### Skill

- [x] SKILL.md
- [x] Intent Model
- [x] Workflow Model
- [x] Evidence Model
- [x] Safety Boundary

### Workflows

- [x] Inspect
- [x] Analyze
- [x] Accessibility
- [x] Color
- [x] Typography
- [x] Design System
- [x] Theme
- [x] Regression
- [x] Report
- [x] Verify

### References

- [x] Concepts
- [x] CLI
- [x] Metrics
- [x] Rules
- [x] Findings
- [x] Diagnostics
- [x] Recommendations
- [x] Conformance
- [x] Regression

### Runtime

- [x] CLI JSON
- [x] Playwright compatibility
- [x] Evidence preservation
- [x] Version preservation
- [x] Deterministic interpretation
- [x] No automatic modification

---

# 34. Final Position

UIQ Skill 不应该成为另一个 UI 设计系统。

它的定位是：

```text
UIQ Runtime
    = 测量和判断

UIQ CLI
    = 自动化执行

Playwright
    = 真实浏览器

UIQ Skill
    = Agent 工作流

AI Agent
    = 理解、解释、协作

Developer
    = 修改和决策
```

最终形成：

```text
                AI Agent
                    │
                    ▼
             UIQ UI Quality
                 Skill
                    │
                    ▼
                UIQ CLI
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Playwright           Static
          │                   │
          └─────────┬─────────┘
                    ▼
                UIQ Runtime
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   Measurement    Metric       Rule
        │           │           │
        └───────────┼───────────┘
                    ▼
              Evaluation
                    │
                 Finding
                    │
               Diagnostic
                    │
             Recommendation
                    │
               Developer
                    │
                Remeasure
                    │
                Regression
                    │
               Verification
```

**至此，`uiq-ui-quality` Skill V1.0 已经可以作为 UIQ 的 Agent 接入规范，不需要继续增加 Skill 架构层。**