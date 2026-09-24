# UIQ-IMPL-09
# Token & Theme Conformance Runtime Implementation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 7  
**Previous:** UIQ-IMPL-08 Finding & Diagnostic Runtime Implementation Specification V1.0  
**Next:** UIQ-IMPL-10 Inspector Runtime & Analysis Application Specification V1.0

---

# 1. 文档目的

本规范实现 UIQ 的 Design Token 与 Theme Conformance Runtime。

此前 UIQ 已经能够：

```text
REAL UI
 ↓
MEASUREMENT
 ↓
METRIC
 ↓
RULE
 ↓
EVALUATION
 ↓
FINDING
 ↓
DIAGNOSTIC
```

本阶段增加：

```text
DESIGN TOKEN
      ↓
TOKEN GRAPH
      ↓
TOKEN RESOLUTION
      ↓
COMPONENT TOKEN
      ↓
THEME
      ↓
RENDERED UI
```

并最终汇入已有的：

```text
Measurement
   ↓
Metric
   ↓
Rule
   ↓
Evaluation
```

因此最终关系为：

```text
                     ┌──────────────┐
                     │ Design Token │
                     └──────┬───────┘
                            ↓
                     Token Resolution
                            ↓
                     Component Token
                            ↓
                          Theme
                            ↓
                       Rendered UI
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
```

---

# 2. 核心原则

## 2.1 Token 是规范来源，不是实际 Measurement

Token 表示：

> 设计系统期望使用什么值。

Measurement 表示：

> 浏览器实际渲染了什么值。

二者不能混淆。

---

# 3. Token Conformance

Token Conformance 的基本问题：

> 实际 UI 是否按照 Design Token 体系实现？

因此：

```text
Expected Token Value
        ↓
Actual Rendered Value
        ↓
Comparison
        ↓
Conformance Result
```

---

# 4. Token Match 与 Token Deviation

二者必须独立。

## TOKEN_MATCH

回答：

> Actual Value 是否与指定 Token 一致？

## TOKEN_DEVIATION

回答：

> Actual Value 与指定 Token 存在多大偏差？

例如：

```text
Token:
color.primary = #2563EB

Actual:
#1D4ED8
```

则：

```text
TOKEN_MATCH = false
TOKEN_DEVIATION = measurable
```

---

# 5. Token 不等于视觉正确

非常重要：

```text
Token Match = true
```

并不代表：

```text
Accessibility = PASS
```

同样：

```text
Token Match = false
```

也不一定代表：

```text
Visual Design = FAIL
```

因为 Token Conformance 与 Visual/Accessibility Evaluation 是不同维度。

---

# 6. Token 类型

UIQ V1.0 支持：

```text
PRIMITIVE
SEMANTIC
COMPONENT
```

结构：

```text
Primitive Token
      ↓
Semantic Token
      ↓
Component Token
      ↓
Rendered UI
```

---

# 7. Primitive Token

例如：

```json
{
  "id": "color.blue.600",
  "type": "PRIMITIVE",
  "value": "#2563EB"
}
```

Primitive Token 不表达具体 UI 语义。

---

# 8. Semantic Token

例如：

```json
{
  "id": "color.action.primary",
  "type": "SEMANTIC",
  "reference": "color.blue.600"
}
```

表示：

> Primary Action 应使用什么颜色。

---

# 9. Component Token

例如：

```json
{
  "id": "button.primary.background",
  "type": "COMPONENT",
  "reference": "color.action.primary"
}
```

表达：

> Button Primary 的 Background 应使用什么 Token。

---

# 10. Token Graph

Token Reference Graph：

```text
G = (V, E)
```

其中：

```text
V = Token
E = Token Reference
```

例如：

```text
color.blue.600
       ↑
       │
color.action.primary
       ↑
       │
button.primary.background
```

---

# 11. DAG 要求

Token Graph 必须是 DAG：

```text
Directed Acyclic Graph
```

禁止：

