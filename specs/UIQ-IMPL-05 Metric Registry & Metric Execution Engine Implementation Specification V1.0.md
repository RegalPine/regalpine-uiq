# UIQ-IMPL-05
# Metric Registry & Metric Execution Engine Implementation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 3  
**Previous Specification:** UIQ-IMPL-04 Color Mathematics Implementation Specification V1.0  
**Next Specification:** UIQ-IMPL-06 Rule Evaluation Engine Implementation Specification V1.0

---

## 1. 文档目的

本规范定义 UIQ Metric Runtime 的实际实现方式，将已经冻结的：

```text
MeasurementSnapshot
        ↓
MetricDefinition
        ↓
MetricDependency
        ↓
MetricRegistry
        ↓
Metric Execution Engine
        ↓
MetricResult
        ↓
Fingerprint
```

实现为平台无关、确定性、可测试的 TypeScript 运行时。

本阶段不引入新的 UIQ 核心概念，不修改 UIQ 的：

- Measurement Model
- Metric Model
- Rule Model
- Evaluation Model
- Finding Model
- Diagnostic Model

本阶段的职责只有一个：

> **让 Metric 可以按照声明的依赖关系可靠、可重复地执行。**

---

# 2. 核心原则

## 2.1 Metric Engine 不负责评价

Metric Engine 只负责：

```text
Measurement
    ↓
Metric Calculation
    ↓
MetricResult
```

不负责：

```text
Metric
    ↓
Good / Bad
```

也不负责：

```text
Metric
    ↓
PASS / FAIL
```

评价由后续 Rule Engine 完成。

---

# 3. Metric Runtime 边界

## 3.1 输入

Metric Engine 接受：

```text
MeasurementSnapshot
MetricExecutionRequest
MetricRegistry
EngineInfo
```

---

## 3.2 输出

输出：

```text
MetricExecutionReport
```

其中包含：

```text
MetricResult[]
ExecutionMetadata
Fingerprint
```

---

## 3.3 禁止职责

Metric Engine 不得：

- 访问 DOM
- 调用 Browser API
- 读取 CSS
- 修改 UI
- 执行 Rule
- 产生 PASS/FAIL
- 产生 Finding
- 产生 Diagnostic
- 修改 Token
- 修改 Theme
- 进行颜色推荐
- 进行设计生成

因此：

```text
@uiq/metrics
```

必须保持平台无关。

---

# 4. Runtime 总体模型

```text
                 MetricRegistry
                      │
                      ▼
              Dependency Planner
                      │
                      ▼
             Execution Plan / DAG
                      │
                      ▼
        ┌─────────────────────────┐
        │ Metric Execution Engine │
        └─────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Metric A    Metric B    Metric C
          │           │           │
          └───────────┼───────────┘
                      ▼
                 MetricResult
                      │
                      ▼
                 Fingerprint
```

---

# 5. Metric Registry

## 5.1 Registry 职责

MetricRegistry 是 MetricDefinition 的唯一运行时注册中心。

职责：

1. 注册 Metric
2. 查询 Metric
3. 精确版本解析
4. 判断 Metric 是否存在
5. 返回 Metric Definition
6. 防止重复注册
7. 提供 Registry 快照

---

# 6. Metric Identity

Metric 唯一身份：

```text
MetricIdentity = MetricId + MetricVersion
```

例如：

```text
COLOR.SRGB@1.0.0
COLOR.OKLAB@1.0.0
COLOR.OKLCH@1.0.0
COLOR.CONTRAST@1.0.0
GEOMETRY.WIDTH@1.0.0
TYPOGRAPHY.FONT_SIZE@1.0.0
```

不得仅通过：

```text
metricId
```

执行一个具有多个版本的 Metric。

---

# 7. MetricRegistry Contract

```ts
export interface MetricRegistry {
  register<T>(definition: MetricDefinition<T>): void;

  get<T>(
    metricId: string,
    version: string
  ): MetricDefinition<T> | undefined;

  has(
    metricId: string,
    version: string
  ): boolean;

  list(): MetricDefinition<unknown>[];
}
```

---

# 8. Registry 不允许隐式版本升级

例如请求：

```text
COLOR.OKLAB@1.0.0
```

Registry 中只有：

```text
COLOR.OKLAB@1.1.0
```

不得自动替换。

