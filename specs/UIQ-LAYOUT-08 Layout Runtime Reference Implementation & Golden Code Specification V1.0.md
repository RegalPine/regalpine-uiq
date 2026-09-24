# UIQ-LAYOUT-08
# Layout Runtime Reference Implementation & Golden Code Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline / Frozen  
**Depends On:** UIQ-LAYOUT-07 V1.0  
**Runtime:** TypeScript / pnpm  
**Browser:** Playwright  
**Target:** `@uiq/metrics` / `@uiq/rules` / `@uiq/browser` / `@uiq/reporting`

---

# 1. 文档目标

本规范将：

```text
UIQ-LAYOUT-07
```

进一步落实为：

```text
TypeScript Contracts
+
Algorithm Implementations
+
Registry
+
Browser Adapter
+
Golden Fixtures
+
Playwright Tests
```

本阶段不增加：

- Layout Engine
- Layout Quality Engine
- Visual Intelligence Engine
- AI Quality Engine
- DSL
- Backend
- Database

---

# 2. 最终代码结构

```text
uiq/
├── packages/
│   ├── core/
│   ├── geometry/
│   ├── measurement/
│   ├── metrics/
│   │   └── src/
│   │       └── layout/
│   │           ├── types/
│   │           ├── alignment/
│   │           ├── grid/
│   │           ├── spacing/
│   │           ├── density/
│   │           ├── symmetry/
│   │           ├── overflow/
│   │           ├── responsive/
│   │           ├── consistency/
│   │           ├── registry/
│   │           └── index.ts
│   │
│   ├── rules/
│   │   └── src/
│   │       └── layout/
│   │           ├── constraints/
│   │           ├── rules/
│   │           ├── registry/
│   │           └── index.ts
│   │
│   ├── browser/
│   │   └── src/
│   │       └── layout/
│   │
│   └── reporting/
│       └── src/
│           └── layout/
│
├── apps/
│   └── reference/
│       └── src/
│           └── layout/
│
└── tests/
    └── golden/
        └── layout/
```

---

# 3. TypeScript 基础类型

文件：

```text
packages/metrics/src/layout/types/LayoutElementMeasurement.ts
```

```ts
export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutElementMeasurement {
  readonly id: string;

  readonly componentId?: string;
  readonly regionId?: string;
  readonly parentId?: string;

  readonly rect: LayoutRect;

  readonly margin: BoxSpacing;
  readonly padding: BoxSpacing;

  readonly visible: boolean;
}

export interface BoxSpacing {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
```

---

# 4. Layout Group

```ts
export type LayoutRelation =
  | "HORIZONTAL"
  | "VERTICAL"
  | "GRID"
  | "STACK";

export interface LayoutGroup {
  readonly id: string;
  readonly subjectIds: readonly string[];
  readonly relation: LayoutRelation;
  readonly referenceId?: string;
}
```

---

# 5. Layout Axis

```ts
export type AlignmentAxis =
  | "LEFT"
  | "RIGHT"
  | "TOP"
  | "BOTTOM"
  | "CENTER_X"
  | "CENTER_Y";
```

辅助函数：

```ts
export function alignmentCoordinate(
  rect: LayoutRect,
  axis: AlignmentAxis
): number {
  switch (axis) {
    case "LEFT":
      return rect.x;

    case "RIGHT":
      return rect.x + rect.width;

    case "TOP":
      return rect.y;

    case "BOTTOM":
      return rect.y + rect.height;

    case "CENTER_X":
      return rect.x + rect.width / 2;

    case "CENTER_Y":
      return rect.y + rect.height / 2;
  }
}
```

---

# 6. Alignment Metric

文件：

```text
alignment/calculateAlignment.ts
```

```ts
export interface AlignmentInput {
  readonly elements: readonly LayoutElementMeasurement[];
  readonly axis: AlignmentAxis;
  readonly reference?: number;
}

export interface AlignmentOutput {
  readonly axis: AlignmentAxis;
  readonly reference: number;
  readonly deviations: readonly number[];
  readonly maxDeviation: number;
  readonly meanAbsoluteDeviation: number;
}
```

