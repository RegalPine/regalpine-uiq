# UIQ-IMPL-03
## Core Contracts & Runtime Kernel Implementation Specification

**文档编号：** UIQ-IMPL-03  
**版本：** V1.0.0  
**状态：** Implementation Baseline  
**前置规范：**
- UIQ-FM-01
- UIQ-MR-01
- UIQ-ER-02
- UIQ-DG-01
- UIQ-TST-01
- UIQ-IMPL-02

---

# 1. 目标

本规范实现 UIQ 最小、稳定、平台无关的 Runtime Kernel：

```text
@uiq/core
```

Core 只负责：

```text
Entity
Measurement
Metric Contract
Rule Contract
Evaluation Contract
Finding Contract
Diagnostic Contract
Registry Contract
Execution Context
Fingerprint Contract
```

Core 不负责：

```text
Color Calculation
DOM Measurement
CSS Parsing
Token Resolution
Theme Calculation
Browser API
UI Rendering
Recommendation
AI
```

---

# 2. Core 设计原则

## 2.1 Core 是契约，不是算法中心

```text
@uiq/core
     │
     ├── Domain Contracts
     ├── Runtime Contracts
     └── Registry Contracts
```

而不是：

```text
@uiq/core
     ├── Color
     ├── Geometry
     ├── Browser
     ├── Token
     └── UI
```

---

# 3. 最终目录

```text
packages/core/
│
├── package.json
├── tsconfig.json
│
└── src/
    │
    ├── entity/
    │   ├── EntityId.ts
    │   ├── EntityType.ts
    │   └── UIQEntity.ts
    │
    ├── measurement/
    │   ├── Measurement.ts
    │   ├── MeasurementSource.ts
    │   ├── MeasurementStatus.ts
    │   └── MeasurementSnapshot.ts
    │
    ├── metric/
    │   ├── MetricKind.ts
    │   ├── MetricDependency.ts
    │   ├── MetricDefinition.ts
    │   ├── MetricResult.ts
    │   └── MetricRegistry.ts
    │
    ├── rule/
    │   ├── ComparisonOperator.ts
    │   ├── NumericRange.ts
    │   ├── Tolerance.ts
    │   ├── Applicability.ts
    │   ├── Severity.ts
    │   ├── RuleDefinition.ts
    │   ├── RuleConfiguration.ts
    │   └── RuleRegistry.ts
    │
    ├── evaluation/
    │   ├── EvaluationState.ts
    │   ├── EvaluationResult.ts
    │   └── EvaluationContext.ts
    │
    ├── finding/
    │   ├── FindingState.ts
    │   ├── FindingType.ts
    │   ├── Evidence.ts
    │   └── Finding.ts
    │
    ├── diagnostic/
    │   ├── DiagnosticType.ts
    │   ├── DiagnosticCause.ts
    │   └── Diagnostic.ts
    │
    ├── execution/
    │   ├── ExecutionContext.ts
    │   └── EngineInfo.ts
    │
    ├── fingerprint/
    │   └── fingerprint.ts
    │
    └── index.ts
```

---

# 4. Entity

## 4.1 EntityId

```ts
export type EntityId = string;
```

V1.0 不强制 UUID。

原因：

```text
DOM → CSS → Token → Component
```

实际系统经常需要稳定业务 ID。

因此：

```text
EntityId
```

只要求：

- 非空
- 在当前 Scope 内唯一
- 可序列化
- 可用于 Trace

---

# 5. EntityType

```ts
export type EntityType =
  | "PROJECT"
  | "PAGE"
  | "REGION"
  | "COMPONENT"
  | "ELEMENT"
  | "CONTENT"
  | "INTERACTION"
  | "TOKEN"
  | "THEME";
```

---

# 6. UIQEntity

```ts
export interface UIQEntity {
  readonly id: EntityId;
  readonly type: EntityType;
}
```

不要在 Core Entity 中加入：

```text
name
label
DOM element
React component
Vue component
CSS selector
```

这些属于 Adapter 或 Application。

---

# 7. Measurement

```ts
export interface Measurement<T = unknown> {
  readonly id: string;

  readonly subjectId: EntityId;

  readonly type: string;

  readonly value: T;

  readonly unit?: string;

  readonly source: MeasurementSource;

  readonly status: MeasurementStatus;

  readonly timestamp: number;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

---

# 8. MeasurementSource

```ts
export interface MeasurementSource {
  readonly type:
    | "BROWSER"
    | "STATIC"
    | "TOKEN"
    | "IMPORT"
    | "MANUAL"
    | "OTHER";

