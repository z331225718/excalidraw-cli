# 生成/更新 Excalidraw 文件

> excalidraw-cli 是本地工具。支持从 SVG 生成 .excalidraw 文件，也支持从 .excalidraw 渲染为 PNG。

## 输入格式

excalidraw-cli 支持以下输入：

| 输入格式 | 扩展名 | 命令 | 说明 |
|----------|--------|------|------|
| SVG | `.svg` | `convert` / `svg2png` | 主要输入格式 |
| Excalidraw | `.excalidraw` | `render` | 渲染为 PNG |

### 从 Mermaid 生成

excalidraw-cli 不直接支持 Mermaid。需先用 mermaid-cli 转换为 SVG：

```bash
# 1. Mermaid → SVG
npx -y @mermaid-js/mermaid-cli mmdc -i diagram.mmd -o diagram.svg

# 2. SVG → Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
```

### 从 PlantUML 生成

同样需要先转换为 SVG：

```bash
# 1. PlantUML → SVG（使用 plantuml CLI 或在线服务）
java -jar plantuml.jar -tsvg diagram.puml

# 2. SVG → Excalidraw
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
```

## 命令参考

### convert：SVG → .excalidraw

```bash
excalidraw-cli convert -i <input.svg> -o <output.excalidraw>
```

将 SVG 转换为 Excalidraw JSON 格式，可在 https://excalidraw.com 打开编辑。

### render：.excalidraw → PNG

```bash
excalidraw-cli render -i <input.excalidraw> -o <output.png>
```

将 .excalidraw 文件渲染为 PNG 图片。

### svg2png：SVG → PNG（一步到位）

```bash
excalidraw-cli svg2png -i <input.svg> -o <output.png>
```

直接从 SVG 渲染为 PNG，跳过中间 .excalidraw 文件。

## 常用选项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-i, --input` | 输入文件 | 必填 |
| `-o, --output` | 输出文件 | 必填 |
| `-w, --width` | PNG 最大宽度 | 1600 |
| `-b, --background` | 背景色 (hex) | #ffffff |

## 完整示例

```bash
# 场景 1：有一个 SVG 架构图，想导出为可编辑文件 + 预览图
excalidraw-cli convert -i architecture.svg -o architecture.excalidraw
excalidraw-cli render -i architecture.excalidraw -o architecture.png

# 场景 2：有一个 Mermaid 流程图，想一步到位得到 PNG
cat > flow.mmd << 'EOF'
graph TD
    A[开始] --> B{判断}
    B -->|是| C[处理]
    B -->|否| D[结束]
    C --> D
EOF

npx -y @mermaid-js/mermaid-cli mmdc -i flow.mmd -o flow.svg
excalidraw-cli svg2png -i flow.svg -o flow.png
excalidraw-cli convert -i flow.svg -o flow.excalidraw

# 场景 3：批量处理
for f in *.svg; do
  excalidraw-cli convert -i "$f" -o "${f%.svg}.excalidraw"
done
```