实现：

```ts
export function calculateAlignment(
  input: AlignmentInput
): AlignmentOutput | undefined {
  if (input.elements.length === 0) {
    return undefined;
  }

  const coordinates = input.elements
    .filter(e => e.visible)
    .map(e => alignmentCoordinate(e.rect, input.axis));

  if (coordinates.length === 0) {
    return undefined;
  }

  const reference =
    input.reference ??
    median(coordinates);

  const deviations = coordinates.map(
    value => Math.abs(value - reference)
  );

  const maxDeviation = Math.max(...deviations);

  const meanAbsoluteDeviation =
    deviations.reduce((a, b) => a + b, 0) /
    deviations.length;

  return {
    axis: input.axis,
    reference,
    deviations,
    maxDeviation,
    meanAbsoluteDeviation
  };
}
```

---

# 7. Median

```ts
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("Cannot calculate median of empty array");
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
```

---

# 8. Grid Metric

文件：

```text
grid/calculateGridAlignment.ts
```

```ts
export interface GridInput {
  readonly coordinate: number;
  readonly gridSize: number;
  readonly origin: number;
}

export interface GridOutput {
  readonly coordinate: number;
  readonly nearestGridLine: number;
  readonly deviation: number;
}
```

实现：

```ts
export function calculateGridAlignment(
  input: GridInput
): GridOutput {
  if (!Number.isFinite(input.gridSize) ||
      input.gridSize <= 0) {
    throw new Error("gridSize must be greater than zero");
  }

  const nearestGridLine =
    input.origin +
    Math.round(
      (input.coordinate - input.origin) /
      input.gridSize
    ) * input.gridSize;

  return {
    coordinate: input.coordinate,
    nearestGridLine,
    deviation:
      input.coordinate - nearestGridLine
  };
}
```

---

# 9. Grid Group Metric

```ts
export interface GridGroupInput {
  readonly elements: readonly LayoutElementMeasurement[];
  readonly gridSize: number;
  readonly originX: number;
  readonly originY: number;
}

export interface GridGroupOutput {
  readonly x: readonly GridOutput[];
  readonly y: readonly GridOutput[];
  readonly maxDeviationX: number;
  readonly maxDeviationY: number;
}
```

实现：

```ts
export function calculateGridGroup(
  input: GridGroupInput
): GridGroupOutput {
  const x = input.elements.map(element =>
    calculateGridAlignment({
      coordinate: element.rect.x,
      gridSize: input.gridSize,
      origin: input.originX
    })
  );

  const y = input.elements.map(element =>
    calculateGridAlignment({
      coordinate: element.rect.y,
      gridSize: input.gridSize,
      origin: input.originY
    })
  );

  return {
    x,
    y,
    maxDeviationX:
      Math.max(...x.map(v => Math.abs(v.deviation))),
    maxDeviationY:
      Math.max(...y.map(v => Math.abs(v.deviation)))
  };
}
```

---

# 10. Spacing Variance

文件：

```text
spacing/calculateSpacingVariance.ts
```

```ts
export interface SpacingVariance {
  readonly count: number;
  readonly mean: number;
  readonly variance: number;
  readonly standardDeviation: number;
}
```

实现：

```ts
export function calculateSpacingVariance(
  values: readonly number[]
): SpacingVariance {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      variance: 0,
      standardDeviation: 0
    };
  }

  const mean =
    values.reduce((sum, value) => sum + value, 0) /
    values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum + Math.pow(value - mean, 2),
      0
    ) / values.length;

  return {
    count: values.length,
    mean,
    variance,
    standardDeviation: Math.sqrt(variance)
  };
}
```

---

# 11. Gap Extraction

```ts
export interface GapPair {
  readonly firstId: string;
  readonly secondId: string;
  readonly gap: number;
}
```

水平 Gap：

```ts
export function horizontalGap(
  a: LayoutRect,
  b: LayoutRect
): number {
  return b.x - (a.x + a.width);
}
```

垂直 Gap：

```ts
export function verticalGap(
  a: LayoutRect,
  b: LayoutRect
): number {
  return b.y - (a.y + a.height);
}
```

