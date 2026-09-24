# UIQ-SKILL-04
# UIQ Skill Runtime & CLI Contract Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline  
**Skill:** `uiq-ui-quality`  
**CLI:** `uiq`  
**Runtime:** UIQ V1.0  
**Browser Runtime:** Playwright

---

# 1. 目标

本阶段解决三个问题：

1. Skill 如何可靠调用 UIQ CLI；
2. CLI 如何向 Skill 返回机器可读结果；
3. Playwright 如何成为真实 UI 测量执行环境。

最终链路：

```text id="a3k5r8"
AI Agent
   ↓
uiq-ui-quality Skill
   ↓
UIQ CLI
   ↓
Execution Request
   ↓
Playwright
   ↓
Real Browser
   ↓
Rendered DOM
   ↓
UIQ Browser Adapter
   ↓
UIQ Runtime
   ↓
Structured Artifact
   ↓
Skill
   ↓
AI Agent
```

---

# 2. Runtime Boundary

严格划分：

```text id="9u2bka"
┌─────────────────────────────┐
│         AI Agent            │
│ Intent / Conversation       │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│       UIQ Skill             │
│ Workflow / Interpretation   │
└──────────────┬──────────────┘
               │ CLI
┌──────────────▼──────────────┐
│        UIQ CLI              │
│ Argument / Process / Output  │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
 Playwright          Static
       │                │
       └───────┬────────┘
               ▼
┌─────────────────────────────┐
│       UIQ Runtime           │
│ Measurement / Metric / Rule │
│ Evaluation / Finding       │
│ Diagnostic / Regression    │
└─────────────────────────────┘
```

---

# 3. CLI Contract

CLI 必须支持：

```bash
uiq inspect
uiq measure
uiq analyze
uiq evaluate
uiq conformance
uiq regression
uiq snapshot
uiq report
```

统一参数：

```text id="xkm3ye"
--format
--output
--config
--verbose
```

机器调用：

```bash
--format json
```

---

# 4. Exit Code Contract

CLI：

```text id="0m0jse"
0 SUCCESS
1 POLICY_BLOCK
2 CONFORMANCE_FAILURE
3 EXECUTION_ERROR
4 INVALID_CONFIGURATION
5 INPUT_ERROR
```

Skill 不应该只根据 exit code 判断 UI 质量。

例如：

```text id="yyb6w4"
exit code = 1
```

表示 Policy Block，而不是：

```text id="vh1z8g"
UIQ = FAIL
```

必须读取 JSON Artifact。

---

# 5. Standard Request

CLI 内部统一请求模型：

```ts id="8j7q5v"
export interface UIQExecutionRequest {
  readonly command:
    | "inspect"
    | "measure"
    | "analyze"
    | "evaluate"
    | "conformance"
    | "regression"
    | "snapshot"
    | "report";

  readonly target?: UITarget;

  readonly scope?: UIScope;

  readonly browser?: BrowserConfiguration;

  readonly theme?: ThemeConfiguration;

  readonly baseline?: BaselineReference;

  readonly output?: OutputConfiguration;

  readonly configuration?: UIQConfiguration;
}
```

---

# 6. Target

```ts id="w8k1n4"
export interface UITarget {
  readonly url?: string;
  readonly selector?: string;
  readonly uiqId?: string;
  readonly page?: string;
}
```

优先级：

```text id="e2t5g0"
uiqId
 ↓
selector
 ↓
page
 ↓
url
```

---

# 7. Scope

```ts id="2kq5bh"
export interface UIScope {
  readonly dimensions?: readonly QualityDimension[];
  readonly subjects?: readonly string[];
  readonly components?: readonly string[];
  readonly themes?: readonly string[];
}
```

支持：

```text id="zx0g7p"
ACCESSIBILITY
COLOR
TYPOGRAPHY
GEOMETRY
SPACING
LAYOUT
HIERARCHY
DESIGN_SYSTEM
CONFORMANCE
```

---

# 8. Browser Configuration