```text
A → B
B → C
C → A
```

---

# 12. Token Cycle

发现 Cycle 时：

```text
TOKEN_GRAPH_ERROR
```

必须报告完整路径：

```text
A
→ B
→ C
→ A
```

而不是：

```text
Invalid Token
```

这种过于笼统的信息。

---

# 13. Token Resolution

Token Resolution：

```text
Component Token
       ↓
Semantic Token
       ↓
Primitive Token
       ↓
Resolved Value
```

例如：

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

# 14. Token Resolver Contract

```ts
export interface TokenResolver {
  resolve(
    tokenId: string,
    context: TokenResolutionContext
  ): TokenResolutionResult;
}
```

---

# 15. Resolution Context

```ts
export interface TokenResolutionContext {
  themeId?: string;
  tokens: DesignToken[];
}
```

未来可以扩展：

```text
mode
brand
locale
density
platform
```

但 V1.0 不增加额外语义层。

---

# 16. Resolution Result

```ts
export interface TokenResolutionResult {
  tokenId: string;

  resolvedValue?: unknown;

  chain: string[];

  status:
    | "RESOLVED"
    | "UNKNOWN"
    | "ERROR";

  fingerprint: string;
}
```

---

# 17. Token Resolution Chain

必须保留：

```text
chain
```

例如：

```json
{
  "tokenId": "button.primary.background",
  "chain": [
    "button.primary.background",
    "color.action.primary",
    "color.blue.600"
  ],
  "resolvedValue": "#2563EB"
}
```

---

# 18. Token Resolution Error

以下情况：

```text
Missing Token
Cycle
Invalid Reference
Unsupported Value
```

不得返回一个猜测值。

必须：

```text
ERROR
```

或：

```text
UNKNOWN
```

具体取决于错误性质。

---

# 19. Theme

Theme 是一组 Token 在特定上下文中的有效配置。

例如：

```text
Light
Dark
High Contrast
Brand A
Brand B
```

---

# 20. Theme Contract

沿用：

```ts
export interface Theme {
  id: string;

  name: string;

  tokens: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}
```

---

# 21. Theme Isolation

每个 Theme 必须独立解析。

例如：

```text
Light Theme
```

不能因为：

```text
Dark Theme
```

存在问题而直接判定：

```text
Theme System = FAIL
```

必须分别产生结果：

```text
Light → PASS
Dark  → FAIL
```

---

# 22. Theme Context

Theme Resolution：

```text
Theme
  ↓
Token Overrides
  ↓
Resolved Token Values
```

---

# 23. Theme Override

例如：

```text
Primitive:
blue.600 = #2563EB
```

Dark Theme：

```text
blue.600 = #60A5FA
```

此时：

```text
Theme Override
```

是合法机制。

不能简单判断：

```text
Override != Base
→ FAIL
```

---

# 24. Theme Integrity

Theme Integrity 至少检查：

```text
Required Token Coverage
Reference Validity
Cycle
Unresolved Token
Override Validity
```

---

# 25. Theme Coverage

定义：

```text
coverage =
resolvedRequiredTokens
/
requiredTokens
```

例如：

```text
Required = 100
Resolved = 98
```

则：

```text
Coverage = 98%
```

Coverage 本身是 Metric。

是否合格由 Rule 决定。

---

# 26. Token Resolution Metric

建议使用：

```text
TOKEN.RESOLUTION
```

状态：

```text
AVAILABLE
UNKNOWN
ERROR
```

结果包括：

```text
resolvedValue
resolutionChain
```

---

# 27. Token Match Metric

定义：

```text
TOKEN.MATCH
```

输入：

```text
Expected Token
Actual Rendered Value
```

输出：

```text
MATCH
NO_MATCH
UNKNOWN
```

---

# 28. Token Deviation Metric

定义：

```text
TOKEN.DEVIATION
```

输出依赖 Token 类型。

颜色 Token：

```text
ΔL
ΔC
ΔH
ΔE
```

