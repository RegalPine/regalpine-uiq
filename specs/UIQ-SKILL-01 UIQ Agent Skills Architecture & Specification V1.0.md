# UIQ-SKILL-01
# UIQ Agent Skills Architecture & Specification V1.0

**Status:** Frozen Baseline  
**System:** UIQ — UI Design Quantification  
**Layer:** Agent Integration / Application Adapter  
**Version:** 1.0.0

---

## 1. Purpose

UIQ Agent Skills 将 UIQ 的确定性分析能力暴露给 AI Agent，使 Agent 能够：

- 分析真实 UI
- 执行 UI 质量检查
- 理解 Metric / Rule / Finding / Diagnostic
- 分析 Design Token / Theme Conformance
- 分析 Regression
- 生成质量评估报告
- 生成基于证据的改进建议
- 根据 Verification Criterion 协助重新验证

Skill 本身**不实现 UIQ 的核心计算能力**。

核心原则：

```text
AI Agent
   ↓
UIQ Skill
   ↓
UIQ CLI
   ↓
UIQ Runtime
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
Verification
```

---

# 2. Design Principles

## 2.1 UIQ is the source of deterministic truth

Skill 不得自行计算：

- Contrast
- OKLab
- OKLCH
- ΔL
- ΔC
- ΔH
- ΔE
- Geometry
- Typography Metrics
- Token Conformance
- Rule Evaluation
- Regression Classification

Skill 应调用 UIQ CLI。

---

## 2.2 AI does not override UIQ

允许：

```text
AI解释 UIQ 结果
AI组织报告
AI帮助定位问题
AI解释 Recommendation
AI指导开发者验证
```

禁止：

```text
AI修改 PASS → FAIL
AI修改 FAIL → PASS
AI覆盖 UNKNOWN
AI自行增加隐藏阈值
AI自行生成质量分数
AI声称视觉问题但没有证据
```

---

# 3. Architecture

```text
┌───────────────────────────────┐
│           AI Agent            │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          UIQ Skills            │
│                               │
│ Intent / Workflow / Semantics │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│            UIQ CLI             │
│                               │
│ inspect / analyze / report     │
│ conformance / regression      │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
   Playwright         Static Input
        │                │
        └───────┬────────┘
                ▼
┌───────────────────────────────┐
│          UIQ Runtime           │
│                               │
│ Measurement                   │
│ Metric                        │
│ Rule                          │
│ Evaluation                    │
│ Finding                       │
│ Diagnostic                    │
│ Conformance                   │
│ Regression                    │
│ Reporting                     │
└───────────────────────────────┘
```

---

# 4. Skill Position

Skill 属于：

```text
Agent Integration / Application Adapter
```

不是：

```text
Core
Metric
Rule
Diagnostic
Design System
```

因此：

```text
@uiq/core
@uiq/color
@uiq/metrics
@uiq/rules
...
        ↑
     UIQ CLI
        ↑
   UIQ Agent Skill
        ↑
      Agent
```

Skill 不反向进入 UIQ Core。

---

# 5. First Skill Strategy

V1.0 不建立大量独立 Skill。

首先定义一个统一入口：

```text
uiq-ui-quality
```

负责完整 UI Quality Engineering Workflow：

```text
Inspect
Analyze
Evaluate
Diagnose
Recommend
Report
Verify
Regression
```

后续只有在实际使用中出现明显边界时才拆分。

---

# 6. Skill Capability Model

```text
UIQ Skill
│
├── Discovery
│
├── Inspection
│
├── Measurement
│
├── Analysis
│
├── Evaluation
│
├── Diagnosis
│
├── Recommendation
│
├── Verification
│
├── Conformance
│
├── Regression
│
└── Reporting
```

---

# 7. Intent Model

Skill 将自然语言 Intent 映射到确定性的 UIQ Workflow。

## 7.1 Inspect

用户：

> 检查这个 Button。

执行：

```text
inspect
```

---

## 7.2 Quality Analysis

用户：

> 检查这个页面的 UI 质量。

执行：

```text
analyze
```

---

## 7.3 Accessibility

用户：

> 检查页面无障碍问题。

执行：

```text
analyze
→ ACCESSIBILITY rules
```

---

## 7.4 Color

用户：

> 分析页面颜色问题。

执行：

```text
analyze
→ COLOR metrics
→ COLOR rules
```

---

## 7.5 Typography

用户：

> 检查字体和排版。

执行：

```text
analyze
→ TYPOGRAPHY metrics
→ TYPOGRAPHY rules
```

---

## 7.6 Design System

用户：

> 检查页面有没有偏离设计系统。

执行：

```text
conformance
→ TOKEN
→ COMPONENT
→ THEME
```

---

## 7.7 Regression

用户：

> 检查这个 PR 有没有 UI 回归。

执行：

