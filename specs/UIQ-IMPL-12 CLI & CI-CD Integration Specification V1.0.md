# UIQ-IMPL-12
# CLI & CI/CD Integration Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 10  
**Previous:** UIQ-IMPL-11 Conformance & Regression Runtime Specification V1.0  
**Next:** UIQ-IMPL-13 Design System Integration & Theme Validation Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ CLI 及 CI/CD 集成能力。

目标：

```text
Developer
   ↓
UIQ CLI
   ↓
Analysis
   ↓
Conformance
   ↓
Regression
   ↓
Policy
   ↓
PASS / WARN / BLOCK
```

UIQ 从：

> UI 分析工具

进一步成为：

> **UI 质量验证与 Design System Conformance 工程工具。**

---

# 2. CLI 定位

UIQ CLI 是 Application 层工具。

它负责：

- 参数解析
- Runtime 编排
- Snapshot 管理
- Conformance 执行
- Regression 执行
- Policy 执行
- Report 输出
- CI Exit Code

CLI 不负责：

```text
❌ Color Math
❌ Metric Calculation
❌ Rule Calculation
❌ Browser Measurement
❌ Finding Calculation
```

这些能力必须调用已有 Runtime。

---

# 3. CLI 命令模型

V1.0：

```text
uiq
├── inspect
├── measure
├── analyze
├── evaluate
├── conformance
├── regression
├── snapshot
└── report
```

---

# 4. inspect

用于交互式 Inspector。

```bash
uiq inspect ./page.html
```

流程：

```text
HTML
 ↓
Browser
 ↓
Inspector
```

适合本地开发。

---

# 5. measure

只执行 Measurement。

```bash
uiq measure ./page.html
```

输出：

```text
MeasurementSnapshot
```

不会执行：

```text
Rule
Finding
Diagnostic
```

---

# 6. analyze

执行完整分析：

```bash
uiq analyze ./page.html
```

流程：

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

---

# 7. evaluate

用于规则验证：

```bash
uiq evaluate ./page.html
```

也可以指定规则：

```bash
uiq evaluate ./page.html \
  --rule ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

---

# 8. conformance

执行规范一致性验证：

```bash
uiq conformance
```

等级：

```bash
uiq conformance --level core
uiq conformance --level standard
uiq conformance --level browser
uiq conformance --level full
```

---

# 9. regression

执行 Baseline 比较：

```bash
uiq regression \
  --baseline baseline.json \
  --current current.json
```

---

# 10. snapshot

保存分析结果：

```bash
uiq snapshot ./page.html \
  --output snapshot.json
```

---

# 11. report

将已有结果转换成报告：

```bash
uiq report snapshot.json
```

支持：

```text
terminal
json
markdown
html
```

---

# 12. CLI Package

建议：

```text
apps/cli/
├── src/
│   ├── commands/
│   │   ├── inspect.ts
│   │   ├── measure.ts
│   │   ├── analyze.ts
│   │   ├── evaluate.ts
│   │   ├── conformance.ts
│   │   ├── regression.ts
│   │   ├── snapshot.ts
│   │   └── report.ts
│   │
│   ├── config/
│   ├── output/
│   ├── exit-code/
│   └── index.ts
```

---

# 13. CLI Runtime

```ts
export interface CliRuntime {
  execute(
    request: CliRequest
  ): Promise<CliResult>;
}
```

---

# 14. CliRequest

```ts
export interface CliRequest {
  command:
    | "inspect"
    | "measure"
    | "analyze"
    | "evaluate"
    | "conformance"
    | "regression"
    | "snapshot"
    | "report";

  input?: string;

  config?: string;

  output?: string;