几何 Token：

```text
Absolute Difference
Relative Difference
```

Typography：

```text
Absolute Difference
Relative Difference
```

---

# 29. Token Deviation 不是一个统一距离

不能：

```text
所有 Token
→ 一个 deviation number
```

例如颜色：

```text
OKLCH
```

与：

```text
spacing
```

没有相同的数学意义。

因此：

```text
Token Deviation
```

是语义概念，具体 Metric 必须声明其数学定义。

---

# 30. Actual Value 来源

Token Conformance 必须使用：

```text
Browser Measurement
```

作为 Actual Value 来源。

例如：

```text
Computed Style
```

而不是：

```text
React prop
Vue prop
CSS source
Token JSON
```

---

# 31. CSS Custom Property

浏览器适配器可以读取：

```css
--color-action-primary
```

例如：

```ts
getComputedStyle(element)
  .getPropertyValue("--color-action-primary");
```

但最终 Conformance 仍然需要：

```text
Rendered/Computed Value
```

作为主要事实来源。

---

# 32. Token Metadata

为了建立 Token → DOM 关系，建议允许：

```html
data-uiq-token="button.primary.background"
```

但这不是强制要求。

---

# 33. Token Binding

支持三种 Binding：

```text
EXPLICIT
INFERRED
UNRESOLVED
```

---

# 34. Explicit Binding

例如：

```html
<button
  data-uiq-token="button.primary.background">
</button>
```

则：

```text
Binding = EXPLICIT
```

---

# 35. Inferred Binding

如果没有显式 Metadata，可以通过：

```text
CSS Custom Property
Computed Style
Component Adapter
```

推断。

必须标记：

```text
Binding = INFERRED
```

不能伪装成：

```text
EXPLICIT
```

---

# 36. Unresolved Binding

如果无法确定：

```text
Actual Value
```

到底来自哪个 Token：

```text
Binding = UNRESOLVED
```

不能强行建立 Token Root Cause。

---

# 37. Token Conformance Pipeline

```text
Design Token
      ↓
Token Graph
      ↓
Token Resolution
      ↓
Theme Resolution
      ↓
Token Binding
      ↓
Actual Browser Measurement
      ↓
Token Match / Deviation
      ↓
Rule
      ↓
Evaluation
      ↓
Finding
      ↓
Diagnostic
```

---

# 38. Token Conformance Runtime

定义：

```ts
export interface TokenConformanceEngine {
  evaluate(
    request: TokenConformanceRequest
  ): TokenConformanceReport;
}
```

---

# 39. Request

```ts
export interface TokenConformanceRequest {
  snapshot: MeasurementSnapshot;

  theme: Theme;

  tokens: DesignToken[];

  subjects: string[];

  rules: RuleReference[];
}
```

---

# 40. Report

```ts
export interface TokenConformanceReport {
  themeId: string;

  resolutions: TokenResolutionResult[];

  bindings: TokenBinding[];

  metricResults: MetricResult<unknown>[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  diagnostics: Diagnostic[];
}
```

---

# 41. Token Binding

```ts
export interface TokenBinding {
  subjectId: string;

  tokenId?: string;

  bindingType:
    | "EXPLICIT"
    | "INFERRED"
    | "UNRESOLVED";

  source?: string;

  confidence:
    | "DIRECT"
    | "SUPPORTED"
    | "INFERRED"
    | "UNKNOWN";
}
```

---

# 42. Binding 与 Root Cause

只有：

```text
EXPLICIT
```

或有充分证据的：

```text
INFERRED
```

才可以进入 Root Cause 分析。

---

# 43. Token Match Rule

Metric：

```text
TOKEN.MATCH
```

Rule：

```text
TOKEN.TOKEN_MATCH@1.0.0
```

示例：

```text
Actual = #2563EB
Expected = #2563EB
```

Evaluation：

```text
PASS
```

---

# 44. Token Deviation Rule

