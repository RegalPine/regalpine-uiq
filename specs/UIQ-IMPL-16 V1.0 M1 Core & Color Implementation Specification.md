# UIQ-IMPL-16
## M1 Core & Color Implementation Specification V1.0

**Status:** Implementation Baseline  
**Phase:** M1  
**Scope:** `@uiq/core` + `@uiq/color`  
**Runtime:** Browser / Node.js  
**Language:** TypeScript  
**Package Manager:** pnpm  
**Architecture Status:** Frozen

---

# 1. Purpose

本阶段将 UIQ 已冻结的 Core Contract 与 Color Mathematics 正式实现。

M1 不增加新的架构层，仅完成：

```text
@uiq/core
    ↓
Core Contracts
    ↓
@uiq/color
    ↓
Color Mathematics
    ↓
Golden Tests
```

M1 完成后，UIQ 应能够独立完成：

```text
CSS Color
    ↓
sRGB
    ↓
Linear RGB
    ↓
XYZ D65
    ↓
OKLab
    ↓
OKLCH
```

以及：

```text
Color
 ├── Relative Luminance
 ├── Contrast
 ├── ΔL
 ├── ΔC
 ├── ΔH
 └── Gamut
```

---

# 2. M1 Non-Goals

M1 不实现：

- Browser DOM Measurement
- CSS Computed Style
- Metric Execution Engine
- Rule Engine
- Finding
- Diagnostic
- Token Resolution
- Theme Resolution
- React
- Radix UI
- Inspector
- CLI
- Backend
- Database
- AI
- Color Recommendation
- Palette Generation
- Automatic Color Replacement

因此依赖关系必须保持：

```text
@uiq/core
    ↑
@uiq/color
```

而不能出现：

```text
@uiq/core → @uiq/color
```

即：

```text
@uiq/color → @uiq/core
```

如果 Color Mathematics 不需要 Core，则允许完全不依赖 Core。

---

# 3. Monorepo Baseline

```text
uiq/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
│
├── packages/
│   ├── core/
│   └── color/
│
├── tests/
│   ├── architecture/
│   └── golden/
│
└── specs/
```

---

# 4. Root Package

`package.json`

```json
{
  "name": "uiq",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:golden": "pnpm --filter @uiq/color test:golden",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint"
  }
}
```

---

# 5. Workspace

`pnpm-workspace.yaml`

```yaml
packages:
  - "packages/*"
  - "apps/*"
  - "tests/*"
```

当前虽然只实现两个 Package，但 Workspace 从一开始保持最终结构兼容。

---

# 6. TypeScript Baseline

`tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",

    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

---

# 7. @uiq/core

## 7.1 Package Structure

```text
packages/core/
├── package.json
├── tsconfig.json
└── src/
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

# 8. Entity Contracts

## 8.1 EntityId

```ts
export type EntityId = string;
```

M1 不对 ID 生成策略进行限制。

推荐：

```text
data-uiq-id
```

优先由上层提供稳定 ID。

---

## 8.2 EntityType

```ts
export enum EntityType {
  PROJECT = "PROJECT",
  PAGE = "PAGE",
  REGION = "REGION",
  COMPONENT = "COMPONENT",
  ELEMENT = "ELEMENT",
  CONTENT = "CONTENT",
  INTERACTION = "INTERACTION",
  TOKEN = "TOKEN",
  THEME = "THEME"
}
```

---

## 8.3 UIQEntity

```ts
export interface UIQEntity {
  readonly id: EntityId;
  readonly type: EntityType;
}
```

Core Entity 不包含任何 UI Framework 类型。

禁止：

```ts
React.ReactNode
HTMLElement
VueComponent
RadixComponent
```

---

# 9. Measurement Contract

## 9.1 MeasurementStatus

```ts
export enum MeasurementStatus {
  AVAILABLE = "AVAILABLE",
  UNKNOWN = "UNKNOWN",
  ERROR = "ERROR"
}
```

