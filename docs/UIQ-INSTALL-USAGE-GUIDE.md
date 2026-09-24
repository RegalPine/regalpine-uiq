# UIQ 安装与使用手册

| 项目 | 内容 |
|------|------|
| 版本 | 1.0.0 |
| 适用对象 | 工程开发者、CI 运维、Agent Skill 集成者 |
| 前置要求 | Node.js 24、pnpm 10、macOS / Linux |

---

## 1. 环境要求

| 依赖 | 精确版本 | 说明 |
|------|---------|------|
| Node.js | `>=24 <25`（推荐 24.13.0） | 工程根目录 `.node-version` 文件已锁定 |
| pnpm | `>=10 <11`（推荐 10.28.2） | `package.json` 中 `packageManager` 字段已锁定 |
| 操作系统 | macOS / Linux | Playwright 三浏览器矩阵在 CI（Ubuntu）和本地（macOS）均已验证 |
| 磁盘空间 | ~2 GB | 含 `node_modules`、`.pnpm-store` 和 Playwright 浏览器二进制 |

> **Windows 用户**：工程未在 Windows 环境验证。建议使用 WSL2 或容器环境。

---

## 2. 安装步骤

### 2.1 克隆工程

```bash
git clone <repository-url> uiq
cd uiq
```

### 2.2 安装 Node.js