结果：

```text
VERSION_NOT_FOUND
```

而不是：

```text
使用最新版本
```

原因是：

> UIQ 必须支持历史结果的确定性重现。

---

# 9. Registry 重复注册

以下情况必须报错：

```text
COLOR.OKLAB@1.0.0
COLOR.OKLAB@1.0.0
```

同一：

```text
MetricId + Version
```

只能对应一个 Definition。

---

# 10. Metric Dependency Graph

Metric 可以依赖其他 Metric。

例如：

```text
COLOR.SRGB
     ↓
COLOR.OKLAB
     ↓
COLOR.OKLCH
     ↓
COLOR.CHROMA
```

另一个例子：

```text
TYPOGRAPHY.FONT_SIZE
        ↓
TYPOGRAPHY.LINE_HEIGHT
```

因此 Metric Runtime 必须将 Metric Definition 转换为有向图。

---

# 11. Graph 模型

定义：

```text
G = (V, E)
```

其中：

```text
V = Metric Nodes
E = Dependency Edges
```

如果：

```text
A depends on B
```

则：

```text
B → A
```

表示：

```text
B 必须先执行
A 才能执行
```

---

# 12. DAG 要求

Metric Dependency Graph 必须是：

```text
Directed Acyclic Graph
```

即：

```text
DAG
```

不允许循环依赖。

非法：

```text
A → B
B → C
C → A
```

---

# 13. Cycle Detection

Registry 或 Execution Planner 在构建执行计划时必须检测 Cycle。

推荐使用 DFS 三状态算法：

```text
UNVISITED
VISITING
VISITED
```

如果：

```text
VISITING → VISITING
```

说明发现循环依赖。

---

# 14. Cycle Error

定义：

```ts
export class MetricDependencyCycleError extends Error {
  constructor(
    public readonly cycle: string[]
  ) {
    super(
      `Metric dependency cycle detected: ${cycle.join(" -> ")}`
    );
  }
}
```

例如：

```text
Metric dependency cycle detected:
A@1.0.0 -> B@1.0.0 -> C@1.0.0 -> A@1.0.0
```

必须保留完整路径。

---

# 15. Metric Execution Request

定义：

```ts
export interface MetricExecutionRequest {
  snapshot: MeasurementSnapshot;

  subjects: string[];

  metrics: MetricReference[];
}
```

其中：

```ts
export interface MetricReference {
  id: string;
  version: string;
}
```

---

# 16. 单对象执行

例如：

```ts
const request = {
  snapshot,
  subjects: ["button#submit"],
  metrics: [
    {
      id: "COLOR.CONTRAST",
      version: "1.0.0"
    }
  ]
};
```

执行：

```text
button#submit
      ↓
COLOR.CONTRAST@1.0.0
      ↓
MetricResult
```

---

# 17. 批量执行

UIQ 必须支持：

```text
N subjects × M metrics
```

例如：

```text
100 Components
×
20 Metrics
```

得到：

```text
2000 Metric executions
```

但不能简单创建 2000 个完全独立的执行上下文。

应通过：

```text
Snapshot
+
Metric
+
Subject
```

进行缓存。

---

# 18. Metric Execution Context

定义：

```ts
export interface MetricCalculationContext {
  subjectId: string;

  snapshot: MeasurementSnapshot;

  dependencies: ReadonlyMap<
    string,
    MetricResult<unknown>
  >;
}
```

Metric 只能通过：

```text
context.snapshot
context.subjectId
context.dependencies
```

获取输入。

---

# 19. Metric 不得直接访问其他 Registry

Metric Definition：

```ts
calculate(context)
```

不得：

```ts
registry.get(...)
```

原因：

Metric Definition 应保持纯粹。

依赖解析属于 Execution Engine。

因此：

```text
Registry
   ↓
Planner
   ↓
Execution Context
   ↓
Metric
```

而不是：

```text
Metric
   ↓
Registry
   ↓
Metric
```

---

# 20. Dependency Resolution

例如：

```text
COLOR.CONTRAST
```

依赖：

```text
COLOR.SRGB
```

Execution Engine 必须保证：

```text
COLOR.SRGB
        ↓
COLOR.CONTRAST
```

执行时：

```ts
context.dependencies.get(
  "COLOR.SRGB@1.0.0"
)
```

