# UIQ-DG-01
## Diagnostic & Finding Explainability Specification V1.0

**Status:** Stable Draft / Architecture Freeze  
**Version:** 1.0.0  
**Module:** UIQ Diagnostic & Explainability  
**Depends On:** UIQ-FM-01 / UIQ-MR-01 / UIQ-TK-01 / UIQ-ER-02

---

# 1. 文档目标

本规范定义 UIQ 对 Evaluation Result 的进一步解释机制：

```text
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

目标不是重新进行一次评价，而是回答：

1. **哪里有问题？**
2. **违反了什么规则？**
3. **实际值是多少？**
4. **要求值是多少？**
5. **哪些 Measurement / Metric 支撑这个结论？**
6. **问题可能来自哪个 Token / Component / Theme / UI Element？**
7. **这个问题会影响什么？**

---

# 2. 核心原则

## 2.1 Diagnostic 不改变 Evaluation

例如：

```text
Evaluation:
FAIL
```

Diagnostic 可以解释：

```text
Foreground/background luminance
relationship is insufficient.
```

但不得把：

```text
FAIL
```

修改为：

```text
PASS
```

---

# 3. Diagnostic 定位

UIQ 中：

| 对象 | 职责 |
|---|---|
| Measurement | 原始事实 |
| Metric | 定量属性 |
| Rule | 约束 |
| Evaluation | 规则判断 |
| Finding | 问题记录 |
| Diagnostic | 问题解释 |
| Recommendation | 修复建议 |

因此：

```text
Diagnostic ≠ Recommendation
```

---

# 4. Finding 模型

Finding 是 UIQ 中的正式问题对象。

```ts
interface Finding {
  id: string;

  subjectId: string;

  ruleId: string;
  ruleVersion: string;

  state: EvaluationState;

  severity: Severity;

  title: string;
  description: string;

  evidence: Evidence[];

  metricReferences: string[];

  sourceLocation?: SourceLocation;

  tags?: string[];
}
```

---

# 5. Finding Identity

Finding ID 必须稳定。

推荐：

```text
F-{snapshot}-{subject}-{rule}
```

例如：

```text
F-snap001-button-submit-ACCESSIBILITY.CONTRAST.WCAG_AA
```

如果需要跨版本稳定追踪：

```text
findingFingerprint
```

必须基于：

```text
snapshot
+
subject
+
rule
+
rule configuration
```

生成。

---

# 6. Finding 生命周期

```text
DETECTED
   ↓
DIAGNOSED
   ↓
ACKNOWLEDGED
   ↓
RESOLVED
   ↓
VERIFIED
```

V1.0 中：

```text
DETECTED
DIAGNOSED
RESOLVED
VERIFIED
```

为分析状态。

是否由人工确认属于应用层能力，不进入 Diagnostic Core。

---

# 7. Finding 与 Evaluation 的关系

一个 Evaluation 可以：

```text
0 Finding
```

或：

```text
1 Finding
```

或：

```text
N Findings
```

但 V1.0 默认：

```text
FAIL → 1 Finding
WARN → 1 Finding
```

避免同一个规则产生大量重复问题。

---

# 8. Diagnostic 模型

```ts
interface Diagnostic {
  id: string;

  findingId: string;

  type: DiagnosticType;

  summary: string;

  causes: DiagnosticCause[];

  evidence: Evidence[];

  traces: DiagnosticTrace[];

  confidence: DiagnosticConfidence;

  generatedBy: DiagnosticGenerator;

  version: string;
}
```

---

# 9. Diagnostic Type

V1.0：

```ts
type DiagnosticType =
  | "VALUE_VIOLATION"
  | "TOKEN_DEVIATION"
  | "COMPONENT_DEVIATION"
  | "THEME_DEVIATION"
  | "LAYOUT_RELATIONSHIP"
  | "ACCESSIBILITY"
  | "TYPOGRAPHY"
  | "COLOR"
  | "UNKNOWN_CAUSE"
  | "EXECUTION_ERROR";
```

---

# 10. Diagnostic Cause

```ts
interface DiagnosticCause {
  id: string;

  type:
    | "MEASUREMENT"
    | "METRIC"
    | "TOKEN"
    | "COMPONENT"
    | "THEME"
    | "CONFIGURATION"
    | "UNKNOWN";