---

# 10. MeasurementSource

```ts
export type MeasurementSourceType =
  | "BROWSER"
  | "STATIC"
  | "TOKEN"
  | "IMPORT"
  | "MANUAL"
  | "OTHER";

export interface MeasurementSource {
  readonly type: MeasurementSourceType;
  readonly adapter?: string;
  readonly version?: string;
}
```

---

# 11. Measurement

```ts
export interface Measurement<T = unknown> {
  readonly id: string;
  readonly subjectId: EntityId;
  readonly type: string;

  readonly value?: T;
  readonly unit?: string;

  readonly source: MeasurementSource;
  readonly status: MeasurementStatus;

  readonly timestamp: string;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

约束：

```text
AVAILABLE → value 必须存在
UNKNOWN   → value 不应被视为有效值
ERROR     → value 不应被视为有效值
```

---

# 12. MeasurementSnapshot

```ts
export interface MeasurementEnvironment {
  readonly viewport?: {
    readonly width: number;
    readonly height: number;
  };

  readonly devicePixelRatio?: number;
  readonly zoom?: number;
  readonly browser?: string;
}

export interface MeasurementSnapshot {
  readonly id: string;
  readonly capturedAt: string;

  readonly source: MeasurementSource;

  readonly environment?: MeasurementEnvironment;

  readonly measurements: readonly Measurement[];
}
```

Snapshot 是 UIQ 可复现计算的基础输入。

---

# 13. Metric Contract

## 13.1 MetricKind

```ts
export enum MetricKind {
  BASE = "BASE",
  DERIVED = "DERIVED",
  COMPOSITE = "COMPOSITE",
  EXPERIMENTAL = "EXPERIMENTAL"
}
```

---

# 14. MetricDependency

```ts
export interface MetricDependency {
  readonly metricId: string;
  readonly version: string;
  readonly required: boolean;
}
```

Metric Version 必须精确匹配。

禁止：

```text
metricId → latest
```

必须：

```text
metricId + version
```

---

# 15. MetricDefinition

```ts
export interface MetricCalculationContext {
  readonly subjectId: EntityId;
  readonly snapshot: MeasurementSnapshot;

  readonly dependencies:
    ReadonlyMap<string, MetricResult<unknown>>;
}

export interface MetricDefinition<T = unknown> {
  readonly id: string;
  readonly version: string;

  readonly kind: MetricKind;

  readonly dependencies: readonly MetricDependency[];

  readonly calculate:
    (context: MetricCalculationContext) => T;
}
```

---

# 16. MetricResult

```ts
export interface MetricResult<T = unknown> {
  readonly metricId: string;
  readonly metricVersion: string;

  readonly subjectId: EntityId;

  readonly value?: T;
  readonly unit?: string;

  readonly status: MeasurementStatus;

  readonly dependencies:
    ReadonlyArray<MetricResult<unknown>>;

  readonly fingerprint: string;

  readonly metadata?: Readonly<Record<string, unknown>>;
}
```

MetricResult 不包含：

```text
PASS
FAIL
GOOD
BAD
```

这些属于 Rule/Evaluation。

---

# 17. MetricRegistry

```ts
export interface MetricRegistry {
  register<T>(definition: MetricDefinition<T>): void;

  get(
    id: string,
    version: string
  ): MetricDefinition<unknown>;

  has(
    id: string,
    version: string
  ): boolean;