推荐使用 [fnm](https://github.com/Schniz/fnm) 或 [nvm](https://github.com/nvm-sh/nvm)：

```bash
# fnm
fnm install 24.13.0
fnm use 24.13.0

# 或 nvm
nvm install 24.13.0
nvm use 24.13.0

# 验证
node -v   # v24.13.0
```

### 2.3 安装 pnpm

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate

# 验证
pnpm -v   # 10.28.2
```

### 2.4 安装依赖

```bash
pnpm install --frozen-lockfile
```

此命令根据锁文件安装所有 workspace 包的依赖，确保可重复性。首次安装会创建 `.pnpm-store` 目录。

### 2.5 安装 Playwright 浏览器

如果需要运行浏览器测试或 CLI 的 `measure`/`analyze`/`snapshot` 命令：

```bash
# 安装三浏览器（Chromium、Firefox、WebKit）
pnpm exec playwright install --with-deps chromium firefox webkit

# 或仅安装 Chromium（最小安装）
pnpm exec playwright install --with-deps chromium
```

### 2.6 构建所有包

```bash
pnpm build
```

此命令按依赖顺序构建所有 13 个包和 4 个应用。构建产物输出到各包的 `dist/` 目录。

### 2.7 全局安装 CLI（可选）

构建后可将 CLI 链接为全局命令 `uiq`，在任意目录直接使用：

```bash
cd apps/cli
pnpm link --global

# 验证
uiq --help

# 取消全局链接
pnpm unlink --global
```

> 如果提示 `PNPM_HOME` 未配置，需先在 `~/.zshrc` 中添加：
> ```bash
> export PNPM_HOME="$HOME/Library/pnpm"
> export PATH="$PNPM_HOME:$PATH"
> ```
> 然后执行 `source ~/.zshrc`。

以下文档中的 CLI 示例均假设已全局安装。如未全局安装，请将 `uiq` 替换为 `node apps/cli/dist/index.js`。

### 2.8 验证安装

```bash
pnpm run ci
```

完整流水线依次执行：`format:check → lint → build → typecheck → test → playwright`。全部通过即表示安装成功。

---

## 3. 工程结构

```
uiq/
├── packages/               # 13 个领域/运行时包
│   ├── core/               # 核心类型、Schema、Registry、指纹
│   ├── color/              # 颜色解析、空间转换、对比度、ΔL/ΔC/ΔH
│   ├── geometry/           # 矩形、面积、交并集、距离
│   ├── measurement/        # 测量校验、单位归一、快照构建
│   ├── metrics/            # MetricRegistry、DAG Planner、执行引擎
│   ├── rules/              # RuleRegistry、Operator、Range、六态传播
│   ├── diagnostic/         # Finding 工厂、Evidence、诊断原因分类
│   ├── browser/            # DOM 实体映射、颜色/几何/排版采集
│   ├── tokens/             # Token 导入、引用图、解析链
│   ├── theme/              # 主题覆盖、状态上下文、多主题解析
│   ├── conformance/        # Schema/Contract/Golden 校验
│   ├── regression/         # Baseline、Diff、六类回归分类
│   └── reporting/          # 报告聚合、建议、验证、渲染器
├── integrations/
│   └── radix/              # Radix 组件标识与绑定投影
├── apps/
│   ├── cli/                # 七命令 CLI（measure/analyze/evaluate/...）
│   ├── inspector/          # 交互式分析 UI（React + Vite）
│   ├── playground/         # 调试 Playground（React + Vite）
│   └── reference/          # 测试夹具页面（Button/Card/Dialog/...）
├── skills/
│   └── uiq-ui-quality/     # Agent Skill 入口与工作流文档
├── tests/                  # 测试目录
│   ├── unit/               # 单元测试（按包分目录）
│   ├── architecture/       # 架构约束测试（包白名单、无环）
│   ├── golden/             # 独立数学期望 Golden 测试
│   ├── schema/             # Schema 与契约验证
│   ├── browser/            # Playwright 三浏览器 Light/Dark 矩阵
│   ├── e2e/                # CLI 端到端测试
│   ├── integration/        # 跨包集成测试
│   └── conformance/        # 能力清单与等级检查
└── specs/                  # 43 份源规范文档
```

---

## 4. CLI 使用指南

CLI 构建后位于 `apps/cli/dist/index.js`，提供 7 个命令。

### 4.1 通用规则

- **stdout** 仅输出 JSON Response（机器可读）
- **stderr** 输出日志信息（人类可读）
- **退出码**：

| 退出码 | 含义 |
|--------|------|
| 0 | SUCCESS — 命令正常完成 |
| 1 | POLICY_BLOCK — 发布策略阻止 |
| 2 | CONFORMANCE_FAILURE — 符合性检查失败 |
| 3 | EXECUTION_ERROR — 执行过程错误 |
| 4 | INVALID_CONFIGURATION — 配置或参数错误 |
| 5 | INPUT_ERROR — 输入数据错误 |

- **目标 URL 安全**：默认仅允许 `file://` 和 `http(s)://localhost|127.0.0.1`。分析外部 URL 需添加 `--allow-external`。

### 4.2 measure — 采集测量快照

从浏览器采集指定页面的 DOM 测量数据。

```bash
uiq measure <target> [选项]
```

| 参数 | 说明 |
|------|------|
| `<target>` | 目标 URL（`file://` 或 `http://localhost:...`） |
| `--subjects <selector>` | CSS 选择器，限定采集目标元素 |
| `--output <file>` | 将结果写入文件 |
| `--allow-external` | 允许外部 URL |
| `--auth-state <file>` | Playwright storageState JSON 文件，恢复登录态 |

**示例**：

```bash
# 采集 Button 页面
uiq measure "file://$PWD/apps/reference/button.html"

# 采集并保存
uiq measure "file://$PWD/apps/reference/button.html" \
  --output snapshot.json

# 采集需要登录的页面
uiq measure "https://your-app.com/dashboard" \
  --auth-state ./auth.json \
  --allow-external \
  --output snapshot.json
```

### 4.3 analyze — 完整分析

执行完整分析链路：采集 → 指标计算 → 规则评价 → Finding → Diagnostic。

```bash
uiq analyze <target|snapshot.json> [选项]
```

| 参数 | 说明 |
|------|------|
| `<target>` | 浏览器 URL 或快照 JSON 文件路径 |
| `--subjects <selector>` | CSS 选择器 |
| `--tokens <file>` | Token 定义文件 |
| `--theme <id>` | 主题 ID |
| `--contract <file>` | 契约文件 |
| `--config <file>` | 配置文件 |
| `--output <file>` | 将结果写入文件 |
| `--allow-external` | 允许外部 URL |
| `--auth-state <file>` | Playwright storageState JSON 文件，恢复登录态 |

**示例**：

```bash
# 分析对比度不足的页面
uiq analyze \
  "file://$PWD/apps/reference/contrast-fail.html" \
  --allow-external \
  --output analysis.json

# 从已有快照离线分析
uiq analyze snapshot.json --output analysis.json

# 分析需要登录的页面
uiq analyze "https://your-app.com/dashboard" \
  --auth-state ./auth.json \
  --allow-external \
  --output analysis.json
```

### 4.4 evaluate — 离线评价

仅执行 Metric → Rule 评价，不生成 Finding/Diagnostic。

```bash
uiq evaluate <snapshot.json> [--output <file>]
```

### 4.5 conformance — 符合性检查

检查分析产物是否满足指定 Conformance Level。

```bash
uiq conformance <snapshot.json> --level <level>
```

| Level | 说明 |
|-------|------|
| `core` | 核心离线确定性评价 |
| `standard` | 标准含浏览器采集 |
| `browser` | 多浏览器符合性 |
| `full` | 完整等级（含主题、布局、回归） |

### 4.6 regression — 回归比较

比较 Baseline 与当前分析产物的差异。

```bash
uiq regression \
  --baseline baseline.json \
  --current current.json \
  [--output regression.json]
```

### 4.7 snapshot — 采集并保存

采集浏览器目标并保存 MeasurementSnapshot 到文件。

```bash
uiq snapshot <target> --output <file> [选项]
```

| 参数 | 说明 |
|------|------|
| `<target>` | 目标 URL |
| `--output <file>` | 输出文件路径（必选） |
| `--subjects <selector>` | CSS 选择器 |
| `--allow-external` | 允许外部 URL |
| `--auth-state <file>` | Playwright storageState JSON 文件，恢复登录态 |

### 4.8 report — 生成报告

从已有分析产物生成质量报告，不暗中执行分析。

```bash
uiq report <analysis.json> [选项]
```

| 参数 | 说明 |
|------|------|
| `--format <format>` | 输出格式：`json`（默认）、`markdown`、`html` |
| `--output <file>` | 将报告写入文件 |
| `--project-id <id>` | 项目标识 |

**示例**：

```bash
# 生成 Markdown 报告
uiq report analysis.json --format markdown

# 生成 HTML 报告并保存
uiq report analysis.json --format html --output report.html
```

### 4.9 auth-save — 保存登录态

打开有头浏览器，用户手动登录后保存 storageState JSON，供 `--auth-state` 使用。

```bash
uiq auth-save <target> --output <file> [--allow-external]
```

| 参数 | 说明 |
|------|------|
| `<target>` | 目标 URL（登录页地址） |
| `--output <file>` | 输出文件路径（必选） |
| `--allow-external` | 允许外部 URL |

**示例**：

```bash
# 1. 保存登录态
uiq auth-save "https://your-app.com/login" \
  --output auth.json \
  --allow-external

# 2. 使用保存的登录态采集
uiq measure "https://your-app.com/dashboard" \
  --auth-state auth.json \
  --allow-external
```

> **流程**：执行后浏览器窗口自动打开并导航到目标 URL → 用户在浏览器中完成登录 → 回到终端按回车 → 自动保存 cookies + localStorage 到 JSON 文件。
>
> **安全**：保存的文件自动设置 `chmod 600`（仅所有者可读写），保护敏感认证数据。

### 4.10 auth-clean — 清理登录态

删除 auth-state 文件，清理敏感认证数据。

```bash
uiq auth-clean <file>
```

| 参数 | 说明 |
|------|------|
| `<file>` | 要删除的 auth-state 文件路径 |

**示例**：

```bash
# 删除不再需要的登录态文件
uiq auth-clean auth.json
```

### 4.11 install-skill — 安装 Agent Skill

将 UIQ Skill 安装到指定 Agent 的 skills 目录，使 AI Agent 能够调用 UIQ 能力。

```bash
uiq install-skill [--agent <agent>] [--copy]
```

| 参数 | 说明 |
|------|------|
| `--agent <agent>` | 目标 Agent：`qoder`（默认）、`claude`、`codex`、`kiro`、`all` |
| `--copy` | 使用复制模式（默认为符号链接） |

**示例**：

```bash
# 安装到 Qoder（默认，使用符号链接）
uiq install-skill

# 安装到所有已安装的 Agent
uiq install-skill --agent all

# 安装到 Claude
uiq install-skill --agent claude

# 使用复制模式（非链接）
uiq install-skill --copy
```

> **符号链接模式**（默认）：修改 `skills/uiq-ui-quality/` 目录后即时生效，无需重新安装。
> **复制模式**：将 Skill 文件复制到目标目录，适合分发或离线使用。
> **Windows 兼容**：如果符号链接失败（需要管理员权限），自动回退到复制模式。

### 4.12 uninstall-skill — 卸载 Agent Skill

从指定 Agent 的 skills 目录卸载 UIQ Skill。

```bash
uiq uninstall-skill [--agent <agent>]
```

| 参数 | 说明 |
|------|------|
| `--agent <agent>` | 目标 Agent：`qoder`（默认）、`claude`、`codex`、`kiro` |

**示例**：

```bash
# 从 Qoder 卸载
uiq uninstall-skill

# 从 Claude 卸载
uiq uninstall-skill --agent claude
```

---

## 5. Reference 测试页面

`apps/reference/` 目录包含预设的 HTML 测试夹具，用于验证各场景：

| 文件 | 场景 | 预期结果 |
|------|------|---------|
| `button.html` | 标准 Button 组件 | 对比度 PASS |
| `contrast-fail.html` | 灰字白底（#CCC/#FFF） | 对比度 ≈1.6 FAIL |
| `gradient-unknown.html` | 渐变背景 | CONTRAST UNKNOWN |
| `card.html` | Card 组件 | 多元素综合评估 |
| `dialog.html` | Dialog 组件 | Portal 归属测试 |
| `form.html` | 表单组件 | Input/Label 评估 |
| `tokens.html` | Token 绑定（Light） | EXPLICIT/INFERRED 绑定 |
| `tokens-dark.html` | Token 绑定（Dark） | 主题独立快照 |
| `layout.html` | 布局夹具 | Flex/Grid/对齐/溢出 |
| `regression-fix.html` | 回归修复场景 | 前后对比验证 |

使用方式：

```bash
# 直接用 CLI 分析
uiq analyze "file://$PWD/apps/reference/contrast-fail.html" --allow-external

# 或用浏览器打开后通过 localhost 采集
# （需先启动本地 HTTP 服务器）
npx serve apps/reference
uiq analyze "http://localhost:3000/contrast-fail.html"
```

---

## 6. Inspector 应用

Inspector 是基于 React 的交互式分析界面。

### 6.1 开发模式

```bash
cd apps/inspector
pnpm dev
# 访问 http://localhost:5173
```

### 6.2 构建产物

```bash
pnpm build    # 从工程根目录执行
# 产物位于 apps/inspector/dist/
```

### 6.3 功能

- 选中真实 DOM 元素，查看测量事实、指标结果、规则评价
- 浏览 Finding、Diagnostic、Evidence 和原因追踪
- 查看建议（Recommendation）与验证条件（Verification）
- 导入/导出分析产物
- 主题切换（Light/Dark）
- 重新采集与验证工作流

---

## 7. Playground 应用

Playground 是调试应用，用于开发和调试指标/规则。

```bash
cd apps/playground
pnpm dev
# 访问 http://localhost:5173（默认 Vite 端口）
```

---

## 8. 测试命令

| 命令 | 范围 | 说明 |
|------|------|------|
| `pnpm run ci` | 完整流水线 | format:check → lint → build → typecheck → test → playwright |
| `pnpm test` | 全部 Vitest | 96 文件，1237 项测试 |
| `pnpm test:unit` | 单元测试 | `tests/unit/` 下按包分目录 |
| `pnpm test:architecture` | 架构测试 | 包白名单、无环、公共 exports、平台隔离 |
| `pnpm test:golden` | Golden 测试 | 独立数学期望（颜色、布局草案） |
| `pnpm test:schema` | Schema 测试 | 类型/JSON 边界、引用与版本 |
| `pnpm test:contract` | 契约测试 | Schema + Contract checker + 能力目录 |
| `pnpm test:baseline` | Baseline 测试 | Regression Baseline 单元与 Schema |
| `pnpm test:integration` | 集成测试 | 跨包数据链（含 reporting-flow） |
| `pnpm test:e2e` | 端到端测试 | 先 build 再执行 CLI E2E |
| `pnpm test:browser` | 浏览器测试 | 先 build 再执行 Playwright |
| `pnpm exec playwright test` | Playwright | 三浏览器 × Light/Dark，126 项 |
| `pnpm conformance` | 符合性 harness | 工程级 Conformance 测试 |
| `pnpm regression` | 回归 harness | 工程级 Regression 测试 |

---

## 9. CI/CD 集成

### 9.1 GitHub Actions

工程已配置 `.github/workflows/ci.yml`，在 push 和 pull_request 时自动执行：

1. 冻结安装（`pnpm install --frozen-lockfile`）
2. 安装三浏览器（Chromium、Firefox、WebKit）
3. 执行完整 CI 流水线（`pnpm run ci`）
4. 上传 Playwright 报告为 Artifact（保留 14 天）

### 9.2 在其他 CI 中使用

```yaml
# 示例：GitHub Actions step
- uses: pnpm/action-setup@v4
  with:
    version: 10.28.2
- uses: actions/setup-node@v4
  with:
    node-version: 24.13.0
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm exec playwright install --with-deps chromium firefox webkit
- run: pnpm run ci
```

### 9.3 CLI 在 CI 中使用

```bash
# 构建后执行 CLI 分析
pnpm build
uiq analyze "http://localhost:3000" --output analysis.json

# 检查符合性
uiq conformance analysis.json --level standard

# 生成报告
uiq report analysis.json --format markdown --output report.md
```

---

## 10. Agent Skill 集成

`skills/uiq-ui-quality/` 提供 Agent Skill 入口，将 UIQ 能力暴露给 AI Agent。

### 10.1 安装 Skill

```bash
# 安装到 Qoder（默认）
uiq install-skill

# 安装到其他 Agent
uiq install-skill --agent claude
uiq install-skill --agent codex
uiq install-skill --agent kiro
```

安装后重启 Agent 即可使用。

### 10.2 工作流列表

| 工作流 | 说明 |
|--------|------|
| `inspect` | 交互式检查目标页面 |
| `analyze` | 完整分析链路 |
| `accessibility` | 无障碍专项（对比度等） |
| `color` | 颜色质量分析 |
| `typography` | 排版质量分析 |
| `design-system` | 设计系统一致性 |
| `theme` | 主题验证 |
| `regression` | 回归比较 |
| `report` | 生成质量报告 |
| `verify` | 修复后重新验证 |
| `auth` | 处理登录认证（Playwright MCP / CLI） |

### 10.3 调用方式

Skill 通过进程调用 CLI，解析 JSON 输出。不拼 shell、不从终端文案判断质量。

```bash
# Skill 内部调用示例（参数数组启动）
uiq analyze <target> --output <file>
# 解析 stdout JSON，提取 findings/diagnostics/recommendations
```

---

## 11. 典型工作流

### 11.1 分析单个页面

```bash
# 1. 构建
pnpm build

# 2. 分析 Reference 页面
uiq analyze \
  "file://$PWD/apps/reference/contrast-fail.html" \
  --allow-external \
  --output analysis.json

# 3. 查看报告
uiq report analysis.json --format markdown
```

### 11.2 快照 → 离线分析 → 报告

```bash
# 1. 采集快照
uiq snapshot \
  "file://$PWD/apps/reference/button.html" \
  --output snapshot.json

# 2. 离线分析（不需要浏览器）
uiq analyze snapshot.json --output analysis.json

# 3. 生成 HTML 报告
uiq report analysis.json --format html --output report.html
```

### 11.3 回归检测

```bash
# 1. 建立 Baseline
uiq analyze \
  "file://$PWD/apps/reference/button.html" \
  --output baseline.json

# 2. 修改代码后重新分析
uiq analyze \
  "file://$PWD/apps/reference/button.html" \
  --output current.json

# 3. 比较差异
uiq regression \
  --baseline baseline.json \
  --current current.json \
  --output regression.json
```

### 11.4 交互式检查（Inspector）

```bash
# 1. 启动 Inspector
cd apps/inspector && pnpm dev

# 2. 在浏览器中打开 http://localhost:5173
# 3. 输入目标 URL，选择元素，查看分析结果
# 4. 导出分析产物或执行验证
```

---

## 12. 常见问题

### Q: `pnpm install` 失败

确认 Node.js 版本为 24.x、pnpm 版本为 10.x。如使用代理，检查 `.npmrc` 配置。

### Q: Playwright 浏览器启动失败

```bash
# 重新安装浏览器
pnpm exec playwright install --with-deps chromium firefox webkit
```

macOS 上首次运行可能需要在"系统设置 → 隐私与安全"中允许。

### Q: CLI 报 `Cannot find module` 错误

确保已执行 `pnpm build`。CLI 从 `dist/` 目录运行，需要先构建。

### Q: 分析外部 URL 报权限错误

添加 `--allow-external` 标志：

```bash
uiq analyze "https://example.com" --allow-external
```

### Q: 目标页面需要登录

使用 `auth-save` 命令保存登录态，然后在采集/分析时传入 `--auth-state`：

```bash
# 1. 保存登录态（打开浏览器，手动登录，按回车保存）
uiq auth-save "https://your-app.com/login" \
  --output auth.json \
  --allow-external

# 2. 采集时传入 auth-state
uiq measure "https://your-app.com/dashboard" \
  --auth-state auth.json \
  --allow-external

uiq analyze "https://your-app.com/dashboard" \
  --auth-state auth.json \
  --allow-external \
  --output analysis.json
```

> **注意**：`--auth-state` 仅对浏览器采集命令（`measure`、`analyze`、`snapshot`）有效。离线命令（`evaluate`、`conformance`、`regression`、`report`）操作快照文件，不需要登录态。

### Q: 测试数量与文档不一致

测试数量随开发进展增长。以 `pnpm test` 实际输出为准。文档附录 E 记录的是特定时间点的快照数据。

### Q: Inspector 开发服务器端口被占用

```bash
# 指定端口
cd apps/inspector && pnpm dev --port 5174
```

---

## 13. 已知限制

| 限制 | 说明 | 预期解决阶段 |
|------|------|-------------|
| 布局九指标/十一规则 | 采集配置已就位，完整业务实现待补齐 | P8 |
| Token 绑定完整采集 | 三类绑定投影框架存在，完整验证待补齐 | P5 |
| 完整 CLI 八命令 | 当前 7 命令，`inspect` 属 Inspector 交互应用 | P10 |
| Firefox/WebKit 完整矩阵 | 测试已接通，完整验收归 P12 | P12 |
| APCA / CIEDE2000 | 算法未冻结，不注册为可用 | 暂不实现 |
| UI 总分 | 架构明确排除，V1.0 不提供整体评分 | 不在 V1.0 范围 |

---

## 附录：命令速查表

```bash
# ── 安装 ──
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm build
cd apps/cli && pnpm link --global    # 全局链接 CLI（可选）

# ── 测试 ──
pnpm run ci                          # 完整流水线
pnpm test                            # Vitest 全量
pnpm exec playwright test            # Playwright 三浏览器

# ── CLI 命令 ──
uiq measure <target> [--output <file>] [--auth-state <file>]
uiq analyze <target|snapshot.json> [--output <file>] [--auth-state <file>]
uiq evaluate <snapshot.json>
uiq conformance <snapshot.json> --level <level>
uiq regression --baseline <b.json> --current <c.json>
uiq snapshot <target> --output <file> [--auth-state <file>]
uiq report <analysis.json> [--format json|markdown|html]
uiq auth-save <target> --output <file>      # 保存登录态（自动 chmod 600）
uiq auth-clean <file>                       # 清理登录态文件
uiq install-skill [--agent <agent|all>]     # 安装 Skill 到 Agent
uiq uninstall-skill [--agent <agent>]       # 卸载 Skill

# ── 应用 ──
cd apps/inspector && pnpm dev        # Inspector UI（http://localhost:5173）
cd apps/playground && pnpm dev       # Playground（http://localhost:5173）
```