如果结果小于 0：

```text
表示重叠
```

而不是自动转换成 0。

---

# 12. Density Metric

```ts
export type DensityMode =
  | "RAW_AREA"
  | "UNION_AREA";
```

基础面积：

```ts
export function rectArea(
  rect: LayoutRect
): number {
  return Math.max(0, rect.width) *
         Math.max(0, rect.height);
}
```

RAW：

```ts
export function rawArea(
  rects: readonly LayoutRect[]
): number {
  return rects.reduce(
    (sum, rect) => sum + rectArea(rect),
    0
  );
}
```

---

# 13. Rectangle Union

V1.0 使用扫描线实现确定性 Union。

```ts
export function unionArea(
  rects: readonly LayoutRect[]
): number {
  const valid = rects.filter(
    r => r.width > 0 && r.height > 0
  );

  if (valid.length === 0) {
    return 0;
  }

  const xCoordinates = [
    ...new Set(
      valid.flatMap(r => [
        r.x,
        r.x + r.width
      ])
    )
  ].sort((a, b) => a - b);

  let area = 0;

  for (let i = 0; i < xCoordinates.length - 1; i++) {
    const x1 = xCoordinates[i];
    const x2 = xCoordinates[i + 1];

    if (x2 <= x1) {
      continue;
    }

    const intervals = valid
      .filter(r =>
        r.x < x2 &&
        r.x + r.width > x1
      )
      .map(r => [
        r.y,
        r.y + r.height
      ] as const)
      .sort((a, b) => a[0] - b[0]);

    let coveredY = 0;
    let currentStart: number | undefined;
    let currentEnd: number | undefined;

    for (const [start, end] of intervals) {
      if (currentStart === undefined) {
        currentStart = start;
        currentEnd = end;
        continue;
      }

      if (start > currentEnd!) {
        coveredY += currentEnd! - currentStart;
        currentStart = start;
        currentEnd = end;
      } else {
        currentEnd = Math.max(currentEnd!, end);
      }
    }

    if (currentStart !== undefined) {
      coveredY += currentEnd! - currentStart;
    }

    area += (x2 - x1) * coveredY;
  }

  return area;
}
```

---

# 14. Density Calculation

```ts
export function calculateDensity(
  occupiedArea: number,
  availableArea: number
): number | undefined {
  if (availableArea <= 0) {
    return undefined;
  }

  return occupiedArea / availableArea;
}
```

注意：

```text
RAW_AREA density
```

允许：

```text
> 1
```

因为重叠区域可能被重复计算。

---

# 15. Symmetry

```ts
export interface SymmetryPair {
  readonly firstId: string;
  readonly secondId: string;
}

export interface SymmetryInput {
  readonly axis: "HORIZONTAL" | "VERTICAL";
  readonly pairs: readonly SymmetryPair[];
  readonly elements: ReadonlyMap<string, LayoutElementMeasurement>;
  readonly axisPosition: number;
}
```

V1.0 不自动寻找 Pair。

---

# 16. Symmetry Deviation

垂直轴：

```ts
function verticalSymmetryDeviation(
  a: LayoutRect,
  b: LayoutRect,
  axis: number
): number {
  const aCenter = a.x + a.width / 2;
  const bCenter = b.x + b.width / 2;

  return Math.abs(
    (aCenter - axis) +
    (bCenter - axis)
  );
}
```

水平轴：

```ts
function horizontalSymmetryDeviation(
  a: LayoutRect,
  b: LayoutRect,
  axis: number
): number {
  const aCenter = a.y + a.height / 2;
  const bCenter = b.y + b.height / 2;

  return Math.abs(
    (aCenter - axis) +
    (bCenter - axis)
  );
}
```

---

# 17. Overflow

```ts
export interface OverflowInput {
  readonly element: LayoutRect;
  readonly container: LayoutRect;
}

export interface OverflowOutput {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly maxOverflow: number;
}
```

实现：