  reference: string;

  description: string;

  evidence: Evidence[];
}
```

---

# 11. Evidence Chain

UIQ 的诊断必须能够回溯：

```text
Finding
 ↓
Evaluation
 ↓
MetricResult
 ↓
Measurement
 ↓
DOM / Token / Theme
```

例如：

```text
Finding
  ↓
Contrast Rule FAIL
  ↓
Contrast = 4.48
  ↓
Foreground = #777777
Background = #FFFFFF
  ↓
DOM Button
```

---

# 12. Evidence Graph

正式模型：

```text
EvidenceGraph = (N, E)
```

其中：

- N = Evidence Nodes
- E = Evidence Relations

节点：

```ts
interface EvidenceNode {
  id: string;

  type:
    | "DOM"
    | "MEASUREMENT"
    | "METRIC"
    | "TOKEN"
    | "COMPONENT"
    | "THEME"
    | "RULE"
    | "CONFIGURATION";

  reference: string;

  value?: unknown;
}
```

---

# 13. Evidence Relation

```ts
type EvidenceRelation =
  | "MEASURED_FROM"
  | "DERIVED_FROM"
  | "EVALUATED_BY"
  | "RESOLVED_FROM"
  | "DEFINED_BY"
  | "USED_BY"
  | "OVERRIDES"
  | "DEVIATES_FROM";
```

---

# 14. 示例

```text
DOM Button
    │
    ├── MEASURED_FROM
    ↓
Measurement
    │
    ├── DERIVED_FROM
    ↓
COLOR.CONTRAST
    │
    ├── EVALUATED_BY
    ↓
WCAG Contrast Rule
    │
    ↓
FAIL
    │
    ↓
Finding
```

如果 Token 存在：

```text
Button
 ↓
resolved color
 ↓
Semantic Token
 ↓
Primitive Token
```

则完整链路可以继续向上追踪。

---

# 15. Diagnostic Trace

```ts
interface DiagnosticTrace {
  from: TraceNode;
  relation: EvidenceRelation;
  to: TraceNode;
}
```

例如：

```json
{
  "from": {
    "type": "COMPONENT",
    "reference": "Button"
  },
  "relation": "RESOLVED_FROM",
  "to": {
    "type": "TOKEN",
    "reference": "color.button.primary"
  }
}
```

---

# 16. Token Root Cause Analysis

当 UI 元素使用 Token 时，Diagnostic 应优先检查：

```text
UI Element
 ↓
Component Token
 ↓
Semantic Token
 ↓
Primitive Token
```

例如：

```text
Button
 ↓
button.primary.background
 ↓
color.primary.600
 ↓
#2563EB
```

如果 Contrast FAIL：

```text
Button
 ↓
Token
 ↓
Resolved Color
 ↓
Contrast
 ↓
FAIL
```

Diagnostic 可以指出：

> 当前实际颜色由 `color.primary.600` 提供。

但不能自动断言：

> `color.primary.600` 就是设计错误。

因为问题也可能来自：

- 前景色
- 背景色
- opacity
- component state
- theme override
- rendering context

---

# 17. Token Deviation Diagnostic

如果：

```text
expected token = color.primary.600
actual color = #2562EA
```

则：

```text
TOKEN_DEVIATION
```

可以生成：

```text
Component uses a value different from
the configured token reference.
```

---

# 18. Token Deviation ≠ Visual Failure

例如：

```text
TOKEN_DEVIATION = TRUE
```

同时：

```text
CONTRAST = PASS
```

两个结果必须独立存在。

```text
Token Conformance
    FAIL

Accessibility
    PASS
```

UIQ 不得把两者合并成一个总体评分。

---

# 19. Component Diagnostic

组件层诊断用于：

```text
Element
 ↓
Component Instance
 ↓
Component Contract
```

例如：

```text
Button instance
```

发现：

```text
hover state
```

没有对应 Token：

```text
button.primary.hover.background
```

则可以诊断：

```text
COMPONENT_DEVIATION
```

---

# 20. Theme Diagnostic

Theme 问题需要继续追踪：

```text
Theme
 ↓
Semantic Token
 ↓
Component Token
 ↓