  format?: "terminal" | "json" | "markdown" | "html";
}
```

---

# 15. 配置文件

推荐：

```text
uiq.config.json
```

例如：

```json
{
  "version": "1.0.0",
  "rules": [
    "ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0"
  ],
  "conformance": {
    "level": "STANDARD"
  }
}
```

---

# 16. 配置原则

配置可以改变：

```text
Rule Configuration
Policy Profile
Target
Output
```

但不能改变：

```text
Metric ID
Metric Version
Rule ID
Rule Version
```

例如不能通过配置：

```json
{
  "metricVersion": "latest"
}
```

绕过版本固定。

---

# 17. Policy Profile

CLI 可以指定：

```json
{
  "policyProfile": "default"
}
```

Policy Profile 定义：

```text
Rules
Configurations
Release Gate
```

---

# 18. Release Gate

CLI 最终输出：

```text
ALLOW
WARN
BLOCK
```

但这些不是 Evaluation State。

关系：

```text
Evaluation
    ↓
Policy
    ↓
Release Gate
```

---

# 19. Exit Code

建议：

```text
0 = SUCCESS
1 = POLICY_BLOCK
2 = CONFORMANCE_FAILURE
3 = EXECUTION_ERROR
4 = INVALID_CONFIGURATION
5 = INPUT_ERROR
```

---

# 20. Exit Code 原则

CI 不应该通过解析：

```text
"FAILED"
```

来判断结果。

必须使用：

```text
Process Exit Code
```

---

# 21. WARN

例如：

```text
Evaluation:
WARN

Release Gate:
WARN
```

CLI：

```text
exit 0
```

或者由 Policy 配置为：

```text
exit 1
```

但必须由 Policy 明确决定。

---

# 22. BLOCK

例如：

```text
NEW_FAILURE
Severity = HIGH
```

Policy：

```text
NEW_FAILURE + HIGH
→ BLOCK
```

CLI：

```text
exit 1
```

---

# 23. CI Pipeline

标准 Pipeline：

```text
Install
 ↓
Build
 ↓
Unit
 ↓
Golden
 ↓
Schema
 ↓
Browser
 ↓
Conformance
 ↓
Snapshot
 ↓
Regression
 ↓
Policy
 ↓
Release
```

---

# 24. Pull Request Pipeline

PR 阶段建议：

```text
Changed Components
       ↓
UIQ Analysis
       ↓
Regression
       ↓
Policy
```

避免每次都执行整个项目。

---

# 25. Full Release Pipeline

Release：

```text
CORE
 ↓
STANDARD
 ↓
BROWSER
 ↓
FULL
 ↓
REGRESSION
 ↓
RELEASE GATE
```

---

# 26. Git Integration

CLI 可以读取：

```text
git diff
```

但 UIQ 不把 Git 当作 Domain。

Git 只是：

```text
External Change Source
```

---

# 27. Changed Scope

可以将 Git Change 转换为：

```text
ChangedFiles
 ↓
ChangedComponents
 ↓
AffectedSnapshots
```

然后执行增量分析。

---

# 28. Incremental Analysis

例如修改：

```text
Button.css
```

系统可以优先分析：

```text
Button
Button variants
相关 Theme
相关 Token
```

但不能因此忽略 Policy 要求的 Full Conformance。

---

# 29. Impact Trace + Incremental

利用已有：

```text
Token Impact Trace
Component Impact Trace
Theme Impact Trace
```

生成：

```text
Affected Scope
```

---

# 30. Affected Scope

```ts
export interface AffectedScope {
  tokens: string[];

  components: string[];

  themes: string[];

  elements: string[];
}
```

---

# 31. Snapshot Naming

建议：

```text
uiq/
├── snapshots/
│   ├── main/
│   ├── pr/
│   └── release/
```

例如：

```text
snapshot-main-001.json
snapshot-pr-482-001.json
```

---

# 32. Baseline Policy

Baseline 来源必须明确：

```text
MAIN
RELEASE
EXPLICIT
```

不能默认：

```text
latest
```

导致不可重复。

---

# 33. Baseline Metadata

```ts
export interface BaselineMetadata {
  id: string;