  list(): readonly MetricDefinition<unknown>[];
}
```

重复注册必须抛出错误。

---

# 18. Fingerprint

UIQ 的 Fingerprint 用于：

```text
Reproducibility
Regression
Finding Identity
Cache
Traceability
```

推荐算法：

```text
SHA-256
```

M1 提供：

```ts
export function fingerprint(
  value: unknown
): string;
```

要求：

1. Canonical JSON
2. 字段顺序稳定
3. 数值表示稳定
4. 不包含随机值
5. 不包含当前时间
6. 不包含运行时对象地址

---

# 19. @uiq/color

## 19.1 Package Structure

```text
packages/color/
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   ├── SRGB.ts
    │   ├── LinearRGB.ts
    │   ├── XYZ.ts
    │   ├── OKLab.ts
    │   ├── OKLCH.ts
    │   └── ColorStatus.ts
    │
    ├── parsing/
    │   ├── parseHex.ts
    │   ├── parseRgb.ts
    │   └── parseColor.ts
    │
    ├── srgb/
    │   ├── srgbToLinear.ts
    │   └── linearToSrgb.ts
    │
    ├── xyz/
    │   ├── linearRgbToXyz.ts
    │   └── xyzToLinearRgb.ts
    │
    ├── oklab/
    │   ├── xyzToOklab.ts
    │   └── oklabToXyz.ts
    │
    ├── oklch/
    │   ├── oklabToOklch.ts
    │   └── oklchToOklab.ts
    │
    ├── luminance/
    │   └── relativeLuminance.ts
    │
    ├── contrast/
    │   └── contrastRatio.ts
    │
    ├── difference/
    │   ├── deltaL.ts
    │   ├── deltaC.ts
    │   └── deltaH.ts
    │
    ├── gamut/
    │   ├── isInSrgbGamut.ts
    │   └── gamutDistance.ts
    │
    └── index.ts
```

---

# 20. sRGB

```ts
export interface SRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}
```

标准内部范围：

```text
r ∈ [0,1]
g ∈ [0,1]
b ∈ [0,1]
alpha ∈ [0,1]
```

---

# 21. Linear RGB

```ts
export interface LinearRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
```

特别规定：

> Linear RGB 中间计算结果允许超出 `[0,1]`。

禁止提前：

```ts
Math.max(0, Math.min(1, value))
```

否则会破坏：

```text
XYZ
OKLab
OKLCH
Gamut Detection
```

---

# 22. XYZ

```ts
export interface XYZ {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
```

参考白点：

```text
D65
```

---

# 23. OKLab

```ts
export interface OKLab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}
```

---

# 24. OKLCH

```ts
export interface OKLCH {
  readonly L: number;
  readonly C: number;
  readonly H: number | "UNDEFINED";
}
```

对于：

```text
C ≈ 0
```

Hue 不定义。

禁止：

```text
H = 0°
```

来伪装为真实 Hue。

---

# 25. sRGB → Linear RGB

```ts
export function srgbToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }

  return Math.pow(
    (value + 0.055) / 1.055,
    2.4
  );
}
```

---

# 26. Linear RGB → sRGB

```ts
export function linearToSrgb(value: number): number {
  if (value <= 0.0031308) {
    return 12.92 * value;
  }

  return (
    1.055 *
      Math.pow(value, 1 / 2.4) -
    0.055
  );
}
```

只允许在最终 CSS/output 阶段进行 Clamp。

---

# 27. Linear RGB → XYZ D65

```ts
X =
  0.41239079926595934 R +
  0.35758433938387796 G +
  0.18048078871500268 B

Y =
  0.21263900587151027 R +
  0.7151686787677559 G +
  0.07219231536073371 B

Z =
  0.01933081871559185 R +
  0.11919477979462598 G +
  0.9505321522496607 B