```ts
export function calculateOverflow(
  input: OverflowInput
): OverflowOutput {
  const { element, container } = input;

  const left =
    Math.max(0, container.x - element.x);

  const right =
    Math.max(
      0,
      element.x + element.width -
      (container.x + container.width)
    );

  const top =
    Math.max(0, container.y - element.y);

  const bottom =
    Math.max(
      0,
      element.y + element.height -
      (container.y + container.height)
    );

  return {
    left,
    right,
    top,
    bottom,
    maxOverflow:
      Math.max(left, right, top, bottom)
  };
}
```

---

# 18. Responsive Delta

```ts
export interface ResponsiveRectDelta {
  readonly widthDelta: number;
  readonly heightDelta: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly distance: number;
}
```

实现：

```ts
export function calculateResponsiveDelta(
  baseline: LayoutRect,
  current: LayoutRect
): ResponsiveRectDelta {
  const deltaX = current.x - baseline.x;
  const deltaY = current.y - baseline.y;

  return {
    widthDelta:
      current.width - baseline.width,

    heightDelta:
      current.height - baseline.height,

    deltaX,
    deltaY,

    distance:
      Math.hypot(deltaX, deltaY)
  };
}
```

---

# 19. Component Size Variance

```ts
export interface ComponentSizeVariance {
  readonly componentType: string;

  readonly count: number;

  readonly widthVariance: number;
  readonly heightVariance: number;

  readonly widthStandardDeviation: number;
  readonly heightStandardDeviation: number;
}
```

实现必须按：

```text
componentId / componentType
```

分组。

---

# 20. Metric Definition

所有 Layout Metrics 使用现有：

```ts
MetricDefinition<T>
```

例如：

```ts
export const layoutAlignmentMetric: MetricDefinition<
  AlignmentOutput
> = {
  id: "LAYOUT.ALIGNMENT",
  version: "1.0.0",
  kind: "DERIVED",
  dependencies: [
    {
      metricId: "GEOMETRY.WIDTH",
      version: "1.0.0",
      required: true
    }
  ],

  calculate(context) {
    // read snapshot
    // calculate alignment
  }
};
```

实际实现必须根据真实 MeasurementSnapshot 获取数据。

不得从 DOM 读取数据。

---

# 21. Metric Registry

```ts
export function registerLayoutMetrics(
  registry: MetricRegistry
): void {
  registry.register(layoutAlignmentMetric);
  registry.register(layoutGridAlignmentMetric);
  registry.register(layoutDensityMetric);
  registry.register(layoutSymmetryMetric);
  registry.register(layoutOverflowMetric);
  registry.register(layoutResponsiveSizeDeltaMetric);
  registry.register(layoutResponsivePositionDeltaMetric);
  registry.register(layoutComponentSizeVarianceMetric);
  registry.register(layoutSpacingVarianceMetric);
}
```

---

# 22. Rule Contract

Layout Rule 继续使用：

```ts
RuleDefinition
```

例如：

```ts
export const layoutAlignmentConformanceRule: RuleDefinition = {
  id: "LAYOUT.ALIGNMENT.CONFORMANCE",
  version: "1.0.0",

  metricId: "LAYOUT.ALIGNMENT",
  metricVersion: "1.0.0",

  operator: "LTE",

  severity: "MEDIUM"
};
```

阈值不写死在 Metric。

---

# 23. Rule Configuration

例如：

```json
{
  "ruleId": "LAYOUT.ALIGNMENT.CONFORMANCE",
  "ruleVersion": "1.0.0",
  "values": {
    "tolerance": 1
  }
}
```

因此：

```text
Metric
```

只输出：

```text
maxDeviation = 0.72
```

Rule 才决定：

```text
0.72 <= 1
→ PASS
```

---

# 24. Grid Rule

```text
LAYOUT.GRID.CONFORMANCE@1.0.0
```

Configuration：

```json
{
  "gridSize": 8,
  "origin": 0,
  "tolerance": 1
}
```

判断：

```text
abs(deviation) <= tolerance
```

---

# 25. Spacing Rule

```text
LAYOUT.SPACING.CONFORMANCE@1.0.0
```

例如：

```json
{
  "expected": 24,
  "tolerance": 1
}
```

结果：

