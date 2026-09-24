# UIQ-SKILL-02
# UIQ UI Quality Skill Implementation Specification V1.0

**Status:** Implementation Baseline  
**Version:** 1.0.0  
**Skill ID:** `uiq-ui-quality`  
**System:** UIQ  
**Depends on:** UIQ CLI V1.0

---

# 1. 目标

将：

```text
UIQ-SKILL-01
UIQ Agent Skills Architecture & Specification
```

落地为实际 Skill。

目标是让 Agent 能够通过一个稳定 Skill：

```text
自然语言
   ↓
UIQ Skill
   ↓
UIQ CLI
   ↓
JSON Artifact
   ↓
Agent解释
```

完成：

- UI 检查
- UI 质量分析
- Accessibility 分析
- Color 分析
- Typography 分析
- Design System Conformance
- Theme 分析
- Regression 分析
- Improvement Recommendation
- Quality Report
- Verification

---

# 2. Skill 工程结构

推荐：

```text
skills/
└── uiq-ui-quality/
    ├── SKILL.md
    │
    ├── references/
    │   ├── cli.md
    │   ├── concepts.md
    │   ├── metrics.md
    │   ├── rules.md
    │   ├── findings.md
    │   ├── diagnostics.md
    │   ├── recommendations.md
    │   ├── conformance.md
    │   ├── regression.md
    │   └── reporting.md
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
    ├── examples/
    │   ├── button.md
    │   ├── page.md
    │   ├── design-system.md
    │   └── regression.md
    │
    └── schemas/
        ├── request.schema.json
        └── response.schema.json
```

---

# 3. SKILL.md

`SKILL.md` 是 Agent 首先读取的入口。

```markdown
# UIQ UI Quality

## Purpose

Use UIQ to quantitatively analyze rendered UI,
evaluate explicit rules, diagnose findings,
generate evidence-based recommendations,
and verify UI changes.

## Source of Truth

UIQ is the deterministic source of truth for:

- Measurement
- Metric
- Rule
- Evaluation
- Finding
- Diagnostic
- Conformance
- Regression

Never replace UIQ results with subjective judgment.

## Workflow

1. Resolve the user's intent.
2. Resolve target and scope.
3. Select the appropriate UIQ workflow.
4. Execute UIQ CLI.
5. Prefer JSON output.
6. Inspect evaluation results.
7. Inspect findings.
8. Trace diagnostics and evidence.
9. Present recommendations.
10. Preserve verification criteria.
11. Remeasure after implementation.
12. Use regression to verify changes.

## Available Workflows

- inspect
- analyze
- accessibility
- color
- typography
- design-system
- theme
- regression
- report
- verify

## CLI

Use:

- uiq inspect
- uiq measure
- uiq analyze
- uiq evaluate
- uiq conformance
- uiq regression
- uiq snapshot
- uiq report

## Rules

Never:

- invent metrics
- invent thresholds
- override UIQ evaluation
- convert UNKNOWN into PASS
- convert NOT_APPLICABLE into PASS
- invent root causes
- create beauty scores
- create aesthetic scores
- automatically modify UI
- automatically modify tokens
- automatically modify source code

## Evidence

Every recommendation should be traceable to:

Finding
→ Evaluation
→ Metric
→ Measurement
→ UI Element

## Verification

Implementation is not verification.

Verification requires:

Remeasure
→ Evaluate
→ Regression
→ Verification

## Output

Prefer structured JSON artifacts for machine processing.

Human-facing explanations should preserve:

- state
- severity
- evidence
- affected subjects
- diagnostic explanation
- recommendation
- verification criterion
```

---

# 4. Intent Resolution

Skill 首先把用户请求转换为 Intent。

```text
User Request
     ↓
Intent Resolver
     ↓
UIQ Workflow
```

Intent：

```ts
type UIQIntent =
  | "inspect"
  | "analyze"
  | "accessibility"
  | "color"
  | "typography"
  | "design-system"
  | "theme"
  | "regression"
  | "report"
  | "verify";
```

---

# 5. Intent Mapping