```ts id="4q2x0e"
export interface BrowserConfiguration {
  readonly engine:
    | "chromium"
    | "firefox"
    | "webkit";

  readonly headless?: boolean;

  readonly viewport?: {
    readonly width: number;
    readonly height: number;
  };

  readonly deviceScaleFactor?: number;

  readonly locale?: string;

  readonly colorScheme?: "light" | "dark" | "no-preference";

  readonly reducedMotion?: boolean;

  readonly waitForFonts?: boolean;

  readonly waitUntil?:
    | "load"
    | "domcontentloaded"
    | "networkidle";
}
```

---

# 9. Default Browser Configuration

```json id="m5f8p1"
{
  "engine": "chromium",
  "headless": true,
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "colorScheme": "light",
  "reducedMotion": true,
  "waitForFonts": true,
  "waitUntil": "networkidle"
}
```

---

# 10. Playwright Contract

Playwright 只负责浏览器执行。

```ts id="t7q2nk"
export interface BrowserExecutor {
  launch(
    configuration: BrowserConfiguration
  ): Promise<BrowserSession>;
}
```

Session：

```ts id="4w3b9a"
export interface BrowserSession {
  goto(url: string): Promise<void>;

  waitForStableState(): Promise<void>;

  select(
    target: UITarget
  ): Promise<ElementHandle>;

  evaluate(
    script: string
  ): Promise<unknown>;

  close(): Promise<void>;
}
```

---

# 11. Stable UI State

分析前必须尽量稳定页面：

```text id="p7x8d2"
Navigation
 ↓
DOM Ready
 ↓
Fonts Ready
 ↓
Disable Animation
 ↓
Wait Layout Stable
 ↓
Measure
```

建议：

```js id="4l1fkp"
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

UIQ 不把动画状态作为默认测量对象。

---

# 12. Font Readiness

浏览器测量前：

```ts id="h8d2az"
await page.evaluate(async () => {
  if (document.fonts) {
    await document.fonts.ready;
  }
});
```

原因：

```text id="7qcm1m"
Font Loading
 ↓
Text Layout
 ↓
Text Measure
 ↓
Typography Metric
```

字体未稳定可能导致：

- width 改变
- line wrapping 改变
- height 改变
- typography metric 改变

---

# 13. Measurement Execution

Playwright 获取：

```text id="z6m0kh"
DOM Element
Computed Style
Bounding Rect
Viewport
Browser Environment
```

然后交给：

```text id="q7d1v9"
@uiq/browser
```

Browser Adapter 生成：

```text id="x7r3n8"
Measurement[]
```

再生成：

```text id="k2p4s6"
MeasurementSnapshot
```

---

# 14. CLI Analyze Pipeline

```text id="3w9f6b"
uiq analyze
     ↓
Resolve Target
     ↓
Playwright
     ↓
MeasurementSnapshot
     ↓
Metric Execution
     ↓
Rule Evaluation
     ↓
Finding
     ↓
Diagnostic
     ↓
Recommendation
     ↓
UIQualityReport
```

注意：

Recommendation 与 Report 都是下游能力。

---

# 15. JSON Response Contract

CLI 返回统一 Envelope：

```ts id="0m7c4k"
export interface UIQCLIResponse<T> {
  readonly schemaVersion: string;
  readonly uiqVersion: string;
  readonly cliVersion: string;
  readonly command: string;
  readonly status:
    | "COMPLETED"
    | "PARTIAL"
    | "UNKNOWN"
    | "ERROR";

  readonly data?: T;

  readonly errors?: readonly CLIError[];

  readonly warnings?: readonly CLIWarning[];