例如：

```text
ΔE <= configured tolerance
```

则：

```text
PASS
```

否则：

```text
FAIL
```

注意：

> tolerance 属于 Rule Configuration，而不是 Metric。

---

# 45. Component Conformance

Component Conformance：

```text
Component Contract
       ↓
Expected Tokens
       ↓
Actual Token Bindings
       ↓
Measurement
```

例如 Button Contract：

```text
background
foreground
border
radius
padding
font-size
```

---

# 46. Component Token Contract

```ts
export interface ComponentTokenContract {
  componentType: string;

  requiredTokens: string[];

  optionalTokens?: string[];

  constraints?: string[];
}
```

---

# 47. Component Conformance

需要区分：

```text
TOKEN_MATCH
```

与：

```text
COMPONENT_CONFORMANCE
```

例如：

```text
Button Background → MATCH
Button Foreground → MATCH
Button Radius → missing
```

那么：

```text
TOKEN_MATCH
```

可能大部分 PASS。

但：

```text
COMPONENT_CONFORMANCE
```

可能 FAIL。

---

# 48. Theme Conformance

Theme Conformance 汇总：

```text
Token Resolution
+
Token Match
+
Component Conformance
+
Theme Integrity
```

但不产生新的 Metric。

Theme Conformance 是 Evaluation/Policy 层面的组合。

---

# 49. Accessibility 与 Theme

Theme Conformance 可以触发：

```text
Accessibility Rules
```

例如：

```text
Light Theme
Dark Theme
High Contrast Theme
```

分别运行：

```text
Contrast
Target Size
Text Legibility
```

---

# 50. Theme 不共享 Evaluation

禁止：

```text
Light Theme Evaluation
        ↓
Dark Theme Evaluation
```

每个 Theme 都必须使用自己的：

```text
MeasurementSnapshot
MetricResult
EvaluationResult
```

---

# 51. Theme Snapshot

推荐：

```text
Theme × Viewport × Browser
```

形成独立 Snapshot。

例如：

```text
Light × Desktop × Chromium
Dark  × Desktop × Chromium
Light × Mobile  × Chromium
Dark  × Mobile  × Chromium
```

---

# 52. Conformance Matrix

UIQ 可以生成：

| Theme | Viewport | Token | Component | Accessibility |
|---|---|---|---|---|
| Light | Desktop | PASS | PASS | PASS |
| Dark | Desktop | PASS | PASS | FAIL |
| Light | Mobile | PASS | WARN | PASS |
| Dark | Mobile | FAIL | FAIL | FAIL |

这里不生成：

```text
Overall Score
```

---

# 53. Theme Diagnostic

例如：

```text
Dark Theme
Button
Contrast = 3.2
```

Diagnostic：

```text
THEME_DEVIATION
```

证据：

```text
Theme
→ Component
→ Token
→ Actual Measurement
→ Contrast Metric
→ Rule
```

---

# 54. Impact Analysis

修改：

```text
color.blue.600
```

可能影响：

```text
color.action.primary
button.primary.background
link.primary
badge.info
```

进一步：

```text
Button
Link
Badge
```

最后：

```text
Rendered Elements
```

---

# 55. Impact Trace

完整链：

```text
Primitive Token
      ↓
Semantic Token
      ↓
Component Token
      ↓
Component
      ↓
DOM Elements
```

---

# 56. Theme Impact

修改 Theme Token：

```text
Dark Theme
  ↓
Semantic Token
  ↓
Component Token
  ↓
Rendered Components
```

Impact Trace 必须携带：

```text
themeId
```

防止跨 Theme 混淆。

---

# 57. Token Fragmentation

定义：

> 相同设计语义出现多个不同 Token 表达。

例如：

```text
color.primary.1 = #2563EB
color.primary.2 = #2563EB
color.action.blue = #2563EB
```

可能形成：

```text
TOKEN_FRAGMENTATION
```

---

# 58. Fragmentation 不自动判定为错误

