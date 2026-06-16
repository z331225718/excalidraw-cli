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
| 其他图表               | `Claude` / `Gemini` / `GPT` / `GLM` | [`../routes/svg.md`](../routes/svg.md)         |
| 其他图表               | `Doubao` / `Seed` / `Other`         | [`../routes/dsl.md`](../routes/dsl.md)         |

> **⚠️ SVG 路径失败回退**：走 `routes/svg.md` 时，碰到以下情况之一 → **丢弃当前 SVG，改读 `routes/dsl.md` 从零重画，不要逐行修补**：
> - 渲染命令直接报错（语法级崩溃）
> - 两轮改写仍无法消除视觉问题
> - 目测 PNG 视觉严重错乱（文字大面积溢出、元素重叠压住关键信息、布局整体崩溃）

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
# SVG → Excalidraw（最终交付物）
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw

# SVG → PNG（预览验证）
excalidraw-cli svg2png -i diagram.svg -o diagram.png

# .excalidraw → PNG（从可编辑文件渲染）
excalidraw-cli render -i diagram.excalidraw -o diagram.png
```

### Mermaid 路径额外步骤

```bash
# Mermaid → SVG
npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg

# SVG → Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
```