  source:
    | "MAIN"
    | "RELEASE"
    | "EXPLICIT";

  createdAt: string;

  commit?: string;

  engine: EngineInfo;
}
```

---

# 34. CI Environment

Snapshot 必须记录：

```text
Browser
Browser Version
OS
Viewport
DevicePixelRatio
Zoom
Engine Version
```

---

# 35. 环境一致性

Regression 最好比较相同：

```text
Browser
Viewport
DPR
Zoom
Theme
```

否则：

```text
Changed Result
```

可能只是环境差异。

---

# 36. Environment Mismatch

如果：

```text
Baseline:
Chromium 153

Current:
Firefox 153
```

UIQ 应报告：

```text
ENVIRONMENT_MISMATCH
```

而不是直接将全部 UI 差异视为 Regression。

---

# 37. Deterministic Mode

CI 必须启用：

```text
deterministic = true
```

包括：

```text
Animations disabled
Fonts loaded
Stable viewport
Stable theme
Stable browser
```

---

# 38. Animation Handling

建议：

```css
* {
  animation: none !important;
  transition: none !important;
}
```

但这属于：

```text
Test Environment Adapter
```

不是 UIQ Metric。

---

# 39. Font Stability

浏览器分析前：

```ts
await document.fonts.ready;
```

必要时等待：

```text
layout stabilization
```

---

# 40. Dynamic Content

动态内容必须支持：

```text
Fixture
Mock
Static Data
```

避免：

```text
Network
 ↓
Random Content
 ↓
Different Snapshot
```

---

# 41. External Network

默认：

```text
OFF
```

CI 不应该依赖：

```text
External API
CDN
Random Remote Content
```

---

# 42. Report Artifact

CI 应保存：

```text
uiq-report.json
uiq-report.html
uiq-snapshot.json
uiq-regression.json
```

---

# 43. JSON Report

机器读取：

```json
{
  "status": "BLOCK",
  "summary": {
    "newFailures": 2,
    "fixedFailures": 1,
    "changedResults": 4
  }
}
```

---

# 44. HTML Report

HTML 报告建议包含：

```text
Summary
 ↓
New Failures
 ↓
Changed Results
 ↓
Findings
 ↓
Diagnostics
 ↓
Evidence Trace
 ↓
Token Trace
 ↓
Theme
```

---

# 45. Terminal Report

例如：

```text
UIQ Analysis

Subjects       84
Metrics       512
Evaluations   126
Findings        4

Regression
-------------------------
NEW_FAILURE        2
FIXED_FAILURE      1
CHANGED_RESULT     4

Release Gate
-------------------------
BLOCK
```

---

# 46. PR Comment

如果接入 Git 平台，可以生成：

```text
UIQ Result

New Findings: 2
Fixed Findings: 1
Changed Results: 4

Release Gate: BLOCK
```

这里的 PR Comment Adapter 属于：

```text
Integration Adapter
```

而不是 UIQ Core。

---

# 47. CI Adapter

建议：

```text
packages/ci-adapters/
```

或者：

```text
apps/ci/
```

V1.0 可以只提供通用 CLI 输出，不绑定具体 Git 平台。

---

# 48. 第三方 CI

CLI 应可以被：

```text
GitHub Actions
GitLab CI
Jenkins
Azure Pipelines
其他 CI
```

直接调用。

---

# 49. GitHub Actions 示例

```yaml
- name: UIQ
  run: |
    pnpm uiq conformance --level full
    pnpm uiq regression \
      --baseline baseline.json \
      --current current.json
```

---

# 50. GitLab CI 示例

```yaml
uiq:
  script:
    - pnpm uiq conformance --level full
    - pnpm uiq regression --baseline baseline.json --current current.json
  artifacts:
    paths:
      - uiq-report.json
      - uiq-report.html
```

---

# 51. CI 不应该直接调用内部 Package

推荐：

```text
CI
 ↓
CLI
 ↓
