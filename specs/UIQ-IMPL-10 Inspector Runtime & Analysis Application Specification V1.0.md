# UIQ-IMPL-10
# Inspector Runtime & Analysis Application Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 8  
**Previous:** UIQ-IMPL-09 Token & Theme Conformance Runtime Implementation Specification V1.0  
**Next:** UIQ-IMPL-11 Conformance & Regression Runtime Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ Inspector 的运行时架构与产品交互。

Inspector 不重新定义 UIQ 的计算模型，而是消费已经冻结的：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
Token
Theme
```

最终形成：

```text
REAL UI
   ↓
Inspector
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
Token / Theme / Impact Trace
```

---

# 2. Inspector 定位

UIQ Inspector 是：

> **UIQ 的可视化分析与证据浏览工具。**

不是：

```text
设计工具
视觉编辑器
自动设计生成器
AI 美学评分器
颜色生成器
Token 编辑器
```

---

# 3. Inspector 的核心任务

Inspector 必须支持：

1. 选择 UI Element
2. 捕获 Measurement
3. 查看 Metric
4. 查看 Rule Evaluation
5. 查看 Finding
6. 查看 Diagnostic
7. 查看 Token
8. 查看 Theme
9. 查看 Evidence Trace
10. 查看 Impact Trace
11. 执行重新测量
12. 导出分析结果

---

# 4. 核心交互模型

```text
Select
  ↓
Inspect
  ↓
Measure
  ↓
Evaluate
  ↓
Explain
  ↓
Trace
```

---

# 5. Inspector Runtime

```ts
export interface InspectorRuntime {
  inspect(
    target: Element
  ): Promise<InspectionResult>;

  measure(
    target: Element
  ): Promise<MeasurementSnapshot>;

  evaluate(
    target: Element
  ): Promise<EvaluationReport>;

  diagnose(
    target: Element
  ): Promise<Diagnostic[]>;
}
```

---

# 6. InspectionResult

```ts
export interface InspectionResult {
  subjectId: string;

  snapshot: MeasurementSnapshot;