```text
23 → PASS
24 → PASS
25 → PASS

22.9 → FAIL
25.1 → FAIL
```

---

# 26. Container Rule

```text
LAYOUT.CONTAINER.CONSTRAINT@1.0.0
```

Configuration：

```json
{
  "minWidth": 320,
  "maxWidth": 1200,
  "containment": true
}
```

Metric 提供：

```text
actualWidth
actualHeight
containment
```

Rule 判断。

---

# 27. Overflow Rule

```text
LAYOUT.OVERFLOW.CONSTRAINT@1.0.0
```

Configuration：

```json
{
  "mode": "FORBID",
  "maxOverflow": 0
}
```

Intentional overflow：

```json
{
  "mode": "ALLOW_AXIS",
  "axis": "Y"
}
```

因此：

```text
overflow ≠ failure
```

---

# 28. Responsive Rule

```text
LAYOUT.RESPONSIVE.CONSTRAINT@1.0.0
```

Configuration：

```json
{
  "states": [
    {
      "viewport": {
        "min": 0,
        "max": 767
      }
    },
    {
      "viewport": {
        "min": 768,
        "max": 1023
      }
    },
    {
      "viewport": {
        "min": 1024
      }
    }
  ]
}
```

状态必须明确声明。

---

# 29. No Overflow Rule

```text
LAYOUT.RESPONSIVE.NO_OVERFLOW@1.0.0
```

规则只消费：

```text
LAYOUT.OVERFLOW
```

不直接访问：

```text
DOM
```

---

# 30. Rule Registry

```ts
export function registerLayoutRules(
  registry: RuleRegistry
): void {
  registry.register(layoutAlignmentConformanceRule);
  registry.register(layoutGridConformanceRule);
  registry.register(layoutSpacingConformanceRule);
  registry.register(layoutContainerConstraintRule);
  registry.register(layoutOverflowConstraintRule);
  registry.register(layoutDensityRangeRule);
  registry.register(layoutSymmetryConformanceRule);
  registry.register(layoutComponentSizeConsistencyRule);
  registry.register(layoutResponsiveConstraintRule);
  registry.register(layoutResponsiveNoOverflowRule);
  registry.register(layoutOrderConformanceRule);
}
```

---

# 31. Browser Adapter

文件：

```text
packages/browser/src/layout/measureLayout.ts
```

```ts
export function measureLayoutElement(
  element: Element
): LayoutMeasurement {
  const rect =
    element.getBoundingClientRect();

  const style =
    window.getComputedStyle(element);

  return {
    elementId: resolveUIQId(element),

    componentId:
      element.getAttribute(
        "data-uiq-component"
      ) ?? undefined,

    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    },

    margin: {
      top: parsePx(style.marginTop),
      right: parsePx(style.marginRight),
      bottom: parsePx(style.marginBottom),
      left: parsePx(style.marginLeft)
    },

    padding: {
      top: parsePx(style.paddingTop),
      right: parsePx(style.paddingRight),
      bottom: parsePx(style.paddingBottom),
      left: parsePx(style.paddingLeft)
    },

    visible: isVisible(element, rect)
  };
}
```

---

# 32. parsePx

```ts
export function parsePx(
  value: string
): number {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `Unable to parse CSS length: ${value}`
    );
  }

  return parsed;
}
```

---

# 33. Visibility

```ts
export function isVisible(
  element: Element,
  rect: DOMRect
): boolean {
  const style =
    window.getComputedStyle(element);

  if (style.display === "none") {
    return false;
  }

  if (style.visibility === "hidden") {
    return false;
  }

  if (style.opacity === "0") {
    return false;
  }

  return rect.width > 0 &&
         rect.height > 0;
}
```

注意：

`opacity: 0` 是否属于 Layout 不可见，在不同质量领域可能存在不同语义。

因此 V1.0 Browser Adapter 必须允许未来通过配置改变该判断，但默认采用上述行为。

---

# 34. Stable ID

优先级：

```text
data-uiq-id
    ↓
data-uiq-component
    ↓
runtime-generated ID
```

禁止：