UI Element
```

例如：

```text
Theme: dark
color.text.primary
```

导致：

```text
multiple contrast failures
```

Diagnostic 可以识别：

```text
shared semantic token
```

但不直接修改 Token。

---

# 21. Impact Trace

UIQ 增加影响追踪概念：

```ts
interface ImpactTrace {
  source: ImpactNode;

  affected: ImpactNode[];

  relation:
    | "TOKEN_USAGE"
    | "COMPONENT_USAGE"
    | "THEME_USAGE"
    | "PAGE_USAGE";
}
```

---

# 22. Token Impact

例如：

```text
color.primary.600
```

被：

```text
Button
Link
Badge
Alert
```

使用。

如果该 Token 发生修改：

```text
Token
 ↓
4 Components
 ↓
12 UI Elements
 ↓
3 Pages
```

UIQ 可以生成影响范围。

---

# 23. Impact 不等于 Failure

这是一个非常重要的边界：

```text
Impact
```

描述：

> 修改这个对象可能影响什么。

而：

```text
Finding
```

描述：

> 当前状态存在什么问题。

两者不能混淆。

---

# 24. Shared Token Diagnostic

当一个 Token 导致多个 Finding：

```text
Finding A
Finding B
Finding C
```

且三者都来自：

```text
color.text.secondary
```

系统可以聚合：

```text
Shared Cause Candidate
```

但不能简单删除三个 Finding。

---

# 25. Finding Aggregation

推荐模型：

```text
Root Cause Candidate
       ↓
Finding A
Finding B
Finding C
```

而不是：

```text
Finding A
Finding B
Finding C
       ↓
一个 Finding
```

这样可以同时支持：

- 单问题修复
- 根因聚合
- 影响分析
- 回归测试

---

# 26. Root Cause Candidate

```ts
interface RootCauseCandidate {
  id: string;

  type:
    | "TOKEN"
    | "COMPONENT"
    | "THEME"
    | "MEASUREMENT"
    | "CONFIGURATION";

  reference: string;

  affectedFindingIds: string[];

  evidence: Evidence[];

  confidence: DiagnosticConfidence;
}
```

---

# 27. Diagnostic Confidence

V1.0 定义：

```ts
type DiagnosticConfidence =
  | "DIRECT"
  | "SUPPORTED"
  | "INFERRED"
  | "UNKNOWN";
```

语义：

| Level | 含义 |
|---|---|
| DIRECT | 有直接证据 |
| SUPPORTED | 多个证据支持 |
| INFERRED | 根据关系推断 |
| UNKNOWN | 无法确定 |

---

# 28. 禁止伪造根因

如果只有：

```text
contrast = 4.48
```

不能直接诊断：

```text
错误原因是蓝色太暗。
```

因为可能存在：

```text
foreground
background
opacity
blend
theme
rendering
```

因此应该：

```text
Root Cause:
UNKNOWN

Evidence:
contrast = 4.48
```

---

# 29. Color Diagnostic

对于 Color Finding，Diagnostic 可以展开：

```text
COLOR
 ├── Lightness
 ├── Chroma
 ├── Hue
 ├── Contrast
 ├── Gamut
 └── Alpha
```

例如：

```text
Contrast FAIL
```

进一步发现：

```text
Foreground L = 0.52
Background L = 0.98
```

可以生成：

```text
COLOR diagnostic evidence
```

但不生成：

```text
Use color #XXXXXX instead
```

---

# 30. “Dirty Color”诊断

UIQ 不定义：

```text
DIRTY_COLOR
```

如果用户认为颜色“脏”，Diagnostic 必须拆解为：

```text
Chroma
Lightness
Hue
Gamut
Contrast
Color Difference
```

例如：

```text
Observed:
low chroma
+
low lightness
+
background contrast relationship
```

然后报告这些事实。

不能输出：

```text
This color is objectively dirty.
```

---

# 31. Typography Diagnostic

例如：

```text
LINE_HEIGHT < configured threshold
```

Diagnostic 可以查看：

```text
fontSize
lineHeight
fontWeight
textMeasure
```

形成：

```text
Typography Evidence
```

但不能自动判断：

```text
This typography is ugly.
```

---

# 32. Geometry Diagnostic

例如：

```text
GRID_ALIGNMENT FAIL
```

Diagnostic 可以检查：

```text
x coordinate
y coordinate
grid interval
neighbor alignment
```

形成：

```text
Alignment Trace
```

---

# 33. Spacing Diagnostic

例如：

```text
SPACING.SCALE_CONFORMANCE FAIL
```

可以得到：

```text
actual = 18px
nearest scale = 16px
deviation = 2px
```

这是 Diagnostic。

不是：

```text
Change 18px to 16px
```

后者属于 Recommendation。

---

# 34. Recommendation Boundary

V1.0：

```text
Diagnostic
```

负责：

```text
WHY
```

Recommendation：

```text
WHAT TO CHANGE
```

二者分离。

---

# 35. Diagnostic Generator

```ts
interface DiagnosticGenerator {
  supports(finding: Finding): boolean;