  readonly adapter?: string;

  readonly version?: string;
}
```

Browser 例如：

```json
{
  "type": "BROWSER",
  "adapter": "@uiq/browser",
  "version": "1.0.0"
}
```

---

# 9. MeasurementStatus

```ts
export type MeasurementStatus =
  | "AVAILABLE"
  | "UNKNOWN"
  | "ERROR";
```

---

# 10. MeasurementSnapshot

MeasurementSnapshot 是 UIQ 可重复分析的基础。

```ts
export interface MeasurementSnapshot {
  readonly id: string;

  readonly capturedAt: number;

  readonly source: MeasurementSource;

  readonly environment?: MeasurementEnvironment;

  readonly measurements: readonly Measurement[];
}
```

---

# 11. MeasurementEnvironment

```ts
export interface MeasurementEnvironment {
  readonly viewport?: {
    readonly width: number;
    readonly height: number;
  };

  readonly devicePixelRatio?: number;

  readonly zoom?: number;

  readonly browser?: {
    readonly name: string;
    readonly version: string;
  };
}
```

这意味着：

```text
同一个 UI
```

在：

```text
1280 × 720
```

和：

```text
1920 × 1080
```

不是同一个 Measurement Snapshot。

---

# 12. MetricKind

```ts
export type MetricKind =
  | "BASE"
  | "DERIVED"
  | "COMPOSITE"
  | "EXPERIMENTAL";
```

---

# 13. MetricDependency

```ts
export interface MetricDependency {
  readonly metricId: string;

  readonly version: string;

  readonly required: boolean;
}
```

例如：

```text
COLOR.CONTRAST
```

可能依赖：

```text
COLOR.SRGB
```

但具体依赖关系由 Metric 实现声明。

---

# 14. MetricDefinition

```ts
export interface MetricDefinition<T = unknown> {
  readonly id: string;

  readonly version: string;

  readonly kind: MetricKind;

  readonly dependencies: readonly MetricDependency[];

  calculate(
    context: MetricCalculationContext
  ): MetricResult<T>;
}
```

---

# 15. MetricCalculationContext

```ts
export interface MetricCalculationContext {
  readonly subjectId: EntityId;

  readonly snapshot: MeasurementSnapshot;

  readonly dependencies: ReadonlyMap<
    string,
    MetricResult
  >;
}
```

Metric 不允许访问：

```text
window
document
HTMLElement
CSSStyleDeclaration
```

这些全部属于 Measurement Adapter。

---

# 16. MetricResult

```ts
export interface MetricResult<T = unknown> {
  readonly metricId: string;

  readonly metricVersion: string;

  readonly subjectId: EntityId;

  readonly value?: T;

  readonly unit?: string;

  readonly status:
    | "AVAILABLE"
    | "UNKNOWN"
    | "ERROR";

  readonly dependencies: readonly MetricDependency[];

  readonly fingerprint: string;

  readonly metadata?: Readonly<
    Record<string, unknown>
  >;
}
```

---

# 17. Metric Result 不包含 Evaluation

禁止：

```ts
interface MetricResult {
  value: number;
  pass: boolean;
}
```

正确：

```text
MetricResult
      ↓
Rule
      ↓
EvaluationResult
```

这样：

```text
5.17
```

仍然只是：

```text
5.17
```

至于：

```text
PASS
FAIL
WARN
```

必须由 Rule 决定。

---

# 18. MetricRegistry

```ts
export interface MetricRegistry {
  register<T>(
    metric: MetricDefinition<T>
  ): void;

  get(
    id: string,
    version: string
  ): MetricDefinition | undefined;

  has(
    id: string,
    version: string
  ): boolean;