```text
regression
```

---

## 7.8 Report

用户：

> 给我生成 UI 质量评估和改进建议报告。

执行：

```text
analyze
→ diagnose
→ recommend
→ report
```

---

# 8. Skill Workflow

## 8.1 Standard Workflow

```text
User Intent
    ↓
Skill Intent Resolution
    ↓
Scope Resolution
    ↓
UIQ CLI
    ↓
Measurement
    ↓
Metrics
    ↓
Rules
    ↓
Evaluation
    ↓
Findings
    ↓
Diagnostics
    ↓
Recommendations
    ↓
Report
    ↓
Agent Explanation
```

---

# 9. Scope Resolution

Skill 必须首先确定分析范围。

支持：

```text
PROJECT
PAGE
REGION
COMPONENT
ELEMENT
THEME
```

例如：

```text
“检查登录页面”
```

解析为：

```text
Scope:
  page = login
```

例如：

```text
“检查这个 Button”
```

解析为：

```text
Scope:
  element = selected element
```

---

# 10. Browser Execution

对于真实 UI：

```text
UIQ Skill
    ↓
UIQ CLI
    ↓
Playwright
    ↓
Browser
    ↓
Rendered DOM
    ↓
@uiq/browser
```

Playwright 用于：

- 启动应用
- 访问 URL
- 设置 viewport
- 设置 theme
- 等待字体加载
- 稳定页面状态
- 捕获 DOM
- 执行 UIQ
- 多浏览器验证

支持：

```text
Chromium
Firefox
WebKit
```

---

# 11. Skill Input

Skill 输入不应该要求 Agent 理解 UIQ 全部内部结构。

推荐：

```ts
interface UIQSkillRequest {
  intent:
    | "inspect"
    | "analyze"
    | "conformance"
    | "regression"
    | "report"
    | "verify";

  target?: {
    url?: string;
    selector?: string;
    uiqId?: string;
    page?: string;
  };

  scope?: {
    dimensions?: string[];
    themes?: string[];
    browsers?: string[];
  };

  baseline?: string;

  output?: {
    format?: "json" | "markdown" | "html";
  };
}
```

---

# 12. Skill Output

Skill 不直接返回自然语言作为唯一结果。

必须优先获得结构化 UIQ Artifact：

```text
AnalysisResult
Finding[]
Diagnostic[]
Recommendation[]
VerificationCriterion[]
ConformanceReport
RegressionReport
UIQualityReport
```

然后 Agent 再进行自然语言解释。

---

# 13. Structured Result Contract

推荐 Skill 输出：

```json
{
  "status": "COMPLETED",
  "scope": {},
  "summary": {},
  "findings": [],
  "diagnostics": [],
  "recommendations": [],
  "verification": [],
  "artifacts": {
    "analysis": "...",
    "report": "..."
  }
}
```

状态：

```text
COMPLETED
PARTIAL
UNKNOWN
ERROR
```

---

# 14. Evidence Preservation

Skill 不得丢失 UIQ Evidence。

例如：

```text
Finding
 ↓
Evaluation
 ↓
MetricResult
 ↓
Measurement
 ↓
DOM
```

Skill 输出必须能够追溯：

```text
Recommendation
 ↓
Finding
 ↓
Rule
 ↓
Metric
 ↓
Measurement
 ↓
Element
```

---

# 15. Recommendation Handling

Skill 可以解释 Recommendation：

```text
Finding:
  CONTRAST FAIL

Diagnostic:
  foreground/background contrast insufficient

Recommendation:
  REVIEW_COLOR

Verification:
  ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
  expected = PASS
```

但不能自动变成：

```text
change color to #xxxxxx
```

除非未来单独建立明确授权的 Design Modification Skill。

V1.0 不提供自动修改。

---

# 16. AI Reasoning Boundary

允许：

```text
“该问题影响了 6 个 Button。”

“这些 Findings 都追溯到同一个 Semantic Token。”

“该 UNKNOWN 来源于当前浏览器测量器不支持复杂渐变背景的精确解析。”
```

不允许：

```text
“这个页面只有 72 分。”

“这个颜色不高级。”

“我认为这个颜色更漂亮。”

“虽然 UIQ FAIL，但我判断实际上没问题。”
```

---

# 17. Quality Assessment

Skill 可以生成：

```text
UI Quality Assessment
```

但不能生成未经定义的：

```text
Overall Quality Score
Beauty Score
Aesthetic Score
Design Excellence Score
```

报告应采用：

```text
Accessibility
  PASS / FAIL / WARN / UNKNOWN

Color
  PASS / FAIL / WARN / UNKNOWN

Typography
  PASS / FAIL / WARN / UNKNOWN

Geometry
  PASS / FAIL / WARN / UNKNOWN

Design System
  PASS / FAIL / WARN / UNKNOWN
```