Public Runtime
```

而不是：

```text
CI
 ↓
@uiq/metrics internals
```

---

# 52. Public CLI API

只保证：

```text
uiq inspect
uiq measure
uiq analyze
uiq evaluate
uiq conformance
uiq regression
uiq snapshot
uiq report
```

内部 TypeScript API 可以继续演进。

---

# 53. Versioning

CLI：

```text
@uiq/cli@1.0.0
```

Metric：

```text
COLOR.CONTRAST@1.0.0
```

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

必须独立版本化。

---

# 54. CLI Version Compatibility

报告必须记录：

```text
CLI Version
Engine Version
Metric Versions
Rule Versions
```

---

# 55. Configuration Validation

CLI 启动时必须验证：

```text
Config Schema
Rule Reference
Metric Reference
Policy Profile
Target
```

错误配置：

```text
INVALID_CONFIGURATION
```

退出：

```text
4
```

---

# 56. Missing Metric

如果 Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

要求：

```text
COLOR.CONTRAST@1.0.0
```

但 Registry 没有：

```text
COLOR.CONTRAST@1.0.0
```

必须：

```text
EXECUTION_ERROR
```

不能自动使用：

```text
COLOR.CONTRAST@latest
```

---

# 57. CI Cache

可以缓存：

```text
pnpm store
Metric Plan
Browser binaries
```

但不能跨 Snapshot 错误复用：

```text
MetricResult
EvaluationResult
```

---

# 58. Performance

目标不是：

> 每一次 CI 都计算整个世界。

而是：

```text
Changed Scope
+
Impact Trace
+
Required Policy Scope
```

进行最小必要计算。

---

# 59. Full Conformance Override

即使增量分析判断：

```text
Button unchanged
```

如果 Policy 要求：

```text
FULL_CONFORMANCE
```

仍必须执行完整验证。

---

# 60. Security

CLI 默认不允许：

```text
Arbitrary Network
Arbitrary Code Execution
```

输入文件必须限制：

```text
workspace scope
```

---

# 61. Report Security

HTML Report 不应该默认执行：

```text
remote JavaScript
remote CSS
```

报告应尽量：

```text
self-contained
```

---

# 62. PII

UIQ Report 默认不应采集：

```text
用户个人信息
业务数据
输入内容全文
```

只记录完成分析所需的最小证据。

---

# 63. Artifact Retention

UIQ 不规定组织必须保存多久。

可以由：

```text
CI
Compliance
Organization Policy
```

决定。

---

# 64. CLI Tests

必须覆盖：

```text
Command Parsing
Config Validation
Exit Codes
JSON Output
Markdown Output
HTML Output
Snapshot
Regression
Conformance
Policy
```

---

# 65. CLI Golden

例如：

```text
uiq conformance --level core
```

必须有稳定输出模型。

文本格式可以变化，但：

```text
JSON Schema
Exit Code
Machine Status
```

必须稳定。

---

# 66. Integration Tests

测试：

```text
CLI
 ↓
Metric Engine
 ↓
Rule Engine
 ↓
Finding
 ↓
Regression
 ↓
Policy
```

---

# 67. End-to-End Test

测试页面：

```html
<button>
  Submit