  diagnose(
    finding: Finding,
    context: DiagnosticContext
  ): Diagnostic;
}
```

---

# 36. Diagnostic Registry

```ts
interface DiagnosticRegistry {
  register(generator: DiagnosticGenerator): void;

  resolve(
    finding: Finding
  ): DiagnosticGenerator[];

  list(): DiagnosticGenerator[];
}
```

---

# 37. Diagnostic Pipeline

```text
Evaluation
 ↓
Finding
 ↓
Finding Classification
 ↓
Evidence Resolution
 ↓
Trace Construction
 ↓
Cause Analysis
 ↓
Impact Analysis
 ↓
Diagnostic
```

---

# 38. Diagnostic Context

```ts
interface DiagnosticContext {
  snapshot: MeasurementSnapshot;

  metrics: MetricResult<unknown>[];

  tokens?: DesignToken[];

  themes?: Theme[];

  components?: UIComponent[];

  rules: RuleDefinition[];

  configuration?: Record<string, unknown>;
}
```

---

# 39. Diagnostic Result

```ts
interface DiagnosticResult {
  findingId: string;

  diagnostic?: Diagnostic;

  rootCauseCandidates: RootCauseCandidate[];

  impact?: ImpactTrace;

  evidence: Evidence[];
}
```

---

# 40. Diagnostic Determinism

相同：

```text
Finding
+
MeasurementSnapshot
+
Metric Results
+
Token Graph
+
Theme
+
Rule
```

必须产生相同 Diagnostic。

即：

```text
Diagnose(X) = Diagnose(X)
```

V1.0 不允许基于随机 AI 输出产生正式 Diagnostic。

---

# 41. AI 的位置

未来可以增加：

```text
AI-assisted Diagnostic
```

但必须明确：

```text
AI Diagnostic
≠
Canonical Diagnostic
```

AI 可以：

- 辅助解释
- 总结 Finding
- 提取可能根因
- 生成自然语言报告

但不能覆盖：

```text
Measurement
Metric
Rule
Evaluation
```

的确定性结果。

---

# 42. Diagnostic Example

输入：

```text
Button
foreground = #777777
background = #FFFFFF
```

Metric：

```text
COLOR.CONTRAST = 4.48
```

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
contrast >= 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```text
Contrast ratio does not meet the configured minimum.
```

Diagnostic：

```text
Type:
ACCESSIBILITY

Evidence:
foreground = #777777
background = #FFFFFF
contrast = 4.48

Rule:
contrast >= 4.5

Cause:
Insufficient effective foreground/background contrast.

Confidence:
DIRECT
```

---

# 43. Token Example

```text
Button
 ↓
button.primary.text
 ↓
color.text.secondary
 ↓
#777777
```

Diagnostic：

```text
Finding
 ↓
Contrast Failure
 ↓
Resolved Token
 ↓
color.text.secondary
```

可以报告：

```text
The evaluated foreground color is resolved
from token color.text.secondary.
```

但不直接认定该 Token 必须修改。

---

# 44. Theme Example

```text
Theme: dark
 ↓
semantic token
 ↓
component token
 ↓
Button
 ↓