```

实现：

```ts
export function linearRgbToXyz(
  rgb: LinearRGB
): XYZ {
  return {
    x:
      0.41239079926595934 * rgb.r +
      0.35758433938387796 * rgb.g +
      0.18048078871500268 * rgb.b,

    y:
      0.21263900587151027 * rgb.r +
      0.7151686787677559 * rgb.g +
      0.07219231536073371 * rgb.b,

    z:
      0.01933081871559185 * rgb.r +
      0.11919477979462598 * rgb.g +
      0.9505321522496607 * rgb.b
  };
}
```

---

# 28. XYZ → Linear RGB

```ts
export function xyzToLinearRgb(
  xyz: XYZ
): LinearRGB {
  return {
    r:
      3.2409699419045226 * xyz.x -
      1.5373831775700937 * xyz.y -
      0.4986107602930034 * xyz.z,

    g:
      -0.9692436362808798 * xyz.x +
      1.8759675015077202 * xyz.y +
      0.04155505740717559 * xyz.z,

    b:
      0.05563007969699366 * xyz.x -
      0.20397695888897652 * xyz.y +
      1.0569715142428786 * xyz.z
  };
}
```

---

# 29. XYZ → OKLab

第一阶段：

```ts
l =
  0.8190224379967030 X +
  0.3619062600528904 Y -
  0.1288737815209879 Z

m =
  0.0329836539323885 X +
  0.9292868615863434 Y +
  0.0361446663506424 Z

s =
  0.0481771893596242 X +
  0.2642395317527308 Y +
  0.6335478284694309 Z
```

然后：

```ts
const lp = Math.cbrt(l);
const mp = Math.cbrt(m);
const sp = Math.cbrt(s);
```

最终：

```text
L =
0.2104542553 lp +
0.7936177850 mp -
0.0040720468 sp

a =
1.9779984951 lp -
2.4285922050 mp +
0.4505937099 sp

b =
0.0259040371 lp +
0.7827717662 mp -
0.8086757660 sp
```

---

# 30. OKLab → OKLCH

```ts
const C = Math.sqrt(
  a * a + b * b
);
```

Hue：

```ts
let H =
  Math.atan2(b, a) *
  180 /
  Math.PI;

if (H < 0) {
  H += 360;
}
```

但：

```text
C < 1e-7
```

时：

```ts
H = "UNDEFINED";
```

---

# 31. Relative Luminance

相对亮度必须基于：

```text
Linear RGB
```

而不是 Gamma 编码后的 sRGB。

```ts
export function relativeLuminance(
  rgb: LinearRGB
): number {
  return (
    0.2126 * rgb.r +
    0.7152 * rgb.g +
    0.0722 * rgb.b
  );
}
```

---

# 32. Contrast

```ts
export function contrastRatio(
  foreground: LinearRGB,
  background: LinearRGB
): number {
  const lf = relativeLuminance(foreground);
  const lb = relativeLuminance(background);

  const lighter = Math.max(lf, lb);
  const darker = Math.min(lf, lb);

  return (
    (lighter + 0.05) /
    (darker + 0.05)
  );
}
```

理论范围：

```text
1 ≤ Contrast ≤ 21
```

注意：

```text
Contrast
```

不是：

```text
ΔE
```

二者必须保持不同语义。

---

# 33. ΔL

```ts
export function deltaL(
  a: OKLCH,
  b: OKLCH
): number {
  return b.L - a.L;
}
```

---

# 34. ΔC

```ts
export function deltaC(
  a: OKLCH,
  b: OKLCH
): number {
  return b.C - a.C;
}
```

---

# 35. Circular ΔH

Hue 是环形变量。

例如：

```text
350° → 10°
```

正确结果：

```text
+20°
```

而不是：

```text
-340°
```

算法：

```ts
export function deltaH(
  a: OKLCH,
  b: OKLCH
): number | "UNDEFINED" {
  if (
    a.H === "UNDEFINED" ||
    b.H === "UNDEFINED"
  ) {
    return "UNDEFINED";
  }

  let delta = b.H - a.H;

  if (delta > 180) {
    delta -= 360;
  }

  if (delta < -180) {
    delta += 360;
  }

  return delta;
}
```

---

# 36. sRGB Gamut

```ts
export function isInSrgbGamut(
  rgb: LinearRGB,
  epsilon = 1e-7
): boolean {
  return (
    rgb.r >= -epsilon &&
    rgb.r <= 1 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 1 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 1 + epsilon
  );
}
```

---

# 37. Parsing

V1.0 至少支持：

```text
#RGB
#RGBA
#RRGGBB
#RRGGBBAA
```

例如：

```text
#fff
#ffff
#2563eb
#2563ebcc
```

内部全部归一化：

```text
0..255 → 0..1
```

---

# 38. Color Pipeline

统一入口：

```ts
parseColor()
```

最终形成：

```text
CSS Color
    ↓