得到：

```text
MetricResult<SRGB>
```

---

# 21. Dependency Key

依赖必须使用：

```text
metricId@version
```

作为唯一 Key。

例如：

```text
COLOR.OKLAB@1.0.0
```

不能只使用：

```text
COLOR.OKLAB
```

---

# 22. Execution Plan

定义：

```ts
export interface MetricExecutionNode {
  metricId: string;
  version: string;
  dependencies: MetricReference[];
}
```

完整计划：

```ts
export interface MetricExecutionPlan {
  nodes: MetricExecutionNode[];
}
```

---

# 23. Topological Order

例如：

```text
A
↓
B
↓
C
```

计划必须为：

```text
A
B
C
```

对于：

```text
A → C
B → C
```

可以：

```text
A
B
C
```

也可以在并行实现中：

```text
A ─┐
   ├→ C
B ─┘
```

但最终结果顺序必须确定。

---

# 24. Deterministic Ordering

即使内部允许并行执行：

```text
A
B
```

最终输出必须按照稳定顺序排序。

推荐：

```text
subjectId
metricId
metricVersion
```

排序。

这样：

```text
Promise execution order
```

不会影响：

```text
MetricExecutionReport
```

---

# 25. Metric Cache

定义：

```ts
export interface MetricCache {
  get<T>(
    key: MetricCacheKey
  ): MetricResult<T> | undefined;

  set<T>(
    key: MetricCacheKey,
    result: MetricResult<T>
  ): void;

  clear(): void;
}
```

---

# 26. Cache Key

Metric Cache Key：

```text
Snapshot
+
Subject
+
Metric
+
Metric Version
```

推荐：

```ts
export interface MetricCacheKey {
  snapshotId: string;
  subjectId: string;
  metricId: string;
  metricVersion: string;
}
```

---

# 27. Cache 不得跨 Snapshot 污染

以下两个 Snapshot：

```text
snapshot-A
snapshot-B
```

即使：

```text
subjectId = button#submit
metric = COLOR.CONTRAST@1.0.0
```

也必须产生两个独立 Cache Key。

不能：

```text
snapshot-A result
        ↓
snapshot-B reuse
```

---

# 28. Cache Fingerprint

可以进一步生成：

```text
sha256(
  snapshotId
  +
  subjectId
  +
  metricId
  +
  metricVersion
)
```

作为内部 Cache Key。

---

# 29. MetricResult

Metric Result 使用此前 Core Contract：

```ts
export interface MetricResult<T> {
  metricId: string;
  metricVersion: string;

  subjectId: string;

  value?: T;

  unit?: string;

  status: MeasurementStatus;

  dependencies: MetricDependencyResult[];

  fingerprint: string;

  metadata?: Record<string, unknown>;
}
```

---

# 30. Metric Execution Status

Metric 执行必须支持：

```text
AVAILABLE
UNKNOWN
ERROR
```

---

# 31. AVAILABLE

表示：

```text
Metric 成功计算
```

例如：

```json
{
  "status": "AVAILABLE",
  "value": 5.17
}
```

---

# 32. UNKNOWN

UNKNOWN 表示：

> 输入存在，但无法得到可靠 Metric。

例如：

```text
背景是复杂 gradient
```

导致：

```text
COLOR.CONTRAST
```

无法可靠计算。

结果：

```json
{
  "status": "UNKNOWN"
}
```

不能假设：

```text
UNKNOWN = 0
```

也不能：

```text
UNKNOWN = PASS
```

---

# 33. ERROR

ERROR 表示执行本身发生异常，例如：

```text
Metric Definition bug
Type mismatch
Invalid dependency
Runtime exception
```

例如：

```json
{
  "status": "ERROR"
}
```

---

# 34. Unknown Propagation

如果 Metric B 依赖：

```text
Metric A
```

而：

```text
A = UNKNOWN
```

且 B 无法独立计算，则：

```text
B = UNKNOWN
```

例如：

```text
COLOR.OKLCH
      ↓
COLOR.HUE
```

如果：

```text
OKLCH = UNKNOWN
```

则：

```text
HUE = UNKNOWN
```

---

# 35. Error Isolation

如果：

```text
Metric A = ERROR
```

不能导致整个 Batch Execution 崩溃。

例如：

```text
A → B
C
D
```