  list(): readonly MetricDefinition[];
}
```

---

# 19. Registry 默认实现

```ts
export class DefaultMetricRegistry
  implements MetricRegistry {

  private readonly metrics =
    new Map<string, MetricDefinition>();

  register(
    metric: MetricDefinition
  ): void {
    const key =
      `${metric.id}@${metric.version}`;

    if (this.metrics.has(key)) {
      throw new Error(
        `Metric already registered: ${key}`
      );
    }

    this.metrics.set(key, metric);
  }

  get(
    id: string,
    version: string
  ): MetricDefinition | undefined {
    return this.metrics.get(
      `${id}@${version}`
    );
  }

  has(
    id: string,
    version: string
  ): boolean {
    return this.metrics.has(
      `${id}@${version}`
    );
  }

  list(): readonly MetricDefinition[] {
    return [...this.metrics.values()];
  }
}
```

---

# 20. Registry 原则

Registry 不负责：

```text
自动版本选择
最新版本选择
兼容版本推断
Metric 执行
Metric 排序
```

例如：

```text
COLOR.CONTRAST@1.0.0
COLOR.CONTRAST@1.1.0
```

必须明确指定版本。

---

# 21. ComparisonOperator

```ts
export type ComparisonOperator =
  | "EQ"
  | "NE"
  | "GT"
  | "GTE"
  | "LT"
  | "LTE"
  | "IN"
  | "NOT_IN";
```

---

# 22. NumericRange

```ts
export interface NumericRange {
  readonly min?: number;
  readonly max?: number;

  readonly minInclusive?: boolean;
  readonly maxInclusive?: boolean;
}
```

例如：

```json
{
  "min": 4.5,
  "minInclusive": true
}
```

表示：

```text
value >= 4.5
```

---

# 23. Tolerance

```ts
export type ToleranceType =
  | "ABSOLUTE"
  | "RELATIVE";

export interface Tolerance {
  readonly type: ToleranceType;
  readonly value: number;
}
```

Tolerance 的用途：

```text
数值计算稳定性
```

不是：

```text
放宽设计规范
```

---

# 24. Severity

```ts
export type Severity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
```

Severity 与 EvaluationState 必须保持独立。

例如：

```text
UNKNOWN + HIGH
```

是合法状态。

---

# 25. Applicability

```ts
export type Applicability =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "UNKNOWN";
```

---

# 26. RuleDefinition

```ts
export interface RuleDefinition {
  readonly id: string;

  readonly version: string;

  readonly metricId: string;

  readonly metricVersion: string;

  readonly operator?: ComparisonOperator;

  readonly threshold?: number;

  readonly range?: NumericRange;

  readonly tolerance?: Tolerance;

  readonly severity: Severity;

  readonly applicability:
    ApplicabilityDefinition;
}
```

---

# 27. ApplicabilityDefinition

```ts
export interface ApplicabilityDefinition {
  evaluate(
    context: RuleApplicabilityContext
  ): Applicability;
}
```

Context：

```ts
export interface RuleApplicabilityContext {
  readonly subjectId: EntityId;

  readonly snapshot: MeasurementSnapshot;

  readonly metricResult: MetricResult;
}
```

---

# 28. RuleConfiguration

Rule Definition 和 Configuration 分离。

```ts
export interface RuleConfiguration {
  readonly ruleId: string;

  readonly ruleVersion: string;

  readonly values:
    Readonly<Record<string, unknown>>;
}
```

例如：

```json
{
  "ruleId":
    "ACCESSIBILITY.CONTRAST.WCAG_AA",

  "ruleVersion": "1.0.0",

  "values": {
    "minimumRatio": 4.5
  }
}
```

---

# 29. EvaluationState

```ts
export type EvaluationState =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "NOT_APPLICABLE"
  | "UNKNOWN"
  | "ERROR";
```

---

# 30. EvaluationResult

```ts
export interface EvaluationResult {
  readonly ruleId: string;

  readonly ruleVersion: string;

  readonly subjectId: EntityId;

  readonly state: EvaluationState;

  readonly severity: Severity;

  readonly metricResult: MetricResult;

  readonly evidence: readonly Evidence[];

  readonly fingerprint: string;

  readonly message?: string;
}
```

---

# 31. Evidence

Evidence 是 Evaluation 和 Diagnostic 的共同基础。

```ts
export type EvidenceType =
  | "METRIC"
  | "MEASUREMENT"
  | "TOKEN"
  | "DOM"
  | "RULE_CONFIGURATION";
```

```ts
export interface Evidence {
  readonly id: string;

  readonly type: EvidenceType;

  readonly referenceId: string;

  readonly relation:
    | "MEASURED_FROM"
    | "DERIVED_FROM"
    | "EVALUATED_BY"
    | "RESOLVED_FROM"
    | "DEFINED_BY"
    | "USED_BY"
    | "OVERRIDES"
    | "DEVIATES_FROM";
}
```

---

# 32. FindingState

```ts
export type FindingState =
  | "DETECTED"
  | "DIAGNOSED"
  | "RESOLVED"
  | "VERIFIED";