  readonly reproducibility?: ReproducibilityMetadata;
}
```

---

# 16. CLI Error

```ts id="w6y8r2"
export interface CLIError {
  readonly code: string;
  readonly message: string;
  readonly phase:
    | "INPUT"
    | "CONFIGURATION"
    | "BROWSER"
    | "MEASUREMENT"
    | "METRIC"
    | "RULE"
    | "REPORT"
    | "CONFORMANCE"
    | "REGRESSION";
  readonly details?: Readonly<Record<string, unknown>>;
}
```

---

# 17. Analyze Response

```json id="0w5n9c"
{
  "schemaVersion": "1.0.0",
  "uiqVersion": "1.0.0",
  "cliVersion": "1.0.0",
  "command": "analyze",
  "status": "COMPLETED",
  "data": {
    "snapshot": {},
    "metrics": [],
    "evaluations": [],
    "findings": [],
    "diagnostics": [],
    "recommendations": [],
    "report": {}
  }
}
```

Skill 应优先读取：

```text id="2i4g7x"
data.evaluations
data.findings
data.diagnostics
data.recommendations
```

---

# 18. Reproducibility

CLI 必须返回：

```ts id="h1y3q6"
export interface ReproducibilityMetadata {
  readonly snapshotId: string;
  readonly engine: {
    readonly name: string;
    readonly version: string;
  };
  readonly metricVersions: readonly string[];
  readonly ruleVersions: readonly string[];
  readonly configurationHash: string;
  readonly executionFingerprint: string;
}
```

如果通过 Playwright：

```text id="7z9v1k"
browser
browserVersion
viewport
deviceScaleFactor
theme
locale
```

也应记录。

---

# 19. Skill Invocation

Skill 执行：

```bash id="0j6m2n"
uiq analyze \
  --url http://localhost:3000 \
  --format json
```

而不是：

```bash id="6s3w7e"
uiq analyze
```

然后解析终端输出。

---

# 20. Skill Process Contract

推荐：

```text id="x4f8m2"
spawn uiq
stdin
stdout
stderr
exit code
```

其中：

```text id="k8q0t3"
stdout = JSON Artifact
stderr = diagnostic/log
exit code = process result
```

这样 Agent 不会把日志误认为分析结果。

---

# 21. JSON Only Mode

建议 CLI 增加：

```bash id="k7z5q1"
uiq analyze \
  --url http://localhost:3000 \
  --format json \
  --quiet
```

约束：

```text id="n8x3q0"
stdout:
ONLY JSON

stderr:
logs / diagnostics
```

这对 Skill 非常重要。

---

# 22. Skill Decision Process

Skill 不应该：

```text id="8m4k1z"
读取 HTML
 ↓
自己分析
```

应该：

```text id="h7v2p5"
Intent
 ↓
Workflow
 ↓
CLI
 ↓
JSON
 ↓
Interpretation
```

---

# 23. Analyze Decision Tree

```text id="f6w3y8"
User Request
      │
      ▼
指定元素？
 ├── Yes → inspect
 └── No
      │
      ▼
指定领域？
 ├── Accessibility → accessibility
 ├── Color → color
 ├── Typography → typography
 ├── Design System → design-system
 └── No
      │
      ▼
检查回归？
 ├── Yes → regression
 └── No → analyze
```

如果用户要求：

> “分析并给出改进建议”

执行：

```text id="m3k9q2"
analyze
 ↓
diagnostics
 ↓
recommendations
 ↓
report
```

---

# 24. Recommendation Interpretation

Skill 可以把结构化 Recommendation 转成人类语言：

```text id="x5v7m1"
Recommendation:
REVIEW_TOKEN

Target:
button.secondary

Evidence:
TOKEN_MATCH = FAIL

Impact:
12 elements
3 components

Verification:
TOKEN_MATCH = PASS
```

Agent：

> 建议检查 `button.secondary` 的 Component Token 绑定。当前有 12 个元素受到影响，验证标准是重新测量后 `TOKEN_MATCH@1.0.0` 达到 PASS。

---

# 25. Priority Presentation

Skill 可以帮助排序展示问题，但**不得产生新的质量评分**。

可以使用 UIQ 已提供的信息：

```text id="1h6c8v"
Severity
Finding Count
Affected Elements
Affected Components
Affected Themes
Release Gate Impact
```

例如：

```text id="z9w3x5"
HIGH
4 Findings
18 Elements
3 Components
```

然后展示为：

> 该问题具有 HIGH Severity，并影响 18 个元素。

而不是：

> 优先级 92 分。

---

# 26. Cross-Finding Aggregation

多个 Finding：

```text id="a3x7k1"
Finding 1
Finding 2
Finding 3
Finding 4
```

如果全部：

```text id="q8m2v6"
Component = Button
Token = color.button.secondary
```

Skill 可以汇总：

```text id="j1w9p4"
4 个 Findings
→ 同一 Component Token
```

但仍保留原始 Finding。

---

# 27. Evidence Trace

Skill 回答：

> 为什么这里有问题？

必须尽量输出：

```text id="f4j7z8"
Element
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