SRGB
    ↓
LinearRGB
    ↓
XYZ
    ↓
OKLab
    ↓
OKLCH
```

禁止在不同 API 中使用不同颜色转换路径。

---

# 39. Color API

`packages/color/src/index.ts`

统一导出：

```ts
export * from "./types/SRGB";
export * from "./types/LinearRGB";
export * from "./types/XYZ";
export * from "./types/OKLab";
export * from "./types/OKLCH";

export * from "./parsing/parseColor";

export * from "./srgb/srgbToLinear";
export * from "./srgb/linearToSrgb";

export * from "./xyz/linearRgbToXyz";
export * from "./xyz/xyzToLinearRgb";

export * from "./oklab/xyzToOklab";
export * from "./oklab/oklabToXyz";

export * from "./oklch/oklabToOklch";
export * from "./oklch/oklchToOklab";

export * from "./luminance/relativeLuminance";
export * from "./contrast/contrastRatio";

export * from "./difference/deltaL";
export * from "./difference/deltaC";
export * from "./difference/deltaH";

export * from "./gamut/isInSrgbGamut";
export * from "./gamut/gamutDistance";
```

---

# 40. Golden Tests

M1 第一批 Golden Test 必须优先覆盖数学基础。

目录：

```text
tests/
└── golden/
    └── color/
        ├── srgb/
        ├── xyz/
        ├── oklab/
        ├── oklch/
        ├── luminance/
        ├── contrast/
        ├── difference/
        └── gamut/
```

---

# 41. Contrast Golden

## CG-001

```text
Foreground: #000000
Background: #ffffff
Expected: 21
Tolerance: 0.0001
```

## CG-002

```text
Foreground: #ffffff
Background: #2563eb
Expected: ≈ 5.17
Tolerance: 0.01
```

## CG-003

```text
Foreground: #777777
Background: #ffffff
Expected: ≈ 4.48
Tolerance: 0.01
```

---

# 42. OKLab Golden

必须覆盖：

```text
black
white
red
green
blue
gray
neutral
low-chroma
```

特别验证：

```text
neutral → H = UNDEFINED
```

而不是：

```text
H = 0
```

---

# 43. Round Trip Golden

必须验证：

```text
sRGB
 ↓
Linear RGB
 ↓
XYZ
 ↓
OKLab
 ↓
XYZ
 ↓
Linear RGB
 ↓
sRGB
```

最终误差必须低于定义的计算容差。

Round-trip 不允许：

```text
premature clamp
```

---

# 44. Alpha Golden

必须验证：

```text
opaque
semi-transparent
transparent
```

特别验证：

```text
alpha compositing
```

必须在线性 RGB 中执行。

---

# 45. Hue Golden

至少：

```text
350° → 10° = +20°
10° → 350° = -20°
```

以及：

```text
C ≈ 0
```

情况下：

```text
H = UNDEFINED
```

---

# 46. Gamut Golden

至少测试：

```text
in-gamut
boundary
slightly-outside
far-outside
```

并确保：

```text
out-of-gamut
```

不会被错误地 Clamp 后判定为：

```text
in-gamut
```

---

# 47. Architecture Tests

M1 开始建立架构守护测试。

必须禁止 `@uiq/core` 依赖：

```text
react
react-dom
vue
radix
browser APIs
color
geometry
tokens
theme
```

必须禁止 Color 包依赖：

```text
react
vue
radix
browser
rules
diagnostic
```

禁止出现：

```text
Metric → Rule
Metric → Finding
Color → UI
Color → Browser
Core → Framework
```

---

# 48. Determinism

所有 Color Mathematics 必须满足：

```text
same input
+
same algorithm version
=
same output
```

禁止：

```ts
Math.random()
Date.now()
performance.now()
```

禁止访问：

```text
window
document
localStorage
network
```

---

# 49. Numeric Policy

UIQ M1 使用：

```text
IEEE 754 double
```

不允许为了显示方便而降低计算精度。

必须区分：

```text
Calculation Precision
Storage Precision
Display Precision
Comparison Tolerance
```

例如：

```text
Calculation:
full double precision