```

应用层如果需要人工确认，可以扩展：

```text
ACKNOWLEDGED
```

但不改变 Core V1.0 Finding 生命周期。

---

# 33. FindingType

```ts
export type FindingType =
  | "VALUE_VIOLATION"
  | "ACCESSIBILITY"
  | "TOKEN_DEVIATION"
  | "COMPONENT_DEVIATION"
  | "THEME_DEVIATION"
  | "LAYOUT_RELATIONSHIP"
  | "TYPOGRAPHY"
  | "COLOR"
  | "UNKNOWN_CAUSE"
  | "EXECUTION_ERROR";
```

---

# 34. Finding

```ts
export interface Finding {
  readonly id: string;

  readonly fingerprint: string;

  readonly type: FindingType;

  readonly state: FindingState;

  readonly severity: Severity;

  readonly subjectId: EntityId;

  readonly evaluation: EvaluationResult;

  readonly evidence: readonly Evidence[];

  readonly createdAt: number;

  readonly updatedAt: number;
}
```

---

# 35. Finding 生成原则

默认：

```text
FAIL
  ↓
Finding
```

```text
WARN
  ↓
Finding
```

默认不将：

```text
PASS
```

生成 Finding。

对于：

```text
UNKNOWN
```

由 Policy Profile 决定是否生成 Finding。

---

# 36. DiagnosticType

```ts
export type DiagnosticType =
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

# 37. DiagnosticCause

```ts
export type DiagnosticCause =
  | "MEASUREMENT"
  | "METRIC"
  | "TOKEN"
  | "COMPONENT"
  | "THEME"
  | "CONFIGURATION"
  | "UNKNOWN";
```

---

# 38. Diagnostic

```ts
export interface Diagnostic {
  readonly id: string;

  readonly findingId: string;

  readonly type: DiagnosticType;

  readonly cause: DiagnosticCause;

  readonly confidence:
    | "DIRECT"
    | "SUPPORTED"
    | "INFERRED"
    | "UNKNOWN";

  readonly evidence:
    readonly Evidence[];

  readonly explanation: string;
}
```

Diagnostic 不修改：

```text
EvaluationResult
```

---

# 39. ExecutionContext

```ts
export interface ExecutionContext {
  readonly engine: EngineInfo;

  readonly snapshot: MeasurementSnapshot;

  readonly metrics: MetricRegistry;

  readonly rules: RuleRegistry;

  readonly configuration:
    Readonly<Record<string, unknown>>;
}
```

---

# 40. EngineInfo

```ts
export interface EngineInfo {
  readonly name: string;

  readonly version: string;
}
```

例如：

```json
{
  "name": "UIQ",
  "version": "1.0.0"
}
```

---

# 41. RuleRegistry

```ts
export interface RuleRegistry {
  register(
    rule: RuleDefinition
  ): void;

  get(
    id: string,
    version: string
  ): RuleDefinition | undefined;

  has(
    id: string,
    version: string
  ): boolean;

  list(): readonly RuleDefinition[];
}
```

默认实现与 MetricRegistry 保持相同原则。

---

# 42. Fingerprint

UIQ 不允许依赖随机 UUID 作为结果身份。

结果指纹必须来自：

```text
Stable Input
+
Version
+
Configuration
```

推荐：

```ts
export interface FingerprintInput {
  readonly type: string;

  readonly version: string;

  readonly subjectId: string;

  readonly data: unknown;
}
```

---

# 43. Fingerprint Algorithm

V1.0 推荐：

```text
SHA-256
```

逻辑：

```text
Canonical JSON
       ↓
UTF-8
       ↓
SHA-256
       ↓
Fingerprint
```

必须使用 Canonical JSON，避免：

```json
{
  "a": 1,
  "b": 2
}
```

和：

```json
{
  "b": 2,
  "a": 1
}
```

产生不同结果。

---

# 44. Core Runtime Boundary

Core 可以提供：

```text
Contracts
Registries
Evaluation primitives
Fingerprint utilities
```

但不得提供：

```text
Browser Runtime
Node Runtime
React Runtime
Vue Runtime
```

因此 Core 可以运行在：

```text
Browser
Node.js
Deno
Bun
```

只要运行环境提供必要的 ECMAScript 能力。

---

# 45. index.ts

所有公共 API 从：

```text
src/index.ts
```

导出。

例如：

