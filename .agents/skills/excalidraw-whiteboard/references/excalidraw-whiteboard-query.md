# 查询/预览图表

> excalidraw-cli 是本地工具，不依赖飞书云服务。查询操作即本地文件的读取和预览。

## 预览 .excalidraw 文件

### 渲染为 PNG 预览

```bash
excalidraw-cli render -i <file>.excalidraw -o preview.png
```

### 查看原始内容

`.excalidraw` 文件本质是 JSON，可直接查看：

```bash
cat <file>.excalidraw | head -50    # 查看前 50 行
```

或在 https://excalidraw.com 打开进行交互式查看和编辑。

## 预览 SVG 文件

### SVG → PNG 一步预览

```bash
excalidraw-cli svg2png -i diagram.svg -o preview.png
```

### SVG → Excalidraw 后预览

```bash
excalidraw-cli convert -i diagram.svg -o diagram.excalidraw
excalidraw-cli render -i diagram.excalidraw -o preview.png
```

## 选项

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-w, --width` | PNG 最大宽度 | 1600 |
| `-b, --background` | 背景色 (hex) | #ffffff |