| 用户表达 | Intent |
|---|---|
| 检查这个 Button | inspect |
| 检查这个页面 | analyze |
| 检查无障碍 | accessibility |
| 检查颜色 | color |
| 检查字体 | typography |
| 检查设计系统 | design-system |
| 检查 Dark Theme | theme |
| 检查 PR 是否有 UI 回归 | regression |
| 生成质量报告 | report |
| 检查修改是否修复 | verify |

如果请求同时包含多个意图：

```text
“检查页面并给出改进建议”
```

执行：

```text
analyze
→ diagnose
→ recommendation
→ report
```

---

# 6. Target Resolution

支持：

```text
URL
Selector
UIQ ID
Page
Component
Element
```

例如：

```text
http://localhost:3000
```

或者：

```text
[data-uiq-id="login.submit"]
```

或者：

```text
#submit
```

优先级：

```text
UIQ ID
  ↓
Explicit Selector
  ↓
Page
  ↓
URL
```

---

# 7. Browser Workflow

真实 UI 分析：

```text
Skill
 ↓
CLI
 ↓
Playwright
 ↓
Browser
 ↓
Rendered DOM
 ↓
@uiq/browser
 ↓
MeasurementSnapshot
```

Playwright 负责：

- browser launch
- page navigation
- viewport
- theme
- font readiness
- animation stabilization
- DOM selection
- browser matrix

UIQ 负责：

- measurement interpretation
- metric calculation
- rule evaluation
- finding
- diagnostic
- recommendation
- regression

---

# 8. Standard Browser Configuration

默认：

```json
{
  "browser": "chromium",
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "theme": "light",
  "animations": "disabled",
  "waitForFonts": true
}
```

多浏览器：

```text
chromium
firefox
webkit
```

---

# 9. Analyze Workflow

用户：

> 检查这个页面的 UI 质量。

Skill 执行：

```text
1. Resolve URL
2. Launch browser
3. Stabilize page
4. Capture snapshot
5. Run metrics
6. Run rules
7. Generate findings
8. Generate diagnostics
9. Generate recommendations
10. Generate report
```

命令：

```bash
uiq analyze \
  --url http://localhost:3000 \
  --format json
```

---

# 10. Accessibility Workflow

```text
uiq analyze \
  --url http://localhost:3000 \
  --dimension accessibility \
  --format json
```

重点读取：

```text
ACCESSIBILITY.CONTRAST
ACCESSIBILITY.TARGET_SIZE
ACCESSIBILITY.FOCUS_VISIBILITY
ACCESSIBILITY.TEXT_LEGIBILITY
```

Skill 不自己判断 WCAG。

---

# 11. Color Workflow

```text
uiq analyze \
  --url http://localhost:3000 \
  --dimension color \
  --format json
```

读取：

```text
COLOR.SRGB
COLOR.OKLAB
COLOR.OKLCH
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
COLOR.CONTRAST
COLOR.GAMUT_DISTANCE
```

对于问题：

```text
COLOR
 ↓
L / C / H
 ↓
Contrast
 ↓
Gamut
 ↓
Alpha
 ↓
Context
```

Skill 只能解释 UIQ 已经产生的数据。

---

# 12. Typography Workflow

```bash
uiq analyze \
  --url http://localhost:3000 \
  --dimension typography \
  --format json
```

读取：

```text
FONT_SIZE
FONT_WEIGHT
LINE_HEIGHT
LETTER_SPACING
TEXT_MEASURE
SCALE_RATIO
DENSITY
```

---

# 13. Design System Workflow

```bash
uiq conformance \
  --url http://localhost:3000 \
  --format json
```

重点：

```text
TOKEN_MATCH
TOKEN_DEVIATION
TOKEN_FRAGMENTATION
COMPONENT_CONFORMANCE
THEME_CONFORMANCE
```

必须区分：

```text
TOKEN_DEVIATION
```

与：

```text
ACCESSIBILITY.FAIL
```

例如：

```text
TOKEN_MATCH = FAIL
CONTRAST = PASS
```

应解释为：

> UI 的实际值符合当前可访问性规则，但没有匹配设计系统规定的 Token。

而不是：

> UI 质量失败。

---

# 14. Theme Workflow

支持：

```text
light
dark
high-contrast
custom
```

每个 Theme 独立运行：