```text
React Fiber ID
DOM memory address
XPath
```

作为主身份。

---

# 35. Browser Snapshot

```ts
export async function captureLayoutSnapshot(
  root: Element
): Promise<MeasurementSnapshot> {
  await document.fonts.ready;

  const elements =
    Array.from(
      root.querySelectorAll(
        "[data-uiq-id]"
      )
    );

  const measurements =
    elements.flatMap(
      measureLayoutElement
    );

  return createSnapshot(
    measurements
  );
}
```

---

# 36. Animation Stabilization

Playwright：

```ts
await page.addStyleTag({
  content: `
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
      caret-color: transparent !important;
    }
  `
});
```

然后：

```ts
await page.evaluate(() =>
  document.fonts.ready
);
```

---

# 37. Layout Stabilization

```ts
await page.waitForLoadState("networkidle");

await page.evaluate(async () => {
  await document.fonts.ready;

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
});
```

V1.0 不使用截图作为布局真值。

---

# 38. Golden Fixture

文件：

```text
tests/golden/layout/spacing/LAYOUT-SPACING-001.json
```

```json
{
  "id": "LAYOUT-SPACING-001",
  "version": "1.0.0",
  "pageId": "layout-spacing",
  "viewport": {
    "width": 1200,
    "height": 900
  },
  "subjectId": "spacing-card-001",
  "metric": {
    "id": "SPACING.GAP",
    "version": "1.0.0"
  },
  "rule": {
    "id": "LAYOUT.SPACING.CONFORMANCE",
    "version": "1.0.0"
  },
  "expected": {
    "state": "PASS",
    "value": 24
  },
  "tolerance": 0.01
}
```

---

# 39. Failure Fixture

```json
{
  "id": "LAYOUT-SPACING-002",
  "version": "1.0.0",
  "pageId": "layout-spacing",
  "viewport": {
    "width": 1200,
    "height": 900
  },
  "subjectId": "spacing-card-fail",
  "metric": {
    "id": "SPACING.GAP",
    "version": "1.0.0"
  },
  "rule": {
    "id": "LAYOUT.SPACING.CONFORMANCE",
    "version": "1.0.0"
  },
  "expected": {
    "state": "FAIL"
  }
}
```

---

# 40. Token Deviation Fixture

实际：

```text
20px
```

Token：

```text
24px
```

必须允许：

```text
TOKEN_DEVIATION = FAIL
```

同时：

```text
LAYOUT.SPACING.CONFORMANCE = PASS
```

如果 Component Contract 明确要求 20px。

这两个结果不能互相覆盖。

---

# 41. Golden Test

```ts
test(
  "LAYOUT-SPACING-001",
  async () => {
    const result =
      await runner.run(testCase);

    expect(result.actual.state)
      .toBe("PASS");

    expect(result.actual.value)
      .toBeCloseTo(24, 2);
  }
);
```

---

# 42. Boundary Tests

Spacing：

```text
23
24
25
22.99
25.01
```

Expected：

```text
PASS
PASS
PASS
FAIL
FAIL
```

这是必须的边界测试。

---

# 43. Grid Golden

```text
gridSize = 8
origin = 0
```

坐标：

```text
16 → deviation 0
17 → deviation 1
15 → deviation -1
20 → deviation 4
```

Rule：

```text
tolerance = 1
```

所以：

```text
16 PASS
17 PASS
15 PASS
20 FAIL
```

---

# 44. Responsive Golden

固定：

```text
390
768
1024
1440
```

每个 viewport：

```text
独立 Snapshot
```

比较：

```text
same Entity ID
```

而不是：

```text
DOM index
```

---

# 45. Cross Browser

Playwright Project：

```ts
projects: [
  {
    name: "chromium"
  },
  {
    name: "firefox"
  },
  {
    name: "webkit"
  }
]
```

Cross-browser 差异不能静默吞掉。

如果结果不同：

```text
CONFORMANCE FAILURE
```

除非 Golden 明确声明：

```text
browserVarianceAllowed = true
```

---

# 46. Reporting Integration

新增：

