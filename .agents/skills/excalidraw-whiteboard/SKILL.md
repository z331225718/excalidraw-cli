---
name: excalidraw-whiteboard
version: 2.0.0
description: >
  图表渲染与转换。支持 DSL JSON、SVG、Mermaid 等格式输入，输出 Excalidraw 可编辑文件(.excalidraw) 和 PNG 图片。
  DSL 是 AI agent 原生格式：结构化描述图表布局（Flex/Dagre/绝对定位），引擎自动计算坐标。
  基于 excalidraw-cli（开源替代 @larksuite/whiteboard-cli），本地运行，无需云服务。
metadata:
  requires:
    bins: ["excalidraw-cli"]
  cliHelp: "excalidraw-cli --help"
---

> [!IMPORTANT]
> - 运行 `excalidraw-cli --version`，确认可用，无需询问用户。
> - excalidraw-cli 是本项目的 CLI 工具，用于 SVG → .excalidraw / PNG 的转换。

---

## 快速决策

**excalidraw-cli 是本地离线工具**，不依赖飞书云服务。产物为 .excalidraw 文件（可在 excalidraw.com 编辑）和 PNG 图片。

| 用户需求                                    | 行动                                                                                            |
|-----------------------------------------|-----------------------------------------------------------------------------------------------|
| 将 SVG 转为可编辑的 Excalidraw 文件               | [`excalidraw-cli convert -i input.svg -o output.excalidraw`](references/excalidraw-whiteboard-update.md) |
| 将 .excalidraw 渲染为 PNG 图片                 | [`excalidraw-cli render -i input.excalidraw -o output.png`](references/excalidraw-whiteboard-query.md) |
| SVG 一步到位生成 PNG 图片                       | [`excalidraw-cli svg2png -i input.svg -o output.png`](references/excalidraw-whiteboard-query.md) |
| 用户**已提供** Mermaid 代码                     | mmdc 渲染为 SVG → excalidraw-cli convert → .excalidraw                                        |
| 用 DSL JSON 描述图表（架构/流程/Dagre拓扑）          | [`excalidraw-cli dsl -i diagram.json -o diagram.excalidraw -f png`](references/excalidraw-whiteboard-update.md) |
| 新建/创作复杂图表（架构/流程/组织等）                    | → **[§ 创作 Workflow](references/excalidraw-whiteboard-workflow.md#创作-workflow)**                     |
| 修改已有 .excalidraw 文件                       | 在 https://excalidraw.com 打开编辑，或重新生成 SVG 后 convert                                   |

## Shortcuts

| Command | 说明 |
|---|---|
| `excalidraw-cli convert -i <svg> -o <file>.excalidraw` | SVG → Excalidraw JSON（可在 excalidraw.com 编辑） |
| `excalidraw-cli render -i <file>.excalidraw -o <file>.png` | .excalidraw → PNG 渲染 |
| `excalidraw-cli svg2png -i <svg> -o <file>.png` | SVG → PNG 一步到位 |
| `excalidraw-cli dsl -i <json> -o <file>.excalidraw -f png` | DSL JSON → .excalidraw + PNG |

### 选项

| Flag | 说明 | 默认值 |
|------|------|--------|
| `-i, --input` | 输入文件路径 | (必填) |
| `-o, --output` | 输出文件路径 | (必填) |
| `-w, --width` | PNG 最大宽度 | 1600 |
| `-b, --background` | 背景色 (hex) | #ffffff |

### 支持的 SVG 元素

| SVG 元素 | Excalidraw 元素 |
|----------|----------------|
| `<rect>` | rectangle |
| `<rect rx="..">` | rectangle (圆角) |
| `<circle>` | ellipse |
| `<ellipse>` | ellipse |
| `<line>` | line / arrow (有 marker-end 时) |
| `<polyline>` | line (多点) |
| `<text>` | text |
| `<g transform="translate()">` | 组合位移变换 |

---

## 不在本 skill 范围
- 飞书云文档内容编辑 → lark-doc [lark-doc](../lark-doc/SKILL.md)
- 在飞书文档中创建画板 → 飞书 CLI 的 lark-doc 负责
- 表格 / Base 操作 → [lark-sheets](../lark-sheets/SKILL.md) / [lark-base](../lark-base/SKILL.md)
- 飞书云服务上传 → excalidraw-cli 是本地工具，不连接飞书 API