  metrics: MetricResult<unknown>[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  diagnostics: Diagnostic[];

  tokenBindings?: TokenBinding[];

  impactTrace?: ImpactTrace;
}
```

---

# 7. Inspector UI

建议采用：

```text
┌───────────────────────────────────────────────┐
│ UIQ Inspector                                 │
├───────────────┬───────────────────────────────┤
│               │                               │
│ Element Tree  │      Rendered UI              │
│               │                               │
│               │       ┌────────────┐          │
│               │       │  Button    │          │
│               │       └────────────┘          │
│               │                               │
├───────────────┴───────────────────────────────┤
│ Analysis Panel                                │
│                                               │
│ Measurement | Metrics | Rules | Findings      │
│ Diagnostic | Tokens | Theme | Trace           │
└───────────────────────────────────────────────┘
```

---

# 8. Inspector 三个主要区域

## 8.1 Element Tree

显示：

```text
Page
 ├── Header
 │    ├── Logo
 │    └── Navigation
 ├── Main
 │    ├── Button
 │    └── Card
 └── Footer
```

---

## 8.2 Rendered UI

显示真实页面。

用户可以：

```text
Hover
Click
Select
```

选择元素。

---

## 8.3 Analysis Panel

显示：

```text
Measurements
Metrics
Evaluations
Findings
Diagnostics
Tokens
Theme
Trace
```

---

# 9. Element Selection

Inspector 必须提供：

```text
SELECT
HOVER
LOCK
CLEAR
```

---

# 10. Selection Identity

优先：

```html
data-uiq-id="button.submit"
```

否则：

```text
runtime-generated ID
```

但 Runtime ID 不保证跨 Snapshot 稳定。

---

# 11. Selection Overlay

选中元素后：

```text
┌────────────────────┐
│                    │
│      Button        │
│                    │
└────────────────────┘
```

显示：

```text
width
height
x
y
```

以及：

```text
margin
padding
```

---

# 12. Measurement Panel

显示实际浏览器值：

```text
Geometry
────────────────
Width       120px
Height       40px
X            32px
Y           128px

Typography
────────────────
Font Size    14px
Weight       500
Line Height  20px

Color
────────────────
Foreground   #FFFFFF
Background   #2563EB
```

---

# 13. Measurement 与 Metric 分离

Inspector 必须明确区分：

```text
Measurement
```

与：

```text
Metric
```

例如：

```text
Measurement:
background = #2563EB

Metric:
contrast = 5.17
```

不能只显示：

```text
Contrast = 5.17
```

而隐藏原始证据。

---

# 14. Metric Panel

例如：

```text
COLOR
────────────────
sRGB
#2563EB

OKLab
L 0.52
a  0.02
b -0.18

OKLCH
L 0.52
C 0.18
H 264°

Contrast
5.17
```

---

# 15. Metric Status

Metric 必须显示：

```text
AVAILABLE
UNKNOWN
ERROR
```

例如：

```text
Contrast
UNKNOWN

Reason:
Complex background cannot be resolved.
```

---

# 16. Rule Panel

显示：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
Version: 1.0.0

Threshold:
≥ 4.5

Result:
PASS
```

---

# 17. Rule Configuration

必须显示实际配置：

```text
Minimum:
4.5

Tolerance:
0.01
```

防止用户不知道：

> 这个 PASS/FAIL 到底依据什么。

---

# 18. Evaluation Panel

显示：

```text
Rule
────────────────
WCAG_AA

Metric
────────────────
Contrast = 5.17

State
────────────────
PASS

Severity
────────────────
HIGH
```

---

# 19. State 与 Severity

必须独立展示。

例如：

```text
FAIL
Severity: LOW
```

是合法状态。

也可能：

```text
WARN
Severity: HIGH
```

二者不能合并成一个：

```text
“严重度分数”
```

---

# 20. Finding Panel

如果：

```text
Evaluation = FAIL
```

显示：

```text
Findings
────────────────
Accessibility
Contrast below configured minimum
```

---

# 21. Finding Identity

显示：

```text
Finding ID
Fingerprint
State
Severity
```

例如：

```text
Finding:
F-8A2D

State:
DETECTED

Severity:
HIGH
```

---

# 22. Finding Lifecycle UI

显示：

```text
DETECTED
   │
   ▼
DIAGNOSED
   │
   ▼
RESOLVED
   │
   ▼
VERIFIED
```

用户可以查看：

```text
current state
state history
verification snapshot
```

---

# 23. Diagnostic Panel

例如：

```text
Why?

Computed contrast is 3.21.

Required minimum is 4.50.

Therefore the WCAG AA rule evaluated to FAIL.
```

---

# 24. Diagnostic Evidence

Diagnostic 必须允许展开：

```text
Evidence
────────────────
DOM
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Evaluation
```

---

# 25. Evidence Trace UI

推荐：

```text
Finding
   │
   ▼
Evaluation
   │
   ├──── Rule
   │
   └──── Metric
            │
            ▼
       Measurement
            │
            ▼
           DOM
```

---

# 26. Evidence Node

用户点击节点：

```text
Metric
```

Inspector 显示：

```text
Metric ID
Metric Version
Value
Unit
Status
Dependencies
Fingerprint
```

---

# 27. Token Panel

如果存在 Token Binding：

```text
Token
────────────────
button.primary.background

Type
COMPONENT

Resolved Value
#2563EB
```

---

# 28. Token Resolution

显示：

```text
button.primary.background
        ↓
color.action.primary
        ↓
color.blue.600
        ↓
#2563EB
```

---

# 29. Token Match

例如：

```text
Expected
#2563EB

Actual
#2563EB

Token Match
PASS
```

---

# 30. Token Deviation

如果不同：

```text
Expected
#2563EB

Actual
#1D4ED8
```

显示：

```text
Token Match
FAIL

Deviation
ΔL
ΔC
ΔH
ΔE
```

其中 ΔE 必须显示实际方法，例如：

```text
CIEDE2000
```

不能仅显示：

```text
ΔE
```

---

# 31. Token Binding Confidence

显示：

```text
Binding
EXPLICIT

Confidence
DIRECT
```

如果推断：

```text
Binding
INFERRED

Confidence
INFERRED
```

---

# 32. Theme Panel

显示：

```text
Theme
────────────────
Dark

Theme Status
VALID
```

以及：

```text
Token Coverage
98%
```

---

# 33. Multi-theme

Inspector 支持：

```text
Light
Dark
High Contrast
```

切换时必须切换：

```text
Theme
MeasurementSnapshot
Metric Results
Evaluation Results
Findings
```

不能只替换一个颜色值。

---

# 34. Theme Comparison

可以提供：

```text
              Light       Dark
────────────────────────────────
Background    #FFFFFF     #111827
Foreground    #111827     #F9FAFB
Contrast      16.2        15.1
Token Match   PASS        PASS
Accessibility PASS        PASS
```

这是比较工具，不产生：

```text
“哪个主题更好”
```

---

# 35. Impact Trace Panel

用户选择：

```text
color.blue.600
```

显示：

```text
Impact
────────────────

Semantic
 └── color.action.primary

Components
 ├── button.primary
 ├── link.primary
 └── badge.info

Elements
 ├── Button #1
 ├── Button #2
 └── Link #3
```

---

# 36. Impact Trace 与修改

V1.0：

```text
Impact Trace
```

只用于：

```text
分析
```

不直接修改 Token。

---

# 37. Recommendation

V1.0 Inspector 不提供自动设计推荐。

可以显示：

```text
Potential next action:
Review the referenced token.
```

但不能自动：

```text
replace color
rewrite theme
generate palette
```

---

# 38. Inspector Modes

支持四种模式：

```text
ANALYSIS
VALIDATION
CONFORMANCE
REGRESSION
```

---

# 39. ANALYSIS Mode

重点：

```text
Measurement
Metric
Diagnostic
```

适合：

> 理解当前 UI。

---

# 40. VALIDATION Mode

重点：

```text
Rule
Evaluation
Finding
```

适合：

> 检查具体 UI 是否满足规则。

---

# 41. CONFORMANCE Mode

重点：

```text
Token
Component
Theme
```

适合：

> 检查 Design System 与实际 UI 是否一致。

---

# 42. REGRESSION Mode

重点：

```text
Snapshot A
Snapshot B
Evaluation Diff
Finding Diff
```

适合：

> 判断一次修改改变了什么。

---

# 43. Regression View

例如：

```text
Before
────────────────
Contrast = 5.17
PASS

After
────────────────
Contrast = 3.21
FAIL
```

显示：

```text
NEW_FAILURE
```

---

# 44. Regression Categories

沿用：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

---

# 45. Inspector 不负责 Regression 计算

Inspector 只负责：

```text
display
navigation
interaction
```

Regression Engine 负责：

```text
comparison
classification
fingerprint matching
```

---

# 46. Export

Inspector 支持：

```text
JSON
Markdown
HTML
```

V1.0 推荐 JSON 作为机器可读格式。

---

# 47. JSON Export

```json
{
  "subjectId": "button.submit",
  "snapshotId": "snapshot-001",
  "metrics": [],
  "evaluations": [],
  "findings": [],
  "diagnostics": [],
  "tokenBindings": []
}
```

---

# 48. Export Reproducibility

Export 必须包含：

```text
UIQ Engine Version
Metric Versions
Rule Versions
Snapshot ID
Theme ID
Browser
Viewport
DevicePixelRatio
```

---

# 49. Inspector State

```ts
export interface InspectorState {
  selectedSubjectId?: string;

  snapshotId?: string;

  themeId?: string;

  mode:
    | "ANALYSIS"
    | "VALIDATION"
    | "CONFORMANCE"
    | "REGRESSION";

  activePanel:
    | "MEASUREMENT"
    | "METRIC"
    | "RULE"
    | "FINDING"
    | "DIAGNOSTIC"
    | "TOKEN"
    | "THEME"
    | "TRACE";
}
```

---

# 50. Inspector Application Architecture

```text
apps/inspector/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes/
│   │
│   ├── inspector/
│   │   ├── InspectorRuntime.ts
│   │   ├── InspectorState.ts
│   │   └── InspectorController.ts
│   │
│   ├── selection/
│   │   ├── ElementSelector.ts
│   │   └── SelectionOverlay.ts
│   │
│   ├── panels/
│   │   ├── MeasurementPanel.tsx
│   │   ├── MetricPanel.tsx
│   │   ├── RulePanel.tsx
│   │   ├── FindingPanel.tsx
│   │   ├── DiagnosticPanel.tsx
│   │   ├── TokenPanel.tsx
│   │   ├── ThemePanel.tsx
│   │   └── TracePanel.tsx
│   │
│   ├── export/
│   │   ├── exportJson.ts
│   │   ├── exportMarkdown.ts
│   │   └── exportHtml.ts
│   │
│   └── index.ts
```

---

# 51. UI 技术原则

Inspector 可以使用：

```text
React
Radix UI
```

但：

```text
@uiq/core
@uiq/color
@uiq/metrics
@uiq/rules
```

不能依赖它们。

依赖方向：

```text
UIQ Runtime
      ↑
Inspector Adapter
      ↑
React / Radix
```

---

# 52. Inspector 与 Radix UI

Radix UI 只作为：

```text
Presentation Layer
```

例如：

```text
Tabs
Popover
Dialog
Tooltip
Accordion
ScrollArea
```

UIQ 不把：

```text
Radix Component
```

定义为 UIQ Domain Entity。

---

# 53. Inspector Data Flow

```text
DOM
 ↓
BrowserMeasurementAdapter
 ↓
MeasurementSnapshot
 ↓
MetricEngine
 ↓
MetricResult
 ↓
RuleEngine
 ↓
EvaluationResult
 ↓
FindingFactory
 ↓
DiagnosticEngine
 ↓
Inspector State
 ↓
UI
```

---

# 54. Conformance Data Flow

```text
Token Registry
       ↓
Theme
       ↓
Token Resolver
       ↓
Token Binding
       ↓
Browser Measurement
       ↓
Token Metrics
       ↓
Conformance Rules
       ↓
Finding
       ↓
Diagnostic
       ↓
Inspector
```

---

# 55. Inspector Performance

必须避免：

```text
Mouse Move
 ↓
Full Page Re-measure
```

推荐：

```text
Hover
 ↓
lightweight selection
```

点击：

```text
Select
 ↓
Full Measurement
```

---

# 56. Measurement Cache

Inspector 可以缓存：

```text
Snapshot
```

以及：

```text
Metric Results
```

Cache Key 必须遵守既有规范。

不能跨：

```text
Snapshot
Theme
Browser State
```

错误复用。

---

# 57. Incremental Inspection

如果只改变：

```text
Selected Element
```

可以重新计算该 Subject。

如果：

```text
Theme
Viewport
Browser State
```

发生变化，则创建新的 Snapshot。

---

# 58. Inspector Error Handling

例如 Browser Measurement 失败：

```text
Measurement = ERROR
```

Inspector 显示：

```text
Measurement Error

Reason:
Unable to resolve computed background.
```

不能显示：

```text
Contrast = 0
```

这种伪造值。

---

# 59. UNKNOWN UI

例如复杂 Gradient：

```text
background:
linear-gradient(...)
```

如果 V1.0 无法精确解析：

```text
Contrast
UNKNOWN
```

Inspector 必须明确显示：

```text
UNKNOWN
```

而不是：

```text
FAIL
```

---

# 60. Accessibility

Inspector 本身也必须遵守基础可访问性：

```text
Keyboard Navigation
Focus Visibility
ARIA
Contrast
Target Size
```

否则：

> 用于检测 Accessibility 的工具本身却不可访问。

---

# 61. Inspector Test Architecture

测试分为：

```text
Unit
Component
Integration
Browser
E2E
Conformance
```

---

# 62. Selection Tests

覆盖：

```text
Explicit UIQ ID
Runtime ID
Nested Elements
Shadow DOM
Dynamic DOM
Removed Element
```

---

# 63. Panel Tests

每个 Panel 必须验证：

```text
Measurement
Metric
Rule
Finding
Diagnostic
Token
Theme
Trace
```

均来源于 Runtime Contract，而不是自行重新计算。

---

# 64. Trace Tests

验证：

```text
Finding
 ↓
Evaluation
 ↓
Metric
 ↓
Measurement
 ↓
DOM
```

能够在 UI 中完整导航。

---

# 65. Token Trace Tests

验证：

```text
Element
 ↓
Component Token
 ↓
Semantic Token
 ↓
Primitive Token
```

能够反向导航。

---

# 66. Theme Isolation Tests

验证：

```text
Light Snapshot
```

不会显示：

```text
Dark Evaluation
```

中的数据。

---

# 67. Regression UI Tests

验证：

```text
Before
After
```

能够正确显示：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
```

---

# 68. Acceptance Criteria

## AC-INSPECT-01

可以选择任意可测量 DOM Element。

## AC-INSPECT-02

可以查看实际 Measurement。

## AC-INSPECT-03

可以查看 Metric Result。

## AC-INSPECT-04

可以查看 Rule Configuration。

## AC-INSPECT-05

可以查看 Evaluation State。

## AC-INSPECT-06

可以查看 Finding。

## AC-INSPECT-07

可以查看 Diagnostic。

## AC-INSPECT-08

可以追踪 Evidence Graph。

## AC-INSPECT-09

可以查看 Token Resolution Chain。

## AC-INSPECT-10

可以查看 Theme Context。

## AC-INSPECT-11

可以查看 Impact Trace。

## AC-INSPECT-12

UNKNOWN/ERROR 不得被 UI 隐藏为 PASS/FAIL。

## AC-INSPECT-13

Inspector 不重新实现 Metric/Rule 计算。

## AC-INSPECT-14

不同 Theme 使用独立 Snapshot。

## AC-INSPECT-15

分析结果可以导出并保持版本信息。

---

# 69. V1.0 Inspector MVP

第一版只要求完成：

```text
Select Element
      ↓
Measurement
      ↓
Contrast Metric
      ↓
WCAG Rule
      ↓
Evaluation
      ↓
Finding
      ↓
Diagnostic
```

然后加入：

```text
Token
Theme
Trace
```

---

# 70. 第一个完整产品场景

页面：

```html
<button data-uiq-id="submit">
  Submit
</button>
```

样式：

```css
button {
  color: #ffffff;
  background: #2563EB;
}
```

Inspector：

```text
Element
button#submit
```

Measurement：

```text
Foreground = #FFFFFF
Background = #2563EB
```

Metric：

```text
Contrast = 5.17
```

Rule：

```text
WCAG AA ≥ 4.5
```

Evaluation：

```text
PASS
```

Finding：

```text
None
```

---

# 71. 第二个场景

样式：

```css
button {
  color: #777777;
  background: #FFFFFF;
}
```

Measurement：

```text
Foreground = #777777
Background = #FFFFFF
```

Metric：

```text
Contrast ≈ 4.48
```

Rule：

```text
Minimum = 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```text
ACCESSIBILITY
```

Diagnostic：

```text
Computed contrast is below
the configured minimum.
```

---

# 72. 第三个场景：Token Deviation

Expected：

```text
button.primary.background
→ #2563EB
```

Actual：

```text
#1D4ED8
```

Inspector：

```text
Token Match
FAIL

Token Deviation
ΔL
ΔC
ΔH
ΔE
```

并可以：

```text
Trace Token
```

---

# 73. 产品边界

Inspector V1.0 不做：

```text
❌ 自动改 CSS
❌ 自动生成 Palette
❌ 自动生成 Theme
❌ AI 审美评分
❌ 自动判断“高级感”
❌ 自动替换颜色
❌ 自动修改 Token
❌ 自动生成设计
```

它首先是：

> **Evidence-driven UI analysis tool**

---

# 74. 当前完整产品架构

```text
                     UIQ
                      │
        ┌─────────────┴─────────────┐
        │                           │
   Design System                Real UI
        │                           │
   Token / Theme               Browser DOM
        │                           │
        └─────────────┬─────────────┘
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
                 Inspector
                      ↓
              Human Understanding
```

---

# 75. 架构冻结声明

Phase 8 不新增：

```text
Core Layer
Analysis Layer
AI Layer
Design Layer
```

Inspector 是：

```text
Application
```

不是新的领域层。

最终 Runtime 仍然：

```text
Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding
→ Diagnostic
```

---

# 76. V1.0 当前成熟度

目前已经完成：

```text
01  Domain / Measurement Model
02  Metric Registry
03  Token / Theme Model
04  Reference Architecture
05  Runnable Implementation
06  Core Contracts
07  Color Mathematics
08  Metric Execution
09  Rule Evaluation
10  Browser Measurement
11  Finding / Diagnostic
12  Token / Theme Conformance
13  Inspector Runtime
```

对应真正可运行闭环：

```text
Browser UI
   ↓
Select
   ↓
Measure
   ↓
Calculate
   ↓
Evaluate
   ↓
Find
   ↓
Explain
   ↓
Trace
```

---

# 77. 下一阶段

下一阶段不再扩展 UIQ 的核心语义，而进入工程化验证：

**UIQ-IMPL-11 Conformance & Regression Runtime Specification V1.0**

重点：

```text
Golden Tests
     ↓
Metric Conformance
     ↓
Rule Conformance
     ↓
Browser Conformance
     ↓
Token Conformance
     ↓
Theme Conformance
     ↓
Snapshot Comparison
     ↓
Regression Detection
     ↓
CI Release Gate
```

这一步完成后，UIQ 将从：

> **可以运行的 UI 分析工具**

进入：

> **可以在 CI/CD 中持续验证 UI 设计与 Design System 一致性的工程系统。**

并且依然不会增加新的核心架构层。