# Beautiful Excalidraw（Excalidraw 配色库）

**一个包含 35 种精选配色风格的库，用来生成漂亮、可二次编辑的 Excalidraw 图表。**

这是一个给 AI agent 用的 **skill**（适用于 Claude Code 等会读取 `SKILL.md` 的 agent）。它不是一个自动排版的图表工具：**布局由你的 agent 自己来排**，而这些模板只提供有品味的**配色与气质**，外加 excalidraw-cli 渲染引擎的硬性规则。产出是一份真正可在 https://excalidraw.com 继续编辑的 `.excalidraw` 文件 + PNG 预览图。

> 这套规则来自对 excalidraw-cli SVG 渲染引擎「能做什么、不能做什么」的实测沉淀（只支持原生图形、不支持渐变/滤镜等），全部写在 [`RULES.md`](RULES.md) 里。

你也可以直接选一个风格，让 agent "按 X 风格画出来"——不用自己懂配色，模板已经把品味做好了。

---

## 风格目录（35 种）

| 级别 | 数量 | 气质 |
|------|------|------|
| **克制 (Restrained)** | 9 | 单色、内敛、编辑气质——适合严肃安静的图 |
| **平衡 (Balanced)** | 14 | 干净底上一点自信的强调色——万能，大部分工作都在这里 |
| **大胆 (Bold)** | 12 | 张扬、极繁、活泼——高能量、抓眼球 |

详见 **[`CATALOG.md`](CATALOG.md)**，含每种风格的色板签名。

---

## 怎么用 — 让你的 agent 做这些

你可以对 agent 说类似的话：

> - "用 **Riso Brut** 风格画一张图，讲清楚我们的新人上手流程。"
> - "把这篇文档变成一张图表，**极简、forest green** 的感觉。"
> - "把系统架构画出来，**糖果色、活泼** 一点。"
> - "我不在乎配色——你帮我挑一个适合组织架构图的。"

你的 agent 会：先问清楚这张图是干什么的、你想要什么气质，从[风格目录](CATALOG.md)里挑一个合适的风格，用原生图形把图画出来，渲染后自我检查（溢出、留白、重叠等问题），然后把 **.excalidraw 文件和 PNG 预览图**一起发给你。你随时可以换一个风格。

### 给你的 agent 的检查清单

1. **搞清楚要画什么** — 目标不明确时问一句话。
2. **问清楚气质** — 想要什么视觉风格？如果无所谓，agent 自己选。
3. **从 [`CATALOG.md`](CATALOG.md) 挑一个风格**。
4. **读 [`RULES.md`](RULES.md)** 和选中风格的 `templates/<slug>/design.md`。
5. **写 SVG、渲染 PNG、自我检查修正**，然后 convert 为 `.excalidraw`。
6. **交付** .excalidraw 文件 + PNG 图。

### 核心文件

- **`RULES.md`** — Excalidraw SVG 的硬性限制（只用原生图形、不用渐变、不用透明度等），以及 `excalidraw-cli` 的具体命令。
- **`CATALOG.md`** — 每种风格的气质和色板签名。从这里选。
- **`templates/<slug>/design.md`** — 每种风格一页，完整的配色和用法说明。

## 前置条件

- **Node.js**（≥ 20）
- **excalidraw-cli**：`cd <项目>/excalidraw-cli && npm install && npm link`
- **完全离线，无需任何云账号。**

## 安装为 skill（给你的 agent 用）

把 `beautiful-excalidraw` 目录复制到 agent 的 skills 路径下并注册即可。

基于 `excalidraw-cli` 构建——开源的 SVG → Excalidraw 转换工具。