```text
packages/reporting/src/layout/
├── aggregatePageLayout.ts
├── aggregateRegionLayout.ts
├── aggregateComponentLayout.ts
├── groupLayoutFindings.ts
├── classifyFindingScope.ts
├── buildLayoutRecommendations.ts
└── buildLayoutReport.ts
```

---

# 47. Page Aggregation

```ts
export function aggregatePageLayout(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
  metrics: readonly MetricResult<unknown>[]
): PageLayoutModel {
  return {
    findings: groupLayoutFindings(findings),
    diagnostics: aggregateDiagnostics(diagnostics),
    metrics: summarizeLayoutMetrics(metrics)
  };
}
```

注意：

此处只能：

```text
COUNT
GROUP
CLASSIFY
TRACE
SUMMARIZE
```

不能重新计算 Layout Metric。

---

# 48. Inspector Integration

Layout Panel：

```text
Layout
├── Geometry
├── Alignment
├── Grid
├── Spacing
├── Container
├── Density
├── Symmetry
├── Overflow
├── Responsive
├── Component Consistency
├── Constraints
└── Trace
```

所有数值直接来自：

```text
MetricResult
```

所有状态直接来自：

```text
EvaluationResult
```

---

# 49. Layout Heatmap

Heatmap 仅作为：

```text
Finding Visualization
```

数据来源：

```text
Finding.targetIds
```

不得根据颜色生成新的质量分数。

例如：

```text
FAIL → visualization
WARN → visualization
PASS → visualization
```

---

# 50. Skill Integration

`uiq-ui-quality` 增加：

```text
layout
```

Intent：

```json
{
  "intent": "analyze",
  "scope": {
    "dimensions": [
      "layout"
    ]
  }
}
```

Skill：

```text
Agent
 ↓
uiq-ui-quality
 ↓
uiq analyze --dimension layout
 ↓
UIQ Runtime
```

Skill 不计算 Layout Metric。

---

# 51. CLI Output

```bash
uiq analyze \
  --url http://localhost:5173/reference/layout \
  --dimension layout \
  --format json
```

输出：

```json
{
  "schemaVersion": "1.0.0",
  "status": "COMPLETED",
  "metrics": [],
  "evaluations": [],
  "findings": [],
  "diagnostics": [],
  "recommendations": [],
  "regression": null
}
```

---

# 52. Golden Dataset Minimum Set

V1.0 最少：

| Domain | Cases |
|---|---:|
| Geometry | 5 |
| Alignment | 8 |
| Grid | 8 |
| Spacing | 8 |
| Container | 6 |
| Density | 5 |
| Symmetry | 5 |
| Overflow | 6 |
| Responsive | 8 |
| Component | 5 |
| Design System | 6 |
| Theme | 4 |
| Unknown/Error | 5 |
| Regression | 5 |
| **Total** | **84** |

84 是工程最低覆盖线，不是质量评分。

---

# 53. Property-Based Tests

必须验证：

### Grid

```text
abs(deviation) <= gridSize / 2
```

### Area

```text
width >= 0
height >= 0
area >= 0
```

### Union

```text
unionArea(rects)
<=
sum(rectArea(rect))
```

### Overflow

```text
maxOverflow >= 0
```

### Responsive

```text
distance >= 0
```

### Variance

```text
variance >= 0
```

---

# 54. Determinism Test

相同：

```text
Snapshot
Metric Version
Rule Version
Configuration
Engine Version
```

重复执行：

```text
100 times
```

必须得到：

```text
identical MetricResult
identical EvaluationResult
identical Finding fingerprint
```

---

# 55. Mutation Test

对 Golden Fixture 做：

```text
+0.1px
+1px
+2px
-0.1px
-1px
-2px
```

验证 Rule Boundary。

特别针对：

```text
tolerance
```

避免：

```text
off-by-one
```

错误。

---

# 56. Regression

Baseline：

```text
PASS
```

修改布局：

```text
FAIL
```

结果：

```text
NEW_FAILURE
```

修复：

```text
FAIL → PASS
```

结果：

```text
FIXED_FAILURE
```

UNKNOWN：

```text
AVAILABLE → UNKNOWN
```