---

# 18. Improvement Report

Skill 可以生成：

```text
UI Design Quality Assessment Report
+
UI Design Improvement Recommendation Report
```

结构：

```text
1. Scope
2. Measurement Coverage
3. Quality Dimensions
4. Evaluation Distribution
5. Findings
6. Diagnostic Analysis
7. Design System Conformance
8. Theme Analysis
9. Regression
10. Improvement Recommendations
11. Verification Criteria
12. Reproducibility
```

---

# 19. Regression Workflow

用户：

> 检查我的 PR 有没有 UI 回归。

Skill：

```text
Git / Baseline
      ↓
UIQ CLI
      ↓
Playwright
      ↓
Current Snapshot
      ↓
Regression
```

输出：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

Skill 可以解释：

```text
发现 2 个 NEW_FAILURE。

其中一个来自 Button Secondary。

原因：
Contrast Rule 从 PASS 变为 FAIL。

另一个：
Token Match 从 PASS 变为 FAIL。
```

---

# 20. Verification Workflow

Recommendation 产生：

```text
VerificationCriterion
```

例如：

```text
Rule:
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

Expected:
PASS
```

Skill 可以执行：

```text
Implementation
      ↓
Remeasure
      ↓
Evaluate
      ↓
Verify
```

状态：

```text
IMPLEMENTED
REMEASURED
VERIFIED
```

重要：

```text
IMPLEMENTED ≠ VERIFIED
```

---

# 21. Conformance Workflow

用户：

> 检查 UIQ 本身是否符合规范。

Skill：

```text
uiq conformance
```

输出：

```text
CORE
STANDARD
BROWSER
FULL
```

Skill 可以解释失败：

```text
Metric Golden failure
Rule Golden failure
Browser Conformance failure
Schema failure
Regression failure
```

---

# 22. CLI Contract

Skill 推荐只通过稳定 CLI Contract 调用 UIQ。

核心命令：

```bash
uiq inspect
uiq measure
uiq analyze
uiq evaluate
uiq diagnose
uiq conformance
uiq regression
uiq snapshot
uiq report
```

机器调用优先：

```bash
uiq analyze --format json
```

而不是解析 terminal 文本。

---

# 23. CLI JSON Contract

推荐：

```bash
uiq analyze \
  --url http://localhost:3000 \
  --format json
```

输出：

```json
{
  "schemaVersion": "1.0.0",
  "uiqVersion": "1.0.0",
  "snapshot": {},
  "metrics": [],
  "evaluations": [],
  "findings": [],
  "diagnostics": [],
  "recommendations": []
}
```

---

# 24. Skill Directory

推荐建立：

```text
skills/
└── uiq-ui-quality/
    ├── SKILL.md
    ├── references/
    │   ├── cli.md
    │   ├── concepts.md
    │   ├── metrics.md
    │   ├── rules.md
    │   ├── diagnostics.md
    │   ├── recommendations.md
    │   ├── conformance.md
    │   └── regression.md
    ├── workflows/
    │   ├── inspect.md
    │   ├── analyze.md
    │   ├── conformance.md
    │   ├── regression.md
    │   ├── report.md
    │   └── verify.md
    └── examples/
        ├── button.md
        ├── page.md
        └── regression.md
```

---

# 25. SKILL.md

建议第一版保持非常小：

```markdown
# UIQ UI Quality Skill

## Purpose

Use UIQ to quantitatively analyze rendered UI,
evaluate explicit quality rules, diagnose findings,
generate evidence-based recommendations, and verify fixes.

## Core Rule

Never replace UIQ measurements, metrics, evaluations,
or regression classifications with subjective AI judgment.

## Workflow

1. Resolve user intent.
2. Resolve target and scope.
3. Run the appropriate UIQ CLI command.
4. Prefer JSON output.
5. Inspect Findings and Diagnostics.
6. Trace evidence before explaining causes.
7. Generate or present Recommendations.
8. Preserve Verification Criteria.
9. Remeasure before claiming verification.

## Commands

- uiq inspect
- uiq measure
- uiq analyze
- uiq evaluate
- uiq diagnose
- uiq conformance
- uiq regression
- uiq snapshot
- uiq report

## Prohibited

- Beauty scores
- Aesthetic scores
- Hidden thresholds
- AI overrides of UIQ evaluation
- Unsupported root-cause claims
- Automatic UI modification
- Automatic token modification
- Automatic code modification
```

---

# 26. Future Skill Decomposition

V1.0：

```text
uiq-ui-quality
```

未来可以根据实际需求拆分：

```text
uiq-accessibility
uiq-design-system
uiq-regression
uiq-ui-reporting
```

但拆分条件必须是：

```text
明确的用户意图边界
+
独立 Workflow
+
独立 Reference
+
独立验证需求
```

