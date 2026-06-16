# excalidraw-cli

CLI 工具：SVG 转 [Excalidraw](https://excalidraw.com) 格式 / DSL JSON 编译 / PNG 渲染。
飞书 `@larksuite/whiteboard-cli` 的开源替代，无需飞书账号。

## 功能

- **SVG → .excalidraw** — SVG 图表转为可编辑的 Excalidraw 文件
- **DSL → .excalidraw** — 结构化 DSL JSON（Flex + Dagre 自动布局）编译为 Excalidraw
- **SVG → PNG** — sharp 直接渲染 SVG（无需浏览器）
- **.excalidraw → PNG** — Excalidraw 文件渲染为 PNG 图片
- **零原生依赖** — sharp 有预编译二进制，Windows/macOS/Linux 全平台即装即用
- **AI 友好** — 四命令 CLI，DSL 给 agent 自动生成，SVG 给人工精细设计

## 安装

```bash
git clone https://github.com/z331225718/excalidraw-cli.git
cd excalidraw-cli
npm install
npm link        # 可选：注册为全局命令
```

## 快速开始

```bash
# SVG → 可编辑的 Excalidraw 文件
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw

# DSL JSON → Excalidraw + PNG（AI agent 推荐）
excalidraw-cli dsl -i diagram.json -o diagram.excalidraw -f png

# SVG → PNG（一步到位）
excalidraw-cli svg2png -i diagram.svg -o diagram.png

# .excalidraw → PNG
excalidraw-cli render -i diagram.excalidraw -o diagram.png
```

`.excalidraw` 文件拖到 https://excalidraw.com 即可交互式编辑。

## 命令

### `convert` — SVG → .excalidraw

```
excalidraw-cli convert -i <input.svg> -o <output.excalidraw>
```

解析 SVG 元素并映射为 Excalidraw 元素模型。输出为标准 `.excalidraw` JSON 文件。

### `dsl` — DSL JSON → .excalidraw

```
excalidraw-cli dsl -i <input.json> -o <output.excalidraw> -f png
```

**AI agent 原生格式**。用结构化 JSON 描述图表布局，引擎自动算坐标。支持：

- **Flex 布局** — `horizontal` / `vertical`，支持 gap、padding、alignItems、fill-container 自动等分
- **Dagre 拓扑布局** — 图论自动排版，edges 自动路由为箭头 + 标签
- **绝对定位** — `layout: "none"` + x/y 坐标，自由摆放
- **Connector 连线** — from/to + anchor 路由（top/right/bottom/left）

完整 DSL Schema 见 [elements/schema.md](./.agents/skills/excalidraw-whiteboard/elements/schema.md)。

示例 DSL：
```json
{
  "version": 2,
  "nodes": [
    { "type": "frame", "layout": "vertical", "gap": 24, "padding": 32,
      "width": 800, "height": "fit-content", "children": [
        { "type": "text", "text": "架构图", "fontSize": 24, "width": "fill-container", "height": "fit-content" },
        { "type": "frame", "layout": "horizontal", "gap": 16, "alignItems": "stretch",
          "width": "fill-container", "height": "fit-content", "children": [
            { "type": "rect", "text": "输入", "fillColor": "#E8F5E9", "borderColor": "#43A047",
              "width": "fill-container", "height": "fit-content" },
            { "type": "rect", "text": "处理", "fillColor": "#E3F2FD", "borderColor": "#1E88E5",
              "width": "fill-container", "height": "fit-content" },
            { "type": "rect", "text": "输出", "fillColor": "#F3E5F5", "borderColor": "#8E24AA",
              "width": "fill-container", "height": "fit-content" }
          ]
        }
      ]
    }
  ]
}
```

### `svg2png` — SVG → PNG

```
excalidraw-cli svg2png -i <input.svg> -o <output.png>
```

使用 [sharp](https://sharp.pixelplumbing.com/) 直接渲染 SVG 为 PNG。自动缩放到最大宽度。

### `render` — .excalidraw → PNG

```
excalidraw-cli render -i <input.excalidraw> -o <output.png>
```

渲染 `.excalidraw` 文件为 PNG。若文件由 `convert` 或 `dsl` 生成且包含嵌入的 `_svgSource`，渲染效果精确还原。否则生成说明文件指引用户在 excalidraw.com 导出。

## 选项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input` | 输入文件路径 | 必填 |
| `-o, --output` | 输出文件路径 | 必填 |
| `-w, --width` | PNG 最大宽度 | `1600` |
| `-b, --background` | 背景色（十六进制） | `#ffffff` |
| `-f, --format` | convert/dsl 的输出格式：`json` 或 `png` | `json` |

## 支持的 SVG 元素

| SVG 元素 | Excalidraw 元素 | 备注 |
|----------|----------------|------|
| `<rect>` | `rectangle` | 支持 `rx` 圆角 |
| `<circle>` | `ellipse` | cx/cy/r 映射为椭圆边框 |
| `<ellipse>` | `ellipse` | 完整支持 |
| `<line>` | `line` 或 `arrow` | `marker-end` → 箭头 |
| `<polyline>` | `line`（多点） | `marker-end` → 箭头 |
| `<text>` | `text` | 字号、颜色、text-anchor 对齐 |
| `<g transform="translate()">` | 组合位移 | 嵌套的 g 累计变换 |

### 尚未支持

| SVG 元素 | 状态 |
|----------|------|
| `<path>` | 计划中 |
| `<polygon>` | 计划中 |
| `<use>` / `<symbol>` | 计划中 |
| `<tspan>` | 计划中 |
| `<image>` | 计划中 |

## 渲染管线

```
               ┌──────────┐
  .svg ───────▶│ convert  │──────▶ .excalidraw
               └────┬─────┘              │
                    │                    │ render
                    ▼                    ▼
               ┌──────────┐        ┌──────────┐
               │ svg2png  │        │  render  │
               └────┬─────┘        └────┬─────┘
                    │                    │
                    ▼                    ▼
                  .png                 .png

               ┌──────────┐
  .json ──────▶│   dsl    │──────▶ .excalidraw  (+ .png 加 -f png)
               └──────────┘
```

## Mermaid / PlantUML 桥接

excalidraw-cli 只接受 SVG 或 DSL JSON 输入。对 Mermaid 或 PlantUML 图，先转为 SVG：

```bash
# Mermaid → SVG（需要 @mermaid-js/mermaid-cli）
npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg

# PlantUML → SVG（需要 plantuml.jar）
java -jar plantuml.jar -tsvg diagram.puml

# 然后转为 Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
excalidraw-cli svg2png -i diagram.svg -o diagram.png
```

## AI Agent Skills

本项目包含两个 [Skills](./.agents/skills/)，供 AI agent（Claude、Gemini 等）自动生成图表：

### excalidraw-whiteboard

图表生成管线。AI agent 写 DSL JSON（或 SVG）描述图表，引擎自动算坐标、编译为 .excalidraw + PNG。

- **DSL 路径**（默认）— Flex + Dagre + 绝对定位，结构化描述
- **SVG 路径** — 手工 SVG 设计
- **Mermaid 路径** — 思维导图、时序图、类图、甘特图

详见 [SKILL.md](./.agents/skills/excalidraw-whiteboard/SKILL.md)

### beautiful-excalidraw

35 种精选配色风格库。从克制单色到张扬极繁，给图表套上有品味的配色和气质。包含场景指南（架构图、泳道图、对比图、鱼骨图等 15 种）。

详见 [SKILL.md](./.agents/skills/beautiful-excalidraw/SKILL.md)

## 依赖

| 包 | 用途 |
|----|------|
| `svg-parser` | SVG XML 解析遍历 |
| `sharp` | 高性能 PNG 渲染 |
| `dagre` | 图论自动布局（DSL Dagre 模式） |
| `@excalidraw/utils` | Excalidraw 类型定义 |

## 与 @larksuite/whiteboard-cli 对比

| 功能 | excalidraw-cli | whiteboard-cli |
|------|---------------|----------------|
| SVG → PNG | ✅ (sharp) | ✅ |
| SVG → 可编辑 | ✅ (.excalidraw) | ✅ (OpenAPI) |
| **DSL → 可编辑** | **✅ (Flex + Dagre + 绝对定位)** | ✅ (Yoga + script) |
| Mermaid 输入 | mmdc → SVG 桥接 | ✅ 原生 |
| PlantUML 输入 | jar → SVG 桥接 | ✅ 原生 |
| 云上传 | ❌ (纯本地) | ✅ (飞书) |
| 账号依赖 | 无 | 飞书/Lark 账号 |
| 原生依赖 | 无 (sharp 预编译) | — |
| AI agent skill | ✅ (2 个) | ✅ (1 个) |
| 开源协议 | MIT | — |

## License

MIT