而不是：

```text id="p9x2c4"
AI认为存在问题。
```

---

# 28. Playwright Cross-Browser

完整 Conformance：

```text id="q3v7m1"
                 UIQ Skill
                     │
                  UIQ CLI
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    Chromium       Firefox      WebKit
        │            │            │
        ▼            ▼            ▼
    Snapshot      Snapshot     Snapshot
        │            │            │
        └────────────┼────────────┘
                     ▼
                 Conformance
```

---

# 29. Theme Matrix

可以组合：

```text id="w6p8y2"
Browsers × Themes
```

例如：

```text id="k3r7m9"
Chromium
  Light
  Dark

Firefox
  Light
  Dark

WebKit
  Light
  Dark
```

每个组合生成独立 Snapshot。

---

# 30. Snapshot Identity

Snapshot ID 不应仅使用：

```text id="x4y7k1"
timestamp
```

建议：

```text id="n6p2z9"
SHA-256(
  target
  + browser
  + viewport
  + theme
  + measurement configuration
  + rendered state
)
```

同时保留生成时间作为 metadata。

---

# 31. Static Mode

Skill 不应该强制 Playwright。

如果输入已经是：

```text id="z7c3m5"
MeasurementSnapshot.json
```

可以：

```text id="w8x1n4"
Snapshot
 ↓
Metrics
 ↓
Rules
 ↓
Findings
 ↓
Diagnostics
 ↓
Recommendations
```

因此：

```text id="r4q9s2"
Playwright = Browser Acquisition

UIQ = Analysis
```

---

# 32. CI Mode

CI：

```text id="y3m7k1"
Git PR
 ↓
Build
 ↓
Start Application
 ↓
Playwright
 ↓
UIQ
 ↓
Regression
 ↓
Release Gate
```

Skill 可以读取 CI Artifact：

```text id="c5v8p2"
uiq-result.json
uiq-regression.json
uiq-report.json
```

然后向 Agent 汇报。

---

# 33. Agent PR Workflow

用户：

> 检查这个 PR 有没有 UI 问题。

Skill：

```text id="n4q7x9"
1. Locate baseline
2. Locate current build
3. Run UIQ
4. Run regression
5. Read NEW_FAILURE
6. Read NEW_UNKNOWN
7. Trace Findings
8. Summarize
```

输出：

```text id="g2w5m8"
UI Regression Summary

NEW_FAILURE: 2
FIXED_FAILURE: 1
PERSISTING_FAILURE: 0
NEW_UNKNOWN: 1

主要变化：
...
```

---

# 34. Report Artifact

推荐产生：

```text id="k6v2x9"
artifacts/
├── uiq-snapshot.json
├── uiq-analysis.json
├── uiq-regression.json
├── uiq-report.json
├── uiq-report.md
└── uiq-report.html
```

JSON 是事实源。

Markdown/HTML 是展示层。

---

# 35. Skill Artifact Handling

Skill 不应该复制完整大型 JSON。

Agent 上下文优先读取：

```text id="p7m3x1"
summary
findings
diagnostics
recommendations
verification
```

只有需要追踪证据时再读取：

```text id="h5q8v2"
metric
measurement
token
theme
snapshot
```

这样可以控制 Context 消耗。

---

# 36. Large Project Strategy

页面很多时：

```text id="x8r4m1"
Project
 ↓
Page
 ↓
Region
 ↓
Component
 ↓
Element
```

Skill 应采用：

```text id="v2k7p9"
Broad Analysis
 ↓
Findings
 ↓
Targeted Inspect
 ↓
Detailed Diagnostic
```

而不是一次把所有 DOM 数据塞进 Agent Context。

---

# 37. Skill Caching

允许缓存：

```text id="g4m8x2"
MeasurementSnapshot
```