```text
Theme A
 ↓
Snapshot A
 ↓
Analysis A

Theme B
 ↓
Snapshot B
 ↓
Analysis B
```

禁止将多个 Theme 混合成一个结果。

---

# 15. Regression Workflow

用户：

> 检查这个 PR 有没有 UI 回归。

Skill：

```text
Baseline
   ↓
Current
   ↓
uiq regression
   ↓
RegressionReport
```

命令：

```bash
uiq regression \
  --baseline baseline.json \
  --current current.json \
  --format json
```

读取：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

---

# 16. Verification Workflow

用户：

> 我修复了刚才的问题，帮我确认一下。

Skill 不应该直接回答“已修复”。

必须：

```text
1. Remeasure
2. Evaluate
3. Compare
4. Regression
5. Verify
```

例如：

```text
Before:
Contrast = 4.48
Rule = FAIL

After:
Contrast = 5.17
Rule = PASS
```

Regression：

```text
FIXED_FAILURE
```

Verification：

```text
VERIFIED
```

---

# 17. Recommendation Workflow

Recommendation 必须来自：

```text
Finding
+
Diagnostic
+
Evidence
```

例如：

```text
Finding:
ACCESSIBILITY.CONTRAST.WCAG_AA = FAIL

Diagnostic:
foreground/background contrast insufficient

Token Trace:
Button → Semantic → Primitive
```

产生：

```text
REVIEW_COLOR
```

或者：

```text
REVIEW_TOKEN
```

而不是：

```text
change color to #2563EB
```

---

# 18. Recommendation Explanation

Skill 输出推荐时应采用：

```text
What
Why
Where
Evidence
Impact
Verification
```

示例：

```text
问题：
Button 文本与背景的对比度低于当前规则要求。

位置：
login.submit

证据：
Contrast = 4.48
Rule = ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
State = FAIL

建议：
检查该 Button 的 Semantic/Component Color Token 映射。

影响：
可能影响该 Component 的其他实例。

验证：
重新测量后应满足
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0 = PASS
```

---

# 19. Report Workflow

用户：

> 给我一份完整的 UI 设计质量评估报告。

Skill：

```bash
uiq report \
  --input analysis.json \
  --format markdown
```

报告：

```text
1. Scope
2. Measurement Coverage
3. Quality Dimensions
4. Evaluation Distribution
5. Findings
6. Diagnostics
7. Design System Conformance
8. Theme Analysis
9. Regression
10. Recommendations
11. Verification
12. Reproducibility
```

---

# 20. CLI JSON Contract

Skill 不应该依赖 CLI 的 terminal 文本。

所有机器调用优先：

```bash
--format json
```

统一响应：

```json
{
  "schemaVersion": "1.0.0",
  "uiqVersion": "1.0.0",
  "status": "COMPLETED",
  "scope": {},
  "snapshot": {},
  "metrics": [],
  "evaluations": [],
  "findings": [],
  "diagnostics": [],
  "recommendations": [],
  "verification": [],
  "conformance": null,
  "regression": null,
  "report": null
}
```

---

# 21. Response Status

```text
COMPLETED
PARTIAL
UNKNOWN
ERROR
```

含义：

### COMPLETED

完整分析完成。

### PARTIAL

部分范围完成。

例如：

```text
Light = COMPLETED
Dark = ERROR
```

### UNKNOWN

无法获得可靠证据。

例如：

```text
复杂 gradient
```

### ERROR

执行错误。

---

# 22. Finding Handling

Skill 必须优先读取：

```text
state
severity
subject
rule
metric
evidence
```

例如：

```json
{
  "state": "FAIL",
  "severity": "HIGH",
  "rule": {
    "id": "ACCESSIBILITY.CONTRAST.WCAG_AA",
    "version": "1.0.0"
  }
}
```

Skill 不得把：

```text
HIGH
```

解释成：

```text
页面很差
```

只能解释为：

> 当前 Rule 将该问题定义为 HIGH Severity。

---

# 23. Diagnostic Handling

Diagnostic 是解释，不是第二套评价系统。

```text
Finding
 ↓
Diagnostic
```

Skill 可以：

```text
解释 Diagnostic
寻找 Evidence Trace
组织多个 Diagnostic
```