如果：

```text
A = ERROR
```

则：

```text
B = ERROR / UNKNOWN
C = AVAILABLE
D = AVAILABLE
```

具体传播由 Metric Contract 决定。

---

# 36. Required Dependency

已有：

```ts
export interface MetricDependency {
  metricId: string;
  version: string;
  required: boolean;
}
```

如果：

```text
required = true
```

且 Dependency 不可用：

```text
AVAILABLE
```

是不允许的。

---

# 37. Optional Dependency

如果：

```text
required = false
```

Metric 可以在缺少该依赖时执行替代计算。

但必须由 Metric Definition 明确定义。

不得由 Engine 自动推断。

---

# 38. Metric Execution Engine

核心接口：

```ts
export interface MetricExecutionEngine {
  execute(
    request: MetricExecutionRequest
  ): MetricExecutionReport;
}
```

---

# 39. Execution Report

```ts
export interface MetricExecutionReport {
  snapshotId: string;

  results: MetricResult<unknown>[];

  execution: MetricExecutionMetadata;
}
```

---

# 40. Execution Metadata

```ts
export interface MetricExecutionMetadata {
  engine: EngineInfo;

  startedAt: string;

  completedAt: string;

  durationMs: number;

  requestedMetrics: number;

  executedMetrics: number;

  cachedMetrics: number;

  availableMetrics: number;

  unknownMetrics: number;

  errorMetrics: number;
}
```

---

# 41. Execution Pipeline

标准执行流程：

```text
1. Validate Request
       ↓
2. Resolve Metrics
       ↓
3. Build Dependency Graph
       ↓
4. Detect Cycles
       ↓
5. Build Execution Plan
       ↓
6. Execute Dependencies
       ↓
7. Execute Metrics
       ↓
8. Generate MetricResult
       ↓
9. Generate Fingerprint
       ↓
10. Cache Result
       ↓
11. Stable Sort
       ↓
12. Return Report
```

---

# 42. Request Validation

必须检查：

- Snapshot 是否存在
- Subject 是否存在
- Metric ID 是否为空
- Metric Version 是否为空
- Metric 是否注册
- Dependency Version 是否存在

---

# 43. Missing Metric

如果：

```text
COLOR.OKLAB@2.0.0
```

未注册：

不得：

```text
自动降级到 1.0.0
```

必须返回：

```text
METRIC_NOT_FOUND
```

---

# 44. Missing Measurement

例如：

```text
TYPOGRAPHY.FONT_SIZE
```

需要：

```text
fontSize
```

但 Snapshot 没有对应 Measurement。

Metric Result：

```text
UNKNOWN
```

而不是：

```text
ERROR
```

因为：

```text
计算条件不足
```

不是：

```text
执行错误
```

---

# 45. Type Validation

Dependency Result 必须符合 Metric Definition 期望类型。

例如：

```text
COLOR.OKLAB
```

期望：

```ts
OKLab
```

如果收到：

```ts
number
```

则：

```text
ERROR
```

---

# 46. Metric Purity

推荐 Metric Calculation：

```ts
calculate(context): MetricResultValue
```

满足：

```text
same input
      +
same Metric Version
      =
same output
```

Metric 不应依赖：

- 当前时间
- Random
- DOM 状态
- 全局 mutable state
- 网络请求
- Local Storage
- 浏览器环境

---

# 47. 时间依赖

Metric 不允许：

```ts
Date.now()
```

参与结果计算。

时间可以用于：

```text
Execution Metadata
```

但不得进入：

```text
Metric Value
```

---

# 48. Random

禁止：

```ts
Math.random()
```

参与 Metric Calculation。

否则无法进行 Golden Test 与 Regression Test。

---

# 49. Fingerprint

Metric Result 必须产生稳定 Fingerprint。

推荐：

```text
SHA-256(
  canonical(
    snapshotId,
    subjectId,
    metricId,
    metricVersion,
    dependencies,
    value,
    status
  )
)
```

---

# 50. Canonical Serialization

Fingerprint 不得依赖 JavaScript Object 属性偶然顺序。

必须使用稳定 Canonical JSON。

例如：

```json
{
  "metricId": "COLOR.CONTRAST",
  "metricVersion": "1.0.0",
  "subjectId": "button#submit",
  "status": "AVAILABLE",
  "value": 5.17
}
```