结果：

```text
NEW_UNKNOWN
```

恢复：

```text
UNKNOWN → AVAILABLE
```

结果：

```text
RESOLVED_UNKNOWN
```

---

# 57. Release Gate

Layout Evaluation：

```text
FAIL
```

并不自动等于：

```text
BLOCK
```

Release Gate：

```text
EvaluationResult
+
RegressionReport
+
PolicyProfile
```

决定：

```text
ALLOW
WARN
BLOCK
```

---

# 58. CI Pipeline

最终：

```text
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit
 ↓
Metric Golden
 ↓
Rule Golden
 ↓
Layout Golden
 ↓
Schema
 ↓
Contract
 ↓
Browser
 ↓
Conformance
 ↓
Regression
 ↓
Reporting
 ↓
E2E
 ↓
Release Gate
```

---

# 59. Architecture Acceptance

必须满足：

```text
AC-LAYOUT-IMPL-01
All Layout Metrics compile

AC-LAYOUT-IMPL-02
Metric Registry resolves exact versions

AC-LAYOUT-IMPL-03
Layout Rules consume MetricResult only

AC-LAYOUT-IMPL-04
Browser Adapter creates Measurement only

AC-LAYOUT-IMPL-05
No Rule accesses DOM

AC-LAYOUT-IMPL-06
No Metric accesses DOM

AC-LAYOUT-IMPL-07
Token resolution uses @uiq/tokens

AC-LAYOUT-IMPL-08
Component Contract uses Adapter

AC-LAYOUT-IMPL-09
Page aggregation does not recalculate metrics

AC-LAYOUT-IMPL-10
Golden tests are deterministic

AC-LAYOUT-IMPL-11
Cross-browser tests execute

AC-LAYOUT-IMPL-12
Responsive tests execute

AC-LAYOUT-IMPL-13
Regression executes

AC-LAYOUT-IMPL-14
Inspector displays Layout evidence

AC-LAYOUT-IMPL-15
Skill can invoke Layout analysis

AC-LAYOUT-IMPL-16
No new architectural layer exists
```

---

# 60. Definition of Done

以下命令成功：

```bash
pnpm typecheck
pnpm test
pnpm test:golden
pnpm test:browser
pnpm test:conformance
pnpm test:regression
pnpm test:e2e
```

并且：

```text
84+ Layout Golden Cases
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
Remeasure
        ↓
Regression
        ↓
Verification
```

全部形成闭环。

---

# 61. 最终冻结判断

完成 LAYOUT-08 后：

> **Layout Quality 不再进入规范设计阶段，而进入正常工程开发阶段。**

后续允许变化：

```text
✓ Bug Fix
✓ Performance
✓ Browser Compatibility
✓ Golden Expansion
✓ New Rule
✓ New Constraint
✓ New Adapter
✓ New Report Renderer
```

不允许重新引入：

```text
✗ Layout Engine
✗ Quality Engine
✗ AI Layout Score
✗ Beauty Score
✗ Automatic CSS Repair
✗ Automatic Token Repair
✗ DSL
✗ Backend
```

---

# 62. UIQ 当前最终闭环

```text
                    DESIGN SYSTEM
                         │
              ┌──────────┴──────────┐
              │                     │
            Tokens           Component Contract
              │                     │
              └──────────┬──────────┘
                         ↓
                    Constraints
                         │
                         ↓
                  REAL RENDERED UI
                         │
                         ↓
                    Measurement
                         │
                         ↓
                      Metrics
                         │
                         ↓
                       Rules
                         │
                         ↓
                    Evaluation
                         │
                         ↓
                      Finding
                         │
                         ↓
                    Diagnostic
                         │
                         ↓
                  Recommendation
                         │
                         ↓
                    IMPLEMENT
                         │
                         ↓
                     REMEASURE
                         │
                         ↓
                    REGRESSION
                         │
                         ↓
                    VERIFICATION
                         │
                         ↓
                       REPORT
```

**UIQ-LAYOUT-08 完成后，Layout Quality 已经从“规范”进入“可编码、可测试、可运行、可回归”的工程状态。**