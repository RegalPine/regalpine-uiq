# UIQ — UI Design Quantification

UIQ 是一套 **UI 设计质量量化与自动化评估工具链**，通过形式化指标、规则引擎和浏览器采集，将设计质量从主观判断转化为可测量、可回归、可报告的数据。

## 特性

- **形式化指标体系** — 对比度、间距、对齐、一致性等 13+ 包模块化指标
- **规则评价引擎** — 基于 Schema 的可配置规则，支持设计系统绑定
- **浏览器采集** — Playwright 驱动的三浏览器（Chromium/Firefox/WebKit）Light/Dark 矩阵验证
- **回归比较** — Golden 基线快照与结构化 diff
- **符合性检查** — Design Token / Theme 一致性验证
- **报告生成** — JSON / Markdown 格式的结构化评估报告
- **CLI & CI 集成** — 命令行工具 + GitHub Actions 流水线
- **Agent Skill** — 10 个工作流供 AI Agent 调用

## 工程结构

```
UIQ/
├── packages/           # 13 个核心库
│   ├── core/           # 公共类型与契约
│   ├── color/          # 颜色数学（WCAG 对比度等）
│   ├── geometry/       # 几何计算
│   ├── measurement/    # 测量抽象
│   ├── metrics/        # 指标注册与执行引擎
│   ├── rules/          # 规则评价引擎
│   ├── diagnostic/     # 诊断与 Finding
│   ├── browser/        # 浏览器采集适配器
│   ├── tokens/         # Design Token 解析
│   ├── theme/          # 主题处理
│   ├── conformance/    # 符合性检查
│   ├── regression/     # 回归比较
│   └── reporting/      # 报告生成
├── apps/
│   ├── cli/            # 命令行工具
│   ├── inspector/      # 分析可视化应用
│   ├── playground/     # 调试应用
│   └── reference/      # 测试夹具页面
├── tests/              # 单元/集成/E2E/Golden/架构测试
├── specs/              # 43 份源规范文档
├── skills/             # Agent Skill 定义
└── docs/               # 架构文档与使用手册
```

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | `>=24 <25` |
| pnpm | `>=10 <11` |
| 操作系统 | macOS / Linux |

## 快速开始

```bash
# 安装依赖
pnpm install --frozen-lockfile

# 构建全部
pnpm build

# 全局安装 CLI（可选，之后可用 uiq 命令）
cd apps/cli && pnpm link --global && cd ../..

# 运行全量测试
pnpm test

# CI 流水线（format + lint + build + typecheck + test + playwright）
pnpm run ci
```

## CLI 使用

```bash
# 查看帮助
uiq --help

# 分析页面
uiq analyze "file://$PWD/apps/reference/contrast-fail.html" --allow-external

# 生成报告
uiq report analysis.json --format markdown

# 符合性检查
uiq conformance snapshot.json

# 回归比较
uiq regression baseline.json current.json
```

> 如未全局安装 CLI，请将 `uiq` 替换为 `node apps/cli/dist/index.js`。

详细使用说明参见 [安装与使用手册](docs/UIQ-INSTALL-USAGE-GUIDE.md)。

## 测试

```bash
pnpm test                    # 全量 Vitest（96 文件 1237 项）
pnpm test:unit               # 单元测试
pnpm test:integration        # 集成测试
pnpm test:e2e                # 端到端测试
pnpm test:browser            # Playwright 三浏览器矩阵（126 项）
pnpm conformance             # 符合性测试
pnpm regression              # 回归测试
```

## 开发

```bash
pnpm format                  # 格式化代码
pnpm lint                    # ESLint 检查
pnpm typecheck               # 类型检查
pnpm build                   # 构建全部
```

## 文档

- [架构设计](docs/architecture/UIQ-ARCH-01%20V1.0%20完整工程架构设计.md)
- [分阶段实现计划](docs/architecture/UIQ-PLAN-01%20V1.0%20分阶段架构实现计划.md)
- [安装与使用手册](docs/UIQ-INSTALL-USAGE-GUIDE.md)
- [规范文档](specs/) — 43 份详细规范

## 许可证

[MIT](LICENSE)