Display:
5.17

Comparison:
±0.01
```

不能反过来：

```text
先 round(5.17)
再进行计算
```

---

# 50. Error Policy

Color API 不允许静默修正非法输入。

例如：

```text
rgb = 1.4
```

不能偷偷变成：

```text
rgb = 1
```

应该由 API 明确：

```text
INVALID_INPUT
```

或者：

```text
OUT_OF_RANGE
```

---

# 51. M1 Acceptance Criteria

## AC-M1-01

`@uiq/core` 可以独立编译。

## AC-M1-02

`@uiq/color` 可以独立编译。

## AC-M1-03

Core 不依赖 UI Framework。

## AC-M1-04

Color 不依赖 Browser。

## AC-M1-05

sRGB ↔ Linear RGB 正确。

## AC-M1-06

Linear RGB ↔ XYZ D65 正确。

## AC-M1-07

XYZ ↔ OKLab 正确。

## AC-M1-08

OKLab ↔ OKLCH 正确。

## AC-M1-09

Relative Luminance 正确。

## AC-M1-10

Contrast Golden 全部通过。

## AC-M1-11

Hue Circular Difference 正确。

## AC-M1-12

Neutral Hue 返回 `UNDEFINED`。

## AC-M1-13

Gamut Detection 正确。

## AC-M1-14

Round-trip Golden 通过。

## AC-M1-15

Alpha Golden 通过。

## AC-M1-16

Architecture Tests 通过。

## AC-M1-17

所有 Color Mathematics 为 deterministic。

## AC-M1-18

Golden 数据不会自动更新。

---

# 52. M1 Definition of Done

M1 只有同时满足以下条件才算完成：

```text
[✓] pnpm install
[✓] typecheck
[✓] build
[✓] unit tests
[✓] color golden tests
[✓] architecture tests
[✓] round-trip tests
[✓] gamut tests
[✓] alpha tests
```

最终：

```text
pnpm typecheck
pnpm build
pnpm test
```

全部通过。

---

# 53. M1 Completion Boundary

M1 完成后的能力：

```text
Color Input
    ↓
Color Representation
    ↓
Color Conversion
    ↓
Color Quantification
    ↓
Golden Verification
```

但还不能：

```text
DOM
 ↓
Measurement
 ↓
Metric
```

因此下一阶段：

```text
M2
Geometry + Measurement
```

---

# 54. M1 → M2

下一阶段不重新设计 Core。

直接使用：

```text
@uiq/core
@uiq/color
```

增加：

```text
@uiq/geometry
@uiq/measurement
```

形成：

```text
Browser / Static Input
        ↓
Measurement
        ↓
Geometry
        ↓
Color
```

然后进入：

```text
M3 Metric Execution Engine
```

最终恢复完整执行链：

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

---

# 55. Architecture Freeze Statement

M1 不允许引入：

```text
Color Engine
Universal Design Engine
AI Design Engine
Aesthetic Engine
Theme Intelligence Layer
```

Color Mathematics 只是：

```text
@uiq/color
```

中的纯计算能力。

UIQ 的核心仍然是：

> **对真实 UI 进行可复现的量化、评价、解释和验证。**

架构继续保持冻结。