Token Fragmentation 是 Metric / Finding 的候选事实。

是否允许：

```text
PASS
WARN
FAIL
```

必须由 Rule 决定。

---

# 59. Orphan Token

如果：

```text
Token
```

没有任何引用：

```text
ORPHAN
```

但：

```text
ORPHAN ≠ INVALID
```

可能是：

```text
future token
experimental token
unused token
```

---

# 60. Unused Token 与 Fragmentation

二者不同：

```text
ORPHAN
=
没有被引用
```

```text
FRAGMENTATION
=
同一语义存在冗余/重复表达
```

---

# 61. Token Graph Validation

必须验证：

```text
Cycle
Missing Reference
Invalid Reference
Orphan
Duplicate Semantic
Unresolved
```

---

# 62. Runtime Package

建议：

```text
packages/tokens/
├── src/
│   ├── graph/
│   │   ├── TokenGraph.ts
│   │   ├── buildTokenGraph.ts
│   │   └── detectTokenCycles.ts
│   │
│   ├── resolution/
│   │   ├── TokenResolver.ts
│   │   └── TokenResolverImpl.ts
│   │
│   ├── binding/
│   │   ├── TokenBinding.ts
│   │   └── TokenBindingResolver.ts
│   │
│   ├── conformance/
│   │   ├── TokenConformanceEngine.ts
│   │   └── TokenConformanceReport.ts
│   │
│   └── index.ts
```

Theme：

```text
packages/theme/
├── src/
│   ├── ThemeResolver.ts
│   ├── ThemeValidator.ts
│   ├── ThemeSnapshot.ts
│   ├── ThemeConformance.ts
│   └── index.ts
```

---

# 63. Dependencies

```text
@uiq/tokens
    ↓
@uiq/core

@uiq/theme
    ↓
@uiq/core
    ↓
@uiq/tokens
```

Browser：

```text
@uiq/browser
    ↓
@uiq/tokens
@uiq/theme
```

Metrics：

```text
@uiq/metrics
    ↓
@uiq/tokens
```

如需避免循环依赖，Token-specific Metrics 可以放在：

```text
@uiq/metrics
```

内部基于 Core Contract 实现，不让：

```text
tokens → metrics
```

反向依赖。

---

# 64. 严格依赖规则

禁止：

```text
tokens → browser
tokens → rules
tokens → diagnostic

theme → browser
theme → rules
theme → diagnostic
```

原则：

```text
Token/Theme
= Definition + Resolution

Browser
= Actual Measurement

Metric
= Calculation

Rule
= Evaluation

Diagnostic
= Explanation
```

---

# 65. First Vertical Slice

第一条 Token Conformance Slice：

```text
Token
 ↓
Theme
 ↓
DOM Button
 ↓
Browser Measurement
 ↓
Token Binding
 ↓
TOKEN.MATCH
 ↓
TOKEN.TOKEN_MATCH
 ↓
Evaluation
 ↓
Finding
 ↓
Diagnostic
```

---

# 66. 示例

Token：

```json
{
  "id": "color.action.primary",
  "type": "SEMANTIC",
  "reference": "color.blue.600"
}
```

Primitive：

```json
{
  "id": "color.blue.600",
  "type": "PRIMITIVE",
  "value": "#2563EB"
}
```

Component：

```json
{
  "id": "button.primary.background",
  "type": "COMPONENT",
  "reference": "color.action.primary"
}
```

实际：

```css
button {
  background-color: #2563EB;
}
```

结果：

```text
Token Match = true
```

---

# 67. Deviation 示例

Token：

```text
#2563EB
```

Actual：

```text
#1D4ED8
```

UIQ：

```text
Token Match = false
```

然后计算：

```text
ΔL
ΔC
ΔH
ΔE(method/version)
```

最终由 Rule 决定是否：

```text
FAIL
```

---

# 68. 完整 Diagnostic

例如：

