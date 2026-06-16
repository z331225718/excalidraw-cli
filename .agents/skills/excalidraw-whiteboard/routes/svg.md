# SVG 路径

你在设计一张专业的信息图——内容扎实, 美观漂亮, 具有设计感和视觉张力, 不是枯燥的布局和文字堆砌, **不要做的像普通的网页或者千篇一律的模版**
最终交付是 **Excalidraw 可编辑文件**（你写 SVG → excalidraw-cli 转换为 .excalidraw）

**核心心智纠正 (重要)**：
- 大多数 AI 如果只考虑"绝对不报错/完美映射", 最终给出的都是全篇纯白底色加单层 `<rect>` 的方正卡片网格, 极其死板单调, **这将被视为不及格！**
- **SVG 给你了完全的设计自由**, 请大胆使用你脑内的图标路径 (`<path>`), 连接指引 (`流畅的 <path>`), 各种环境氛围点缀, 大胆一点, 充分信任你的品味, 发挥出你的顶级艺术创造力！

## Workflow

### 1. 想清楚要画什么

- **核心信息是什么？** 能做到一图胜千言, 绝对不要只生成平平无奇的文字表格, 要有设计感
- **内容充实度**：如果用户描述稀疏简略, 利用你的领域知识扩展, 保证信息维度和内容充实, 但不要过度堆砌, 淹没重点
- **视觉层级与隐喻**：这个没有固定的形式, 你自由判断, 比如: 给重要的节点加光环, 加高亮背景；给对比项设计天平或对称结构

### 2. 写 SVG

[!IMPORTANT] 布局, 配色, 信息密度, 装饰物——**全部由你判断**, 打破单调的 `<rect>` 牢笼, 严禁通篇用矩形和文字应付用户

操作边界约束：
- **语言跟随用户**：图表文字的语言与用户 prompt 保持一致, 技术术语用行业里通用的写法, 不机械翻译
- 文字用 `<text>`(不是 `<path>`), 容器宽度留够——Excalidraw 按 CJK ≈ 1em / Latin ≈ 0.6em 重排
- **XML 特殊字符必须转义**：`&` → `&amp;`、`<` → `&lt;`、`>` → `&gt;`。文本中的裸 `&` 会导致 sharp 解析崩溃 (`xmlParseEntityRef: no name`)。渲染前自查：`grep -n '&' diagram.svg | grep -v '&amp;\|&lt;\|&gt;\|&\#\|marker'` — 有输出就崩。避免用 `&`，改用"与""和""and"。
- 连线使用正交折线替代斜直线(`<polyline>` 带水平/垂直折点)视觉效果更好
- 可自由使用 `translate`, `rotate`, `scale`但请尽量避免使用 `skewX` / `skewY` / `matrix(...)` 发生空间级扭曲

### 3. 渲染审查

```
建目录     ./diagrams/YYYY-MM-DDTHHMMSS/         (例：./diagrams/2026-04-15T143022/)
写文件     <dir>/diagram.svg
预览 PNG   excalidraw-cli svg2png -i <dir>/diagram.svg -o <dir>/diagram.png
转为源文件  excalidraw-cli convert -i <dir>/diagram.svg -o <dir>/diagram.excalidraw
```

审查 PNG 视觉效果，有问题修改 SVG 后重新渲染（最多 2 轮）。

## Excalidraw 怎么处理 SVG

excalidraw-cli 的 svg-parser 把可识别元素转成 Excalidraw 可编辑节点, 其余降级为内嵌图片(渲染没问题, 虽然不可编辑, 但是可以正常显示)。
**不需要所有元素都可编辑, 但必须避免使用不支持的装饰特性, 且要兼顾可编辑和美观漂亮**

**可识别的元素**

- 形状：`<rect>` / `<circle>` / `<ellipse>`
- 连线：`<line>` / `<polyline>`（`<line>` 带 `marker-end` 时识别为箭头）
- 文本：`<text>` **文字必须用 `<text>`**
- 分组：`<g transform="translate()">` 位移变换

**⚠️ [!IMPORTANT] 不支持的装饰特性**
- `<radialGradient>` / `<filter>` / `<pattern>` / `<clipPath>` / `<mask>` → Excalidraw 不支持，**请避免使用，否则会导致渲染问题**
- `<polygon>` / `<path>` / `<use>` / `<tspan>` → excalidraw-cli 目前不完全支持