字段顺序必须规范化。

---

# 51. Fingerprint 用途

Fingerprint 用于：

- 缓存
- 重复检测
- 回归比较
- Snapshot 比较
- 审计
- Conformance
- Debug
- Result provenance

Fingerprint 不是业务 ID。

---

# 52. Metric Engine 不保存历史

V1.0：

```text
Metric Engine
```

是无状态执行引擎。

历史数据保存属于：

```text
Application
Persistence
Governance
```

未来扩展。

---

# 53. Batch Execution

支持：

```ts
subjects = [
  "button#submit",
  "button#cancel",
  "input#email",
  "input#password"
]
```

Metrics：

```text
COLOR.CONTRAST
TYPOGRAPHY.FONT_SIZE
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
```

Engine 应自动复用：

```text
Metric Definition
Metric Plan
Cache
```

---

# 54. Plan Reuse

同一个：

```text
MetricExecutionRequest
```

中：

```text
subject-A
subject-B
subject-C
```

可以共享：

```text
Dependency Plan
```

因为 Plan 与 Subject Value 无关。

---

# 55. Plan Cache

可以缓存：

```text
MetricExecutionPlan
```

Key：

```text
requested Metric IDs + Versions
```

但不能把：

```text
MetricResult
```

混入 Plan Cache。

---

# 56. Parallel Execution

V1.0：

```text
parallel execution = OPTIONAL
```

默认实现可以使用：

```text
sequential topological execution
```

稳定性优先。

未来可以：

```text
independent nodes
        ↓
parallel execution
```

但输出必须 deterministic。

---

# 57. Parallelization Boundary

例如：

```text
A ─────→ C
B ─────→ C
```

A 和 B 可以并行：

```text
A ─┐
   ├→ C
B ─┘
```

但：

```text
C
```

必须等待 A/B。

---

# 58. Metrics Package Dependency

保持：

```text
@uiq/metrics
        ↓
@uiq/core
@uiq/color
@uiq/geometry
@uiq/measurement
```

不得：

```text
@uiq/metrics
        ↓
@uiq/rules
@uiq/diagnostic
@uiq/browser
```

---

# 59. Rule Engine 边界

严格保持：

```text
Metric Engine
       ↓
MetricResult
       ↓
Rule Engine
```

禁止：

```text
Metric Engine
       ↓
Rule
```

---

# 60. COLOR Metrics

Phase 2 已经实现的 Color Mathematics 将作为 Metric 的输入能力。

例如：

```text
COLOR.SRGB
COLOR.OKLAB
COLOR.OKLCH
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
COLOR.CONTRAST
```

Metric Engine 负责调度。

Color Mathematics 负责计算。

---

# 61. TYPOGRAPHY Metrics

Metric Engine 可以注册：

```text
TYPOGRAPHY.FONT_SIZE
TYPOGRAPHY.FONT_WEIGHT
TYPOGRAPHY.LINE_HEIGHT
TYPOGRAPHY.LETTER_SPACING
TYPOGRAPHY.TEXT_MEASURE
TYPOGRAPHY.SCALE_RATIO
```

Browser Measurement 负责提供：

```text
computed CSS values
```

Metric 负责：

```text
normalize
derive
calculate
```

---

# 62. GEOMETRY Metrics