而不是为了增加 Skill 数量。

---

# 27. Skill Security

Skill 不应该默认获得：

```text
write filesystem
modify source code
commit git
push git
modify tokens
modify theme
```

V1.0 默认：

```text
READ
ANALYZE
REPORT
VERIFY
```

修改属于未来显式授权能力。

---

# 28. Human-in-the-loop

对于：

```text
Recommendation
Implementation
Verification
Release Gate
```

Skill 应保持：

```text
AI发现
 ↓
AI解释
 ↓
AI建议
 ↓
Developer决定
 ↓
Developer修改
 ↓
UIQ验证
```

而不是：

```text
AI发现
 ↓
AI自动修改
 ↓
AI自行判定完成
```

---

# 29. Skill + Design System

完整链路：

```text
Design System
      ↓
OKLCH Palette
      ↓
Semantic Tokens
      ↓
Component Tokens
      ↓
Theme
      ↓
CSS Variables
      ↓
React / Radix
      ↓
Rendered DOM
      ↓
Playwright
      ↓
UIQ
      ↓
Findings
      ↓
Diagnostics
      ↓
Recommendations
```

因此 AI Agent 可以理解设计系统上下文，但 UIQ 仍然负责验证。

---

# 30. Skill + Playwright

推荐职责划分：

### Playwright

负责：

```text
Browser
Page
Viewport
Theme
DOM
Rendered State
Cross-browser
```

### UIQ

负责：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
Conformance
Regression
Report
```

### Skill

负责：

```text
Intent
Workflow
Interpretation
Explanation
Recommendation Presentation
Human Interaction
```

形成：

```text
Playwright = Browser Execution

UIQ = Deterministic Quality Engine

Skill = Agent Interaction Layer
```

---

# 31. V1.0 Closed Loop

最终形成：

```text
User
 ↓
AI Agent
 ↓
UIQ Skill
 ↓
UIQ CLI
 ↓
Playwright
 ↓
Real UI
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
Developer Fix
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

# 32. Architectural Freeze

UIQ Skill V1.0 不增加：

```text
AI Core Layer
AI Quality Engine
Aesthetic Engine
AI Metric Engine
AI Rule Engine
AI Recommendation Core
```

也不修改：

```text
@uiq/core
@uiq/color
@uiq/metrics
@uiq/rules
@uiq/diagnostic
@uiq/conformance
@uiq/regression
```

Skill 仅通过：

```text
CLI Contract
+
Structured JSON Artifacts
```

与 UIQ 集成。

---

# 33. Definition of Done

UIQ Skill V1.0 完成条件：

- [ ] Agent 可以识别 UIQ 分析 Intent
- [ ] 可以调用 `uiq inspect`
- [ ] 可以调用 `uiq analyze`
- [ ] 可以调用 `uiq conformance`
- [ ] 可以调用 `uiq regression`
- [ ] 可以调用 `uiq report`
- [ ] 优先使用 JSON Artifact
- [ ] 可以解释 Finding
- [ ] 可以追踪 Diagnostic Evidence
- [ ] 可以展示 Recommendation
- [ ] 可以展示 Verification Criterion
- [ ] 不覆盖 UIQ Evaluation
- [ ] 不自行计算 Metric
- [ ] 不生成 Beauty Score
- [ ] 不自动修改 UI
- [ ] 不自动修改 Token
- [ ] 不自动修改源代码
- [ ] 可以与 Playwright 配合
- [ ] 可以输出质量评估报告
- [ ] 可以输出改进建议报告
- [ ] 可以完成 Remeasure → Regression → Verification

---

# 34. Final Architecture

UIQ 最终形成四个明确的执行层次：

```text
┌────────────────────────────────────┐
│             AI Agent               │
│     意图 / 对话 / 解释 / 协作       │
└──────────────────┬─────────────────┘
                   │
┌──────────────────▼─────────────────┐
│            UIQ Skills              │
│      Agent Workflow Adapter        │
└──────────────────┬─────────────────┘
                   │
┌──────────────────▼─────────────────┐
│             UIQ CLI                │
│       Automation Interface         │
└──────────────────┬─────────────────┘
                   │
┌──────────────────▼─────────────────┐
│             UIQ Runtime            │
│ Measurement / Metric / Rule        │
│ Evaluation / Finding / Diagnostic │
│ Conformance / Regression           │
│ Reporting                          │
└────────────────────────────────────┘
                   ▲
                   │
              Playwright
                   │
          Chromium / Firefox / WebKit
```

## 核心定位

> **UIQ Runtime 是确定性质量引擎，CLI 是自动化入口，Playwright 是真实浏览器执行基础设施，Skill 是 AI Agent 的交互与编排接口。**

这四者职责明确分离，不互相侵入。

**UIQ V1.0 至此不需要继续增加核心架构层。**