但必须：

```text id="d7p1z5"
Snapshot ID
+
Environment
+
UIQ Version
```

一致才能复用。

不能因为 URL 相同就直接认为页面相同。

---

# 38. Failure Handling

### Browser Failure

```text id="k9x2m7"
Browser launch failed
```

Skill：

> 浏览器执行阶段失败，因此没有获得可靠的 UI 测量结果。

---

### Measurement Failure

```text id="p3v8q1"
Measurement = ERROR
```

Skill：

> 测量执行失败，不能据此判断 UI 是否符合规则。

---

### Unknown

```text id="n6y4m2"
Measurement = UNKNOWN
```

Skill：

> 当前证据不足，结果为 UNKNOWN。

---

# 39. Security

CLI 执行 URL 时必须考虑：

```text id="q7m1x5"
SSRF
Local Network Access
Credentials
Cookies
Environment Variables
File Access
```

因此 Skill V1.0：

```text id="j8r3v6"
允许访问：
用户明确提供的目标

禁止默认：
任意内部网络扫描
任意文件系统扫描
任意凭据读取
```

---

# 40. Skill 与 Git

Skill 可以读取：

```text id="w5p9k2"
git diff
git status
baseline artifacts
```

用于确定：

```text id="h3x7m1"
changed scope
```

但 V1.0：

```text id="s8q2v4"
不执行 git commit
不执行 git push
```

---

# 41. Final Execution Model

```text id="m7q3x8"
                  AI Agent
                      │
                      ▼
              uiq-ui-quality
                   Skill
                      │
                      ▼
                   UIQ CLI
                      │
          ┌───────────┴───────────┐
          │                       │
     Browser Mode             Static Mode
          │                       │
      Playwright              Snapshot
          │                       │
          ▼                       ▼
     Real Browser           Measurement
          │                       │
          └───────────┬───────────┘
                      ▼
                  UIQ Runtime
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Measurement      Metric         Rule
        │             │             │
        └─────────────┼─────────────┘
                      ▼
                  Evaluation
                      │
                   Finding
                      │
                  Diagnostic
                      │
                Recommendation
                      │
                  Verification
                      │
                  Regression
                      │
                    Report
```

---

# 42. V1.0 Architecture Freeze

本规范冻结以下边界：

```text
Playwright
    = Browser Acquisition

UIQ Browser Adapter
    = DOM → Measurement

UIQ Runtime
    = Deterministic Analysis

UIQ CLI
    = Automation Contract

UIQ Skill
    = Agent Workflow

AI Agent
    = Intent / Explanation / Collaboration
```

不增加：

```text
AI Quality Engine
AI Metric Engine
AI Rule Engine
AI Aesthetic Engine
AI Design Engine
```

---

# 43. Definition of Done

- [ ] CLI Request Contract
- [ ] CLI Response Contract
- [ ] JSON Schema
- [ ] Exit Code Contract
- [ ] Playwright Contract
- [ ] Browser Configuration
- [ ] Theme Configuration
- [ ] Snapshot Contract
- [ ] Reproducibility Contract
- [ ] Static Mode
- [ ] Browser Mode
- [ ] Cross-Browser Mode
- [ ] CI Mode
- [ ] Skill Invocation
- [ ] Evidence Preservation
- [ ] Error Handling
- [ ] Security Boundary
- [ ] Artifact Management
- [ ] Regression Workflow

---

# 44. Final Conclusion

UIQ Skill 的工程模型最终确定为：

```text
Skill
  ↓
CLI
  ↓
Playwright / Snapshot
  ↓
UIQ
  ↓
JSON Artifact
  ↓
Skill Interpretation
  ↓
Agent
```

其中最关键的工程原则是：

> **Skill 不直接“做 UI 质量判断”，而是调用 UIQ 获取确定性证据，再由 Agent 对证据进行理解、解释和协作。**

这样 UIQ 才能同时服务于：

```text
Designer
Developer
Design System Team
CI/CD
AI Coding Agent
AI Design Agent
Enterprise Governance
```

而不会因为加入 Agent 能力而破坏 UIQ V1.0 的确定性和可验证性。