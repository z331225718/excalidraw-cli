# DSL 路径

> excalidraw-cli 原生支持 DSL JSON 输入。AI agent 输出结构化 JSON 描述图表布局，引擎自动计算坐标。

## Workflow

```
Step 1: 路由 & 读取知识
  - 读对应 scene 指南 — 了解结构特征和布局策略
  - 确定布局策略（见下方快速判断）和构建方式
  - 读 elements/ 核心模块 — 语法、布局、配色、排版、连线

Step 2: 生成完整 DSL JSON
  - 按 content.md 规划信息量和分组
  - 按 layout.md 选择布局模式和间距
  - 按 style.md / beautiful-excalidraw 的配色上色
  - 按 schema.md 语法输出完整 JSON
  - 连线参考 connectors.md，排版参考 typography.md

Step 3: 渲染 & 审查 → 交付
  1. 创建产物目录 ./diagrams/YYYY-MM-DDTHHMMSS/
  2. 保存 DSL 为 diagram.json
  3. 编译为 .excalidraw：
       excalidraw-cli dsl -i diagram.json -o diagram.excalidraw -f png
      （-f png 同时生成 PNG 预览）
  4. 审查 PNG，有问题修改 DSL 后重新编译（最多 2 轮）
  5. 交付：向用户报告 .excalidraw 和 .png 文件路径
```

**布局策略快速判断**（详见 `elements/layout.md`）：

先定**主布局**，再定子布局：**结构化信息**优先用 Flex，**关系链路**优先用 Dagre，**灵活定位**用绝对布局。

## 模块索引

### 核心参考（必读）

| 模块     | 文件                         | 说明                            |
| -------- |----------------------------| ------------------------------- |
| DSL 语法 | `elements/schema.md`       | 节点类型、属性、尺寸值          |
| 内容规划 | `elements/content.md`    | 信息提取、密度决策、连线预判    |
| 布局系统 | `elements/layout.md`     | 网格方法论、Flex 映射、间距规则 |
| 排版规则 | `elements/typography.md` | 字号层级、对齐、行距            |
| 连线系统 | `elements/connectors.md` | 拓扑规划、锚点选择              |
| 配色系统 | `elements/style.md`      | 多色板、视觉层级                |

### 场景指南（按类型选读一个）

| 图表类型    | 文件                     | 适用场景                               |
| ----------- | ------------------------ | -------------------------------------- |
| 架构图      | `scenes/architecture.md` | 分层架构、微服务架构                   |
| 组织架构图  | `scenes/organization.md` | 公司组织、树形层级                     |
| 泳道图      | `scenes/swimlane.md`     | 跨角色流程、跨系统交互流程             |
| 对比图      | `scenes/comparison.md`   | 方案对比、功能矩阵                     |
| 鱼骨图      | `scenes/fishbone.md`     | 因果分析、根因分析                     |
| 柱状图      | `scenes/bar-chart.md`    | 柱状图、条形图                         |
| 折线图      | `scenes/line-chart.md`   | 折线图、趋势图                         |
| 树状图      | `scenes/treemap.md`      | 矩形树图、层级占比                     |
| 漏斗图      | `scenes/funnel.md`       | 转化漏斗、销售漏斗                     |
| 金字塔图    | `scenes/pyramid.md`      | 层级结构、需求层次                     |
| 循环/飞轮图 | `scenes/flywheel.md`     | 增长飞轮、闭环链路                     |
| 里程碑      | `scenes/milestone.md`    | 时间线、版本演进                       |
| 流程图      | `scenes/flowchart.md`    | 业务流、状态机、带条件判断的链路       |

## 渲染前自查

- [ ] 不同分组用了不同颜色？同组节点样式完全一致？
- [ ] 外层浅色背景、内层白色节点？
- [ ] 所有 frame 都写了 layout 属性？gap 和 padding 显式设置？
- [ ] 含文字节点 height 用 fit-content？
- [ ] connector 在顶层 nodes 数组（不在 frame children 里）？
- [ ] flex 容器内没有写 x/y？

## 症状→修复表

| 看到的问题         | 改什么                              |
| ------------------ | ----------------------------------- |
| 文字被截断         | height 改为 fit-content             |
| 文字溢出容器右侧   | 增大 width，或缩短文字              |
| 节点重叠粘连       | 增大 gap                            |
| 节点挤成一团       | 增大 padding 和 gap                 |
| 连线穿过节点       | 调整 fromAnchor/toAnchor 或增大间距 |
| 大面积空白         | 缩小外层 frame 宽度                 |
| 文字和背景色太接近 | 调整 fillColor 或 textColor         |
| 布局整体偏左/偏右  | 调整绝对定位的 x 坐标使内容居中     |