不能：

```text
修改 Evaluation
增加隐藏 Cause
```

---

# 24. Unknown Handling

例如：

```text
background:
linear-gradient(...)
```

如果当前 Browser Adapter 无法精确解析：

```text
Measurement = UNKNOWN
Metric = UNKNOWN
Evaluation = UNKNOWN
```

Skill 应输出：

> 当前分析无法获得可靠的背景颜色证据，因此该规则结果为 UNKNOWN，而不是 FAIL。

---

# 25. Token Trace

当存在 Design System Adapter 时：

```text
Element
 ↓
Component Token
 ↓
Semantic Token
 ↓
Primitive Token
 ↓
Resolved CSS
 ↓
Computed Value
 ↓
Rendered Value
```

Skill 可以利用这条链回答：

> 为什么这个 Button 的颜色与设计系统不一致？

---

# 26. Impact Trace

Skill 可以解释潜在影响：

```text
Primitive Token
 ↓
Semantic Token
 ↓
Component Token
 ↓
42 Elements
 ↓
3 Components
 ↓
2 Themes
```

但：

```text
Impact Trace
```

不等于：

```text
Observed Regression
```

只有实际重新运行 Regression 才能确认回归。

---

# 27. Multi-Theme Analysis

例如：

```text
Light
  PASS = 31
  FAIL = 2

Dark
  PASS = 28
  FAIL = 5
```

Skill 可以报告事实。

不能说：

```text
Dark 更差
```

除非有明确的 Rule / Policy 定义并引用其结果。

---

# 28. Multi-Browser Analysis

例如：

```text
Chromium
  PASS

Firefox
  PASS

WebKit
  UNKNOWN
```

Skill 应解释：

> WebKit 当前存在测量覆盖不足。

不能直接认为：

> WebKit UI 有问题。

---

# 29. AI Explanation Contract

Agent 的自然语言解释应遵循：

```text
Fact
 ↓
Evidence
 ↓
Interpretation
 ↓
Recommendation
 ↓
Verification
```

而不是：

```text
AI Opinion
 ↓
Conclusion
```

---

# 30. Skill Safety Boundary

默认只允许：

```text
READ
MEASURE
ANALYZE
DIAGNOSE
RECOMMEND
REPORT
VERIFY
```

不允许：

```text
WRITE
MODIFY
COMMIT
PUSH
DEPLOY
```

除非未来建立独立、明确授权的修改 Skill。

---

# 31. Future Modification Skill

未来可以独立建立：

```text
uiq-ui-remediation
```

但它不能直接成为：

```text
uiq-ui-quality
```

的一部分。

架构：

```text
uiq-ui-quality
       │
       ▼
Recommendation
       │
       ▼
Human Approval
       │
       ▼
uiq-ui-remediation
       │
       ▼
Code / Token / Theme
       │
       ▼
UIQ Verification
```

这样可以保持：

```text
Analysis ≠ Modification
```

---

# 32. Skill 与 MCP / Tool 的关系

Skill 本身不需要成为 UIQ Runtime。

推荐：

```text
Skill
  ↓
CLI
```

如果未来 Agent Runtime 支持工具调用，也可以：

```text
Skill
  ↓
Tool Adapter
  ↓
UIQ CLI
```

或者：

```text
Skill
  ↓
UIQ Tool
  ↓
UIQ Runtime
```

但两者必须共享同一个 UIQ Contract。

---

# 33. Contract Versioning

Skill 必须记录：

```text
skillVersion
uiqVersion
cliVersion
schemaVersion
metricVersions
ruleVersions
```

例如：

```json
{
  "skillVersion": "1.0.0",
  "uiqVersion": "1.0.0",
  "cliVersion": "1.0.0",
  "schemaVersion": "1.0.0"
}
```

禁止：

```text
latest
```

作为可重复分析的版本引用。

---

# 34. Reproducibility

完整分析必须能够追溯：

```text
URL
+
Browser
+
Viewport
+
Theme
+
MeasurementSnapshot
+
Metric Versions
+
Rule Versions
+
Rule Configuration
+
UIQ Version
+
CLI Version
+
Skill Version
```

因此同一个 Skill Workflow 可以重复运行。