```ts
export * from "./entity/EntityId";
export * from "./entity/EntityType";
export * from "./entity/UIQEntity";

export * from "./measurement/Measurement";
export * from "./measurement/MeasurementSnapshot";

export * from "./metric/MetricDefinition";
export * from "./metric/MetricResult";
export * from "./metric/MetricRegistry";

export * from "./rule/RuleDefinition";
export * from "./rule/RuleConfiguration";
export * from "./rule/RuleRegistry";

export * from "./evaluation/EvaluationResult";

export * from "./finding/Finding";

export * from "./diagnostic/Diagnostic";

export * from "./execution/ExecutionContext";

export * from "./fingerprint/fingerprint";
```

---

# 46. Core Public API 原则

外部包：

```ts
import {
  MetricDefinition,
  MetricResult,
  RuleDefinition,
  EvaluationResult
} from "@uiq/core";
```

不允许依赖：

```text
packages/core/src/internal/*
```

因此未来可以调整内部实现而不破坏公共契约。

---

# 47. Core Unit Tests

第一批测试：

```text
core/
├── entity.test.ts
├── measurement.test.ts
├── metric-registry.test.ts
├── rule-registry.test.ts
├── evaluation-state.test.ts
├── finding.test.ts
└── fingerprint.test.ts
```

---

# 48. Registry Tests

必须验证：

```text
register
get
has
list
duplicate registration
version isolation
```

例如：

```text
COLOR.CONTRAST@1.0.0
COLOR.CONTRAST@1.1.0
```

可以同时存在。

---

# 49. Fingerprint Tests

必须验证：

```text
same input
→ same fingerprint
```

以及：

```text
version change
→ different fingerprint
```

```text
configuration change
→ different fingerprint
```

```text
subject change
→ different fingerprint
```

---

# 50. Contract Tests

所有实现 Metric 必须满足：

```text
Metric Contract
```

所有实现 Rule 必须满足：

```text
Rule Contract
```

所有 Registry 必须满足：

```text
Registry Contract
```

因此未来可以替换实现：

```text
DefaultMetricRegistry
        ↓
CustomMetricRegistry
```

而不会影响其他模块。

---

# 51. Architecture Test

必须增加依赖架构测试：

```text
core
```

不得 import：

```text
react
vue
radix
browser
node
color
geometry
tokens
theme
```

这是 UIQ 架构完整性测试的一部分。

---

# 52. Core Acceptance Test

最终 Core 必须通过：

```text
AC-CORE-01
Core can compile without DOM

AC-CORE-02
Core can run without React/Vue

AC-CORE-03
Metric contract contains no evaluation semantics

AC-CORE-04
Rule contract references explicit Metric version

AC-CORE-05
UNKNOWN is distinct from PASS

AC-CORE-06
NOT_APPLICABLE is distinct from PASS

AC-CORE-07
Finding preserves Evaluation

AC-CORE-08
Diagnostic cannot modify Evaluation

AC-CORE-09
Registry preserves version identity

AC-CORE-10
Fingerprint is deterministic
```

---

# 53. Core V1.0 完成后的实际依赖

```text
@uiq/core
     │
     ├──────────────┐
     ▼              ▼
@uiq/color     @uiq/geometry
     │              │
     └──────┬───────┘
            ▼
      @uiq/measurement
            │
            ▼
       @uiq/metrics
            │
            ▼
        @uiq/rules
            │
            ▼
      @uiq/diagnostic
```

Core 本身到此停止增长。

---

# 54. 下一实现边界

完成 Core 后，下一阶段只实现：

```text
UIQ-IMPL-04
Color Mathematics Implementation
```

范围：

```text
HEX
RGBA
sRGB
Linear RGB
XYZ
OKLab
OKLCH
Relative Luminance
Contrast
ΔL
ΔC
ΔH
Gamut
```

重点不是新增架构，而是把：

```text
UIQ-MR-01
+
UIQ-METRIC-01
```

转换成经过 Golden Test 验证的纯数学实现。

---

# 55. Phase 1 收敛结论

Core 到此冻结：

```text
                 @uiq/core
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
 Measurement      Metric          Rule
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                 Evaluation
                     │
                     ▼
                  Finding
                     │
                     ▼
                Diagnostic
```

Core 的职责只有：

> **定义 UIQ 的稳定语义契约，并保证不同实现之间可以交换、追踪和验证这些对象。**

因此后续 UIQ 的“智能程度”不通过扩大 Core 实现，而通过：

```text
More Metrics
More Rules
Better Diagnostics
More Adapters
More Conformance Tests
```

实现。

**Phase 1：Core Contracts → 冻结。**