Metric Engine 可以注册：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
GEOMETRY.ASPECT_RATIO
GEOMETRY.CENTER_DISTANCE
GEOMETRY.EDGE_DISTANCE
GEOMETRY.OVERLAP
```

Browser Measurement 提供：

```text
DOMRect
```

Metric 负责计算派生关系。

---

# 63. Metric Definition Example

```ts
const areaMetric: MetricDefinition<number> = {
  id: "GEOMETRY.AREA",
  version: "1.0.0",
  kind: "DERIVED",

  dependencies: [
    {
      metricId: "GEOMETRY.WIDTH",
      version: "1.0.0",
      required: true
    },
    {
      metricId: "GEOMETRY.HEIGHT",
      version: "1.0.0",
      required: true
    }
  ],

  calculate(context) {
    const width =
      context.dependencies.get(
        "GEOMETRY.WIDTH@1.0.0"
      );

    const height =
      context.dependencies.get(
        "GEOMETRY.HEIGHT@1.0.0"
      );

    if (
      width?.status !== "AVAILABLE" ||
      height?.status !== "AVAILABLE"
    ) {
      return {
        status: "UNKNOWN"
      };
    }

    return {
      status: "AVAILABLE",
      value: width.value! * height.value!,
      unit: "px²"
    };
  }
};
```

---

# 64. Dependency Result 不得重新计算

例如：

```text
GEOMETRY.AREA
```

已经依赖：

```text
WIDTH
HEIGHT
```

不得在 AREA 中再次：

```ts
element.getBoundingClientRect()
```

也不得重新计算：

```text
width
height
```

Metric Engine 应保证：

```text
Measurement → Width
Measurement → Height
Width + Height → Area
```

---

# 65. Measurement 与 Metric 分工

必须保持：

```text
Measurement
=
观察到什么
```

例如：

```text
width = 120px
```

而：

```text
Metric
=
从观察值计算什么
```

例如：

```text
area = 120 × 40
```

---

# 66. Browser Independence

Metric Engine 不知道：

```text
HTMLElement
CSSStyleDeclaration
DOMRect
Window
Document
```

因此可以运行于：

```text
Browser
Node.js
CLI
Test
CI
Server
```

只要提供：

```text
MeasurementSnapshot
```

---

# 67. Snapshot Isolation

一次 Metric Execution 必须绑定一个：

```text
MeasurementSnapshot
```

Metric 不允许执行过程中读取新的 Snapshot。

例如：

```text
Snapshot A
     ↓
Execution
     ↓
所有 Metrics 使用 A
```

不得：

```text
Metric A → Snapshot A
Metric B → Snapshot B
```

除非是两个明确独立的 Execution。

---

# 68. Deterministic Execution

满足：

```text
same Snapshot
+
same Metric versions
+
same implementation version
=
same Metric Results
```

允许：

```text
Execution Timestamp
```

不同。

但 Timestamp 不得影响 Metric Value。

---

# 69. Execution Error Boundary

单个 Metric 执行必须进行异常隔离：

```ts
try {
  executeMetric(...)
} catch (error) {
  return createErrorResult(...)
}
```

不能因为：

```text
一个 Metric throw
```

而导致：

```text
整个 Report throw
```

---

# 70. Error Result

```ts
{
  metricId,
  metricVersion,
  subjectId,
  status: "ERROR",
  dependencies,
  fingerprint,
  metadata: {
    errorType,
    message
  }
}
```

错误信息不得泄露不必要的环境敏感信息。

---

# 71. Execution Report Example

```json
{
  "snapshotId": "snapshot-001",
  "results": [
    {
      "metricId": "GEOMETRY.WIDTH",
      "metricVersion": "1.0.0",
      "subjectId": "button#submit",
      "status": "AVAILABLE",
      "value": 120,
      "unit": "px"
    },
    {
      "metricId": "GEOMETRY.HEIGHT",
      "metricVersion": "1.0.0",
      "subjectId": "button#submit",
      "status": "AVAILABLE",
      "value": 40,
      "unit": "px"
    },
    {
      "metricId": "GEOMETRY.AREA",
      "metricVersion": "1.0.0",
      "subjectId": "button#submit",
      "status": "AVAILABLE",
      "value": 4800,
      "unit": "px²"
    }
  ]
}
```

---

# 72. Package Structure

Phase 3 对：

```text
packages/metrics/
```

进行实现。

建议：

```text
packages/metrics/
├── src/
│   ├── registry/
│   │   ├── DefaultMetricRegistry.ts
│   │   └── MetricRegistryImpl.ts
│   │
│   ├── planner/
│   │   ├── MetricDependencyGraph.ts
│   │   ├── MetricExecutionNode.ts
│   │   ├── MetricExecutionPlan.ts
│   │   ├── buildExecutionPlan.ts
│   │   └── detectCycles.ts
│   │
│   ├── execution/
│   │   ├── MetricExecutionEngine.ts
│   │   ├── MetricExecutionRequest.ts
│   │   ├── MetricExecutionReport.ts
│   │   ├── MetricExecutionMetadata.ts
│   │   └── executeMetric.ts
│   │
│   ├── cache/
│   │   ├── MetricCache.ts
│   │   ├── MetricCacheKey.ts
│   │   └── InMemoryMetricCache.ts
│   │
│   ├── fingerprint/
│   │   └── metricFingerprint.ts
│   │
│   ├── errors/
│   │   ├── MetricNotFoundError.ts
│   │   ├── MetricDependencyCycleError.ts
│   │   └── MetricExecutionError.ts
│   │
│   └── index.ts
│
└── tests/
    ├── registry/
    ├── planner/
    ├── execution/
    ├── cache/
    ├── fingerprint/
    └── integration/