</button>
```

颜色：

```text
#FFFFFF
/
#2563EB
```

运行：

```bash
uiq analyze page.html
```

预期：

```text
Contrast ≈ 5.17
WCAG AA = PASS
Finding = 0
Gate = ALLOW
```

---

# 68. Regression E2E

修改为：

```text
#777777
/
#FFFFFF
```

预期：

```text
Contrast ≈ 4.48
WCAG AA = FAIL
Finding = NEW
Regression = NEW_FAILURE
Gate = BLOCK
```

前提是 Policy 将该 Finding 配置为阻断条件。

---

# 69. Acceptance Criteria

## AC-CLI-01

CLI 可以执行 Measurement。

## AC-CLI-02

CLI 可以执行完整 Analysis。

## AC-CLI-03

CLI 可以执行 Conformance。

## AC-CLI-04

CLI 可以执行 Regression。

## AC-CLI-05

CLI 支持 JSON 输出。

## AC-CLI-06

CLI 支持稳定 Exit Code。

## AC-CLI-07

配置不能隐式升级 Metric/Rule Version。

## AC-CLI-08

Snapshot 包含环境信息。

## AC-CI-01

CLI 可以在无交互 CI 环境运行。

## AC-CI-02

浏览器测量具有确定性配置。

## AC-CI-03

CI 可以保存 Analysis Artifact。

## AC-CI-04

Regression 可以作为 Release Gate 输入。

## AC-CI-05

Policy 可以决定 ALLOW/WARN/BLOCK。

## AC-CI-06

Environment Mismatch 可以被识别。

## AC-CI-07

增量分析不能绕过 Full Conformance Policy。

---

# 70. 当前工程架构

```text
packages/
├── core
├── color
├── geometry
├── measurement
├── metrics
├── rules
├── diagnostic
├── tokens
├── theme
├── browser
├── conformance
└── regression

apps/
├── inspector
├── playground
└── cli
```

没有增加：

```text
❌ ci-core
❌ quality-core
❌ governance-core
❌ analysis-core
```

---

# 71. UIQ V1.0 工程闭环

现在可以形成：

```text
                Design System
                     │
                Token / Theme
                     │
                     ▼
                   Real UI
                     │
                     ▼
                Measurement
                     │
                     ▼
                   Metric
                     │
                     ▼
                    Rule
                     │
                     ▼
                 Evaluation
                     │
                ┌────┴────┐
                ▼         ▼
             Finding   Regression
                │         │
                ▼         │
            Diagnostic    │
                │         │
                └────┬────┘
                     ▼
                Conformance
                     │
                     ▼
                   Policy
                     │
                     ▼
              Release Gate
                     │
              ┌──────┼──────┐
              ▼      ▼      ▼
            ALLOW   WARN   BLOCK
```

---

# 72. V1.0 最终定位

UIQ 现在已经不是单纯的：

> Color checker

也不是：

> Accessibility checker

更不是：

> AI UI evaluator。

它是一套：

> **可测量、可计算、可验证、可追踪、可回归的 UI Design Quality Engineering System。**

---

# 73. 核心价值链

```text
Measure
 ↓
Quantify
 ↓
Evaluate
 ↓
Explain
 ↓
Conform
 ↓
Regress
 ↓
Gate
```

---

# 74. 架构冻结

Phase 10 后：

**UIQ Core Architecture 不再扩张。**

核心链保持：

```text
Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding
→ Diagnostic
```

外围能力：

```text
Token
Theme
Browser
Inspector
Conformance
Regression
CLI
CI
```

通过既有 Extension Point 扩展。

---

# 75. 下一阶段

下一阶段进入：

# UIQ-IMPL-13
# Design System Integration & Theme Validation Specification V1.0

重点不是继续扩展 UIQ Core，而是把 UIQ 与你前面设计的**色度学 / OKLCH / Token / Theme 系统**正式接起来：

```text
Perceptual Color Space
        ↓
Palette
        ↓
Semantic Token
        ↓
Component Token
        ↓
Theme
        ↓
Rendered UI
        ↓
UIQ Measurement
        ↓
Metric
        ↓
Rule
        ↓
Conformance
```

尤其解决三个关键问题：

1. **OKLCH 色彩系统如何进入 UIQ，而不把 UIQ 变成颜色设计器**
2. **Theme Export 如何携带 UIQ 验证结果，而不仅仅导出 CSS Variables**
3. **Radix UI / React Design System 如何通过 Adapter 接入，而不污染 UIQ Core**

这一阶段完成后，UIQ 与你正在设计的**基于感知色彩空间的主题系统**就可以形成一个完整但边界清晰的工程闭环。