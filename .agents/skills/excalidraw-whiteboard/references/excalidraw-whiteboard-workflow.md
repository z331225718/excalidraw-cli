# 图表创作/修改工作流

## 创作 Workflow

> 此 workflow 用于**独立创作一个图表**，最终产出为 .excalidraw 文件（可在 https://excalidraw.com 打开编辑）和 PNG 预览图。

**Step 1：确定产物路径**

产物目录：`./diagrams/YYYY-MM-DDTHHMMSS/`（本地时间，不含冒号和时区后缀）。如用户指定路径，以用户为准。

**Step 2：渲染 & 写入**

→ 进入 **[§ 渲染 & 导出](#渲染--导出)** 章节，按流程完成后直接返回结果给用户。

---

## 修改 Workflow

**Step 1：确认现有文件**

用户可能提供：
- `.excalidraw` 文件 → 在 https://excalidraw.com 打开编辑
- SVG 文件 → 修改后重新 `excalidraw-cli convert`
- 无文件，只有需求 → 走 [创作 Workflow](#创作-workflow)

**Step 2：判断修改策略**

```
用户需求
  ├─ 简单文字/颜色改动
  │   → 在 excalidraw.com 打开 .excalidraw 直接编辑
  ├─ 结构调整/重绘
  │   → 重新生成 SVG → excalidraw-cli convert
  └─ 用户有明确要求 → 以用户要求优先
```

---

## 渲染 & 导出

### 渲染路由

**先自报身份**：按训练来源，你属于哪一家？`Claude` / `Gemini` / `GPT` / `GLM` / `Doubao 或 Seed` / `Other`。身份决定 SVG / DSL 分流（不同家族对这两种表达语言的能力不均衡），不要跳过这一步。

**然后按图表类型 × 身份选路径**，读对应文件按其完整 workflow 执行（含读 scene 指南、生成内容、渲染审查、交付）：

| 图表类型               | 身份                                  | 路径                                             |
|--------------------|-------------------------------------|------------------------------------------------|
| 思维导图、时序图、类图、饼图、甘特图 | 任何身份                                | [`../routes/mermaid.md`](../routes/mermaid.md) |
| **结构型图表（默认）** | **任何身份（推荐 DSL）**                  | **[`../routes/dsl.md`](../routes/dsl.md)**     |
| 装饰型/自由布局        | `Claude` / `Gemini` / `GPT` / `GLM` | [`../routes/svg.md`](../routes/svg.md)         |

> **⚠️ 回退规则**：
> - 走 DSL 路径时，布局异常（2 轮仍重叠/截断）→ 改走 SVG 路径手工微调
> - 走 SVG 路径时，渲染崩溃或视觉严重错乱 → 改走 DSL 路径从零重画

### 产物规范

产物目录：`./diagrams/YYYY-MM-DDTHHMMSS/`（本地时间，不含冒号和时区后缀）。如用户指定路径，以用户为准。

目录内固定文件名：

```
diagram.svg           ← SVG 源码（SVG/DSL 路径）
diagram.mmd           ← Mermaid 源码（Mermaid 路径）
diagram.excalidraw    ← Excalidraw 可编辑文件（最终交付物，可在 excalidraw.com 打开）
diagram.png           ← PNG 预览图
```

### 导出命令

```bash
# DSL → Excalidraw + PNG（推荐，结构化描述，引擎自动布局）
excalidraw-cli dsl -i diagram.json -o diagram.excalidraw -f png

# SVG → Excalidraw（手工 SVG 路径）
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw

# SVG → PNG（预览验证）
excalidraw-cli svg2png -i diagram.svg -o diagram.png

# .excalidraw → PNG
excalidraw-cli render -i diagram.excalidraw -o diagram.png
```

### Mermaid 路径额外步骤

```bash
# Mermaid → SVG
npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg

# SVG → Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
```