```

---

# 73. Default Registry

定义：

```ts
export function createDefaultMetricRegistry(): MetricRegistry
```

默认注册：

```text
COLOR.SRGB@1.0.0
COLOR.OKLAB@1.0.0
COLOR.OKLCH@1.0.0
COLOR.LIGHTNESS@1.0.0
COLOR.CHROMA@1.0.0
COLOR.HUE@1.0.0
COLOR.CONTRAST@1.0.0

TYPOGRAPHY.FONT_SIZE@1.0.0
TYPOGRAPHY.FONT_WEIGHT@1.0.0
TYPOGRAPHY.LINE_HEIGHT@1.0.0
TYPOGRAPHY.LETTER_SPACING@1.0.0
TYPOGRAPHY.TEXT_MEASURE@1.0.0
TYPOGRAPHY.SCALE_RATIO@1.0.0

GEOMETRY.WIDTH@1.0.0
GEOMETRY.HEIGHT@1.0.0
GEOMETRY.AREA@1.0.0
GEOMETRY.ASPECT_RATIO@1.0.0
GEOMETRY.CENTER_DISTANCE@1.0.0
GEOMETRY.EDGE_DISTANCE@1.0.0
GEOMETRY.OVERLAP@1.0.0
```

---

# 74. MVP Metric Implementation顺序

推荐：

### M1

```text
WIDTH
HEIGHT
AREA
```

### M2

```text
SRGB
OKLAB
OKLCH
```

### M3

```text
LIGHTNESS
CHROMA
HUE
```

### M4

```text
CONTRAST
```

### M5

```text
FONT_SIZE
FONT_WEIGHT
LINE_HEIGHT
LETTER_SPACING
```

### M6

```text
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
TEXT_MEASURE
SCALE_RATIO
```

---

# 75. Unit Test

必须测试：

## Registry

- 注册成功
- 重复注册
- 精确版本查询
- 不存在 Metric
- 多版本 Metric

## Planner

- 单节点
- 多节点
- DAG
- Cycle
- Missing Dependency
- Version mismatch

## Engine

- 单 Metric
- Dependency Metric
- UNKNOWN
- ERROR
- Batch
- Cache
- Determinism

---

# 76. Golden Test

必须至少建立：

```text
METRIC-GOLDEN-001
METRIC-GOLDEN-002
...
```

覆盖：

```text
COLOR
TYPOGRAPHY
GEOMETRY
```

---

# 77. Determinism Test

执行两次：

```text
Execution A
Execution B
```

输入完全一致：

```text
Snapshot
Metric Versions
Subjects
```

要求：

```text
Result Values
Result Status
Result Dependencies
Result Fingerprints
```

全部一致。

---

# 78. Cache Test

第一次：

```text
cache miss
```

第二次：

```text
cache hit
```

要求：

```text
Metric Value
```

保持一致。

同时：

```text
executedMetrics
```

应下降。

---

# 79. Cache Isolation Test

执行：

```text
Snapshot A
Snapshot B
```

即使：

```text
same subject
same metric
```

必须：

```text
cache key ≠
```

---

# 80. Unknown Propagation Test

构造：

```text
A = UNKNOWN
B depends on A
```

要求：

```text
B != AVAILABLE
```

如果 B 无替代计算路径：

```text
B = UNKNOWN
```

---

# 81. Error Isolation Test

构造：

```text
A = ERROR
B independent
```

要求：

```text
A = ERROR
B = AVAILABLE
```

---

# 82. Cycle Test

构造：

```text
A → B
B → C
C → A
```

要求：

```text
MetricDependencyCycleError
```

并包含：

```text
A
B
C
A
```

完整 Cycle Path。

---

# 83. Version Test

Registry：

```text
A@1.0.0
A@2.0.0
```

请求：

```text
A@1.0.0
```

必须执行：

```text
A@1.0.0
```

不得执行：

```text
A@2.0.0
```

---

# 84. Browser Independence Test

@uiq/metrics 测试环境不应需要：

```text
window
document
HTMLElement
getComputedStyle
```

因此可以使用：

```text
Vitest Node environment
```

执行绝大多数测试。

---

# 85. Architecture Dependency Test

禁止：

```text
metrics → browser
metrics → React
metrics → Vue
metrics → Radix
metrics → rules
metrics → diagnostic
```

允许：

```text
metrics → core
metrics → color
metrics → geometry
metrics → measurement
```

---

# 86. Acceptance Criteria

## AC-METRIC-01

Metric 可以通过：

```text
id + version
```

唯一解析。

## AC-METRIC-02

Registry 禁止重复版本。

## AC-METRIC-03

Dependency Graph 支持 Cycle Detection。

## AC-METRIC-04

Execution 使用 Topological Order。

## AC-METRIC-05

Metric 可以读取 Dependency Result。

## AC-METRIC-06

UNKNOWN 不得自动转换成 AVAILABLE。

## AC-METRIC-07

ERROR 不得导致整个 Batch 崩溃。

## AC-METRIC-08

Cache 必须 Snapshot 隔离。

## AC-METRIC-09

Metric Result 必须具有确定性 Fingerprint。

## AC-METRIC-10

Metrics 不得依赖 Browser API。

## AC-METRIC-11

Batch Execution 必须保持稳定输出顺序。

## AC-METRIC-12

Metric Engine 不执行 Rule。

---

# 87. Phase 3 完成后的运行链

完成本阶段后：

```text
REAL UI
   ↓