Contrast FAIL
```

Diagnostic：

```text
Theme context contributes to the evaluated
token resolution.
```

如果多个组件同时受影响：

```text
Impact Trace
```

可以识别共享 Token。

---

# 45. Finding Deduplication

同一：

```text
subject
+
rule
+
snapshot
```

默认只生成一个 Finding。

Fingerprint：

```text
SHA-256(
snapshotId
+
subjectId
+
ruleId
+
ruleVersion
)
```

用于去重。

---

# 46. Regression

两个 Evaluation：

```text
Snapshot A
Snapshot B
```

可以比较：

```text
Finding A
Finding B
```

状态变化：

```text
FAIL → PASS
```

表示问题消失。

```text
PASS → FAIL
```

表示新增回归。

```text
FAIL → FAIL
```

表示问题仍存在。

---

# 47. Finding State Transition

```text
             ┌──────────┐
             │ DETECTED │
             └────┬─────┘
                  ↓
             DIAGNOSED
                  ↓
             RESOLVED
                  ↓
             VERIFIED
```

重新检测：

```text
VERIFIED
   ↓
FAIL
```

则创建新的当前状态，但保留历史。

---

# 48. Historical Trace

Finding 历史必须保留：

```text
snapshot
rule version
metric version
configuration
diagnostic version
```

这样可以回答：

> 为什么当时这个页面被判定为 FAIL？

---

# 49. Diagnostic Report

```ts
interface DiagnosticReport {
  findings: Finding[];

  diagnostics: Diagnostic[];

  rootCauses: RootCauseCandidate[];

  impacts: ImpactTrace[];

  summary: DiagnosticSummary;
}
```

---

# 50. Diagnostic Summary

```ts
interface DiagnosticSummary {
  findingCount: number;

  diagnosedCount: number;

  directCauseCount: number;

  inferredCauseCount: number;

  unknownCauseCount: number;

  affectedTokenCount: number;

  affectedComponentCount: number;

  affectedThemeCount: number;
}
```

---

# 51. V1.0 官方 Diagnostic Types

初始 Registry：

```text
DIAGNOSTIC.ACCESSIBILITY
DIAGNOSTIC.COLOR
DIAGNOSTIC.TYPOGRAPHY
DIAGNOSTIC.GEOMETRY
DIAGNOSTIC.SPACING
DIAGNOSTIC.TOKEN
DIAGNOSTIC.COMPONENT
DIAGNOSTIC.THEME
```

---

# 52. UIQ 完整解释链

至此：

```text
┌─────────────────────────┐
│ Measurement             │
│ "what was observed"     │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Metric                  │
│ "how much"              │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Rule                    │
│ "what is required"      │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Evaluation              │
│ "does it comply"        │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Finding                 │
│ "what is wrong"         │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Diagnostic              │
│ "why / where"           │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Recommendation          │
│ "what may be changed"   │
└─────────────────────────┘
```

---

# 53. Architecture Freeze

UIQ V1.0 至此不新增 Diagnostic Core Layer。

正式扩展点仅保留：

```text
Metric Registry
Rule Registry
Policy Profile
Diagnostic Registry
Adapter Registry
Token Registry
Theme Registry
Conformance Registry
```

Diagnostic 本身是既有架构中的正式能力，不构成新的平台级架构层。

---

# 54. 当前 UIQ 语义闭环

目前已经形成：

```text
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

而：

```text
Token
Theme
Component
```

通过 Evidence / Trace / Impact 接入。

因此 UIQ 已经能够完成：

```text
实际 UI
 ↓
量化
 ↓
规范判断
 ↓
问题发现
 ↓
证据追踪
 ↓
根因候选
 ↓
影响范围
```

---

# 55. 最终设计原则

UIQ 不回答：

> “这个 UI 好不好看？”

UIQ 回答：

> **“这个 UI 实际是什么样，它有哪些可测量属性，它是否满足明确规则，哪里不满足，有哪些证据，以及问题可能来自哪里。”**

这是 UIQ 作为 **UI Design Quantification System** 的核心边界。

---

# 56. 下一阶段

下一阶段进入：

**UIQ-TST-01《Conformance & Golden Test Specification V1.0》**

重点将不是再增加架构，而是验证目前已经定义的：

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

是否真正具有：

- 可测试性
- 可重复性
- 浏览器一致性
- 数值容差控制
- Schema 一致性
- Rule Golden Cases
- Regression
- Cross-browser Conformance
- Snapshot Reproducibility

并以测试体系作为 **UIQ V1.0 的最终收敛机制**。