```text
Finding:
TOKEN_DEVIATION

Cause:
TOKEN

Confidence:
DIRECT
```

解释：

```text
The rendered Button background does not match
the resolved component token
button.primary.background.
```

证据：

```text
Button
→ Component Token
→ Semantic Token
→ Primitive Token
→ Expected Value
→ Browser Measurement
→ Actual Value
```

---

# 69. Conformance Fingerprint

必须包含：

```text
Theme ID
Token ID
Token Version
Component ID
Subject ID
Snapshot ID
Actual Value
Expected Value
Metric Version
Rule Version
```

确保不同 Theme / Snapshot 不发生错误合并。

---

# 70. 测试规范

必须覆盖：

```text
Token Graph
Token Cycle
Token Resolution
Theme Override
Token Binding
Token Match
Token Deviation
Component Contract
Theme Isolation
Theme Coverage
Orphan Token
Fragmentation
Finding Integration
Diagnostic Integration
Impact Trace
```

---

# 71. Golden Tests

至少：

```text
TOKEN-GOLDEN-001
Exact token match

TOKEN-GOLDEN-002
Color token deviation

TOKEN-GOLDEN-003
Missing reference

TOKEN-GOLDEN-004
Token cycle

TOKEN-GOLDEN-005
Theme override

TOKEN-GOLDEN-006
Component token missing

TOKEN-GOLDEN-007
Unresolved binding

TOKEN-GOLDEN-008
Multi-theme isolation
```

---

# 72. Acceptance Criteria

## AC-THEME-01

Token Graph 能检测 Cycle。

## AC-THEME-02

Token Resolver 能生成完整 Resolution Chain。

## AC-THEME-03

Theme Override 可以独立解析。

## AC-THEME-04

Token Match 与 Token Deviation 分离。

## AC-THEME-05

Actual Value 来自 Browser Measurement。

## AC-THEME-06

无法绑定 Token 时不得强制推断。

## AC-THEME-07

Component Contract 可以检测缺失 Token。

## AC-THEME-08

不同 Theme 独立 Evaluation。

## AC-THEME-09

Orphan Token 不自动判定 Invalid。

## AC-THEME-10

Fragmentation 不自动判定 FAIL。

## AC-THEME-11

Token Finding 能进入 Diagnostic。

## AC-THEME-12

Token 修改可以生成 Impact Trace。

---

# 73. UIQ 当前完整执行模型

到 Phase 7：

```text
                  DESIGN SYSTEM
                       │
              ┌────────┴────────┐
              │                 │
           Tokens             Theme
              │                 │
              └────────┬────────┘
                       ↓
                 Token Resolution
                       ↓
                 Component Contract
                       ↓
                    REAL UI
                       ↓
                 Browser Adapter
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
                 Impact Trace
```

---

# 74. 架构再次冻结

Phase 7 不增加新的 Runtime Core Layer。

依旧只有：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
```

Token / Theme 是：

```text
Domain Capability
```

不是新的评价层。

---

# 75. UIQ V1.0 核心闭环

现在已经可以表达：

```text
Design Intent
     ↓
Token / Theme
     ↓
Component
     ↓
Rendered UI
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
Impact
```

这意味着 UIQ 已经从单纯的：

> UI 数值检测工具

发展为：

> **能够验证 Design System → Component → Rendered UI 一致性的可追溯 UI Conformance Runtime。**

---

# 76. 下一阶段

下一阶段进入：

**UIQ-IMPL-10 Inspector Runtime & Analysis Application Specification V1.0**

重点不是再设计核心模型，而是把现有能力真正变成可用产品：

```text
Browser
   ↓
Inspector
   ↓
Select Element
   ↓
Measurement
   ↓
Metric
   ↓
Rule
   ↓
Finding
   ↓
Diagnostic
   ↓
Token / Theme Trace
```

Inspector 将成为 UIQ V1.0 的第一个真正用户界面，并直接消费目前已经冻结的全部 Runtime Contract。