MeasurementSnapshot
   ↓
MetricRegistry
   ↓
Dependency Planner
   ↓
Metric Execution Engine
   ↓
MetricResult
   ↓
Fingerprint
```

已经成为可执行运行时。

---

# 88. 与前面规范的完整衔接

UIQ 当前实现链：

```text
Browser
  │
  ▼
Measurement
  │
  ▼
MeasurementSnapshot
  │
  ▼
Metric Registry
  │
  ▼
Metric Execution
  │
  ├── Color
  │     └── sRGB → XYZ → OKLab → OKLCH
  │
  ├── Typography
  │     └── CSS computed values
  │
  └── Geometry
        └── DOMRect
  │
  ▼
MetricResult
  │
  ▼
Rule Engine
```

其中：

```text
UIQ-IMPL-04
```

解决：

```text
Color Mathematics
```

而：

```text
UIQ-IMPL-05
```

解决：

```text
Metric Runtime
```

---

# 89. 当前架构状态

至此 UIQ 已经完成：

```text
Phase 1
Core Contracts
        ↓
Phase 2
Color Mathematics
        ↓
Phase 3
Metric Runtime
```

形成：

```text
Measurement
     ↓
Metric
```

这一条真正可执行的基础链路。

---

# 90. 下一阶段

下一阶段不增加架构层。

进入：

```text
UIQ-IMPL-06
Rule Evaluation Engine Implementation Specification V1.0
```

实现：

```text
MetricResult
      ↓
RuleRegistry
      ↓
RuleConfiguration
      ↓
Applicability
      ↓
Threshold / Range / Tolerance
      ↓
Evaluation
      ↓
PASS / FAIL / WARN /
NOT_APPLICABLE / UNKNOWN / ERROR
```

最终形成：

```text
Measurement
     ↓
Metric
     ↓
Rule
     ↓
Evaluation
```

这是 UIQ 从“**能够测量**”进入“**能够验证**”的关键阶段。

---

# 91. 架构冻结声明

UIQ-IMPL-05 不新增：

- Universal Metric Layer
- Metric Meta Engine
- Design Intelligence Layer
- AI Evaluation Layer
- Aesthetic Engine
- Design Quality Score Engine
- DSL
- Backend Runtime
- Database Layer
- Message Bus

未来 Metric 能力继续通过：

```text
MetricDefinition
MetricRegistry
MetricDependency
MetricExecutionEngine
Metric Adapter
Conformance Test
```

扩展。

UIQ V1.0 的核心执行模型保持：

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
  ↓
CONFORMANCE
  ↓
REGRESSION
```

**该执行链作为 UIQ V1.0 的最终稳定骨架，不再继续增加核心层。**