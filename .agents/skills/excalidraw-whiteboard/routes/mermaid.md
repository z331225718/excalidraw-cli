# Mermaid 路径

适用于：思维导图、时序图、类图、饼图、甘特图。

> excalidraw-cli 不直接支持 Mermaid 输入，需要先通过 mermaid-cli (`mmdc`) 将 Mermaid 渲染为 SVG，再用 excalidraw-cli 转换为 .excalidraw。

## Workflow

```
Step 1: 读取知识
  - 读 scenes/mermaid.md — Mermaid 语法和使用方式

Step 2: 生成 Mermaid
  - 按 mermaid.md 的语法编写 .mmd 文件
  - 只输出纯 Mermaid 语法文本

Step 3: Mermaid → SVG → Excalidraw

  1. 创建产物目录 ./diagrams/YYYY-MM-DDTHHMMSS/
  2. 保存 Mermaid 源码为 diagram.mmd
  3. 使用 mmdc 将 Mermaid 渲染为 SVG：
       npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg
  4. 预览 PNG（仅用于验证，非最终产物）：
       excalidraw-cli svg2png -i diagram.svg -o diagram.png
  5. 审查 PNG，有问题修改 Mermaid 后重新渲染（最多 2 轮）
  6. 生成可编辑的 Excalidraw 文件（最终交付物）：
       excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
  7. 交付：向用户报告 .excalidraw 文件路径，告知可在 https://excalidraw.com 打开编辑
```

> **注意**：如果环境没有安装 `@mermaid-js/mermaid-cli`，可提示用户执行 `npm install -g @mermaid-js/mermaid-cli`，或使用在线 Mermaid Live Editor 导出 SVG 后再用 excalidraw-cli 处理。