---

# 35. Skill Tests

Skill 本身也必须测试。

```text
S1 Intent Test
S2 Workflow Test
S3 CLI Invocation Test
S4 JSON Contract Test
S5 Evidence Preservation Test
S6 Unknown Handling Test
S7 Recommendation Trace Test
S8 Verification Test
S9 Regression Test
S10 Security Boundary Test
```

---

# 36. Golden Skill Scenarios

## S-GOLDEN-001

```text
Button
#777
#fff
```

期望：

```text
Contrast ≈ 4.48
Rule = FAIL
Finding = generated
Recommendation = REVIEW_COLOR
```

---

## S-GOLDEN-002

修改：

```text
#fff
#2563eb
```

期望：

```text
Contrast ≈ 5.17
Rule = PASS
Regression = FIXED_FAILURE
Verification = VERIFIED
```

---

## S-GOLDEN-003

复杂 Gradient：

```text
background:
linear-gradient(...)
```

期望：

```text
Measurement = UNKNOWN
Evaluation = UNKNOWN
```

---

## S-GOLDEN-004

Token Deviation：

```text
TOKEN_MATCH = FAIL
CONTRAST = PASS
```

期望：

```text
两者独立报告
```

---

# 37. End-to-End Example

用户：

> 检查我的登录页，找出 UI 问题并给出改进建议。

Skill：

```text
Resolve Intent
      ↓
ANALYZE
      ↓
Playwright
      ↓
Login Page
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
      ↓
Recommendation
      ↓
Report
```

Agent 最终得到：

```text
分析范围：
Login Page

测量元素：
37

Rule Evaluations：
124

PASS：
106

FAIL：
11

UNKNOWN：
7

主要 Findings：
- 4 Accessibility
- 3 Typography
- 2 Token Deviation
- 2 Layout

主要 Recommendation：
- REVIEW_COLOR
- REVIEW_TYPOGRAPHY
- REVIEW_TOKEN
- REVIEW_LAYOUT
```

注意：

```text
11 FAIL
```

只是事实统计。

不是：

```text
质量 = 91%
```

---

# 38. Complete Agent Loop

```text
┌───────────────────────┐
│       User            │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│     AI Agent          │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│   UIQ UI Quality      │
│       Skill            │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│       UIQ CLI         │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│      Playwright       │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│      Real UI          │
└──────────┬────────────┘
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
           ↓
 Recommendation
           ↓
 Developer
           ↓
 Remeasure
           ↓
 Regression
           ↓
 Verification
           ↓
 Report
```

---

# 39. V1.0 Definition of Done

Skill V1.0 必须满足：

- [ ] `SKILL.md` 完成
- [ ] Intent Resolution 完成
- [ ] Inspect Workflow
- [ ] Analyze Workflow
- [ ] Accessibility Workflow
- [ ] Color Workflow
- [ ] Typography Workflow
- [ ] Design System Workflow
- [ ] Theme Workflow
- [ ] Regression Workflow
- [ ] Report Workflow
- [ ] Verification Workflow
- [ ] CLI JSON Contract
- [ ] Evidence Preservation
- [ ] Unknown Handling
- [ ] Recommendation Trace
- [ ] Verification Trace
- [ ] Playwright Integration
- [ ] Multi-browser support
- [ ] Multi-theme support
- [ ] Golden Tests
- [ ] Security Boundary
- [ ] Versioned Artifacts
- [ ] Reproducibility

---

# 40. Final Boundary

最终职责：

```text
Playwright
    = Browser Execution

UIQ Runtime
    = Deterministic UI Quality Engine

UIQ CLI
    = Automation Interface

UIQ Skill
    = Agent Workflow Interface

AI Agent
    = Intent / Explanation / Collaboration

Developer
    = Implementation Decision
```

最终闭环：

```text
User
 ↓
Agent
 ↓
Skill
 ↓
CLI
 ↓
Playwright
 ↓
UIQ
 ↓
Evidence
 ↓
Recommendation
 ↓
Developer
 ↓
Remeasure
 ↓
Regression
 ↓
Verification
```

**UIQ-SKILL-02 完成后，Skill 已经从“概念设计”进入“可实现的工程契约”。**