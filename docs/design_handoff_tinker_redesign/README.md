# Handoff: Tinker 开发者工具箱 · 首页与工具页重设计

## Overview
对现有站点 Tinker（Next.js App Router + Tailwind v4 + shadcn/ui，仓库 `Q11v/tinker`）的首页（工具目录）、工具详情页、搜索结果与空状态做的一次视觉与信息层级重设计。结构保持**单栏**（顶栏 + 居中内容），不引入侧栏。深色为主模式，浅色为同结构的配色层。

## About the Design Files
本包内的 HTML 文件是**设计稿**，用 HTML 表达最终视觉与行为意图，**不是可直接复制进产品的生产代码**。
任务是：在目标代码库（本项目为 Next.js + React + Tailwind v4 + shadcn/ui）里，用它既有的组件、令牌与约定**重新实现**这些设计——复用 `src/components/ui/*`、`src/lib/tools.ts` 的数据结构和 `src/app/globals.css` 里的 CSS 变量，而不是把设计稿的内联样式搬进去。

设计稿文件使用一个内部的流式组件运行时（`support.js`），只用于预览；实现时忽略 `<x-dc>`、`<sc-for>`、`<sc-if>` 这些标签语义，只取它们表达的布局/循环意图。

## Fidelity
**High-fidelity（hifi）**。颜色、字号、间距、圆角均为最终值，按本文档的令牌表 1:1 实现。文案为最终中文文案（英文版请走现有 i18n 字典 `src/i18n/dictionaries/`）。

## Screens / Views

### 1. 首页 / 工具目录（`/[lang]`）
**目的**：一屏看清全部 9 个可用工具，并支持搜索、分类筛选、最近使用快捷入口。

**布局（桌面 ≥1024px）**
- 页面最大宽度 `max-w-6xl`（1152px），水平内边距 28px（现仓库为 `px-4 sm:px-6`，可保留）。
- 顶栏：高 60px，sticky，底部 1px 边框；左：logo 方块 28×28 + 文字标记；紧随其后的次级导航「全部工具 / 最近 / 关于」；右：⌘K 胶囊、语言切换、主题切换，图标按钮 30×30、圆角 8px。
- Hero：上内边距 52px，内容居中，纵向 gap 22px。
  - 眉标 `Local-first devtools`：等宽字体，11px，letter-spacing .28em，大写，青色强调。
  - 主标题「开发者工具箱」：52px / line-height 1.1 / weight 700 / letter-spacing -.02em，渐变文字（见令牌）。
  - 副标题：16px，次级文字色。
  - 搜索条：宽 720px，高 56px，圆角 14px，左侧放大镜 16px，右侧 `Enter` 键帽（等宽 11px，1px 边框，圆角 6px）。
  - 分类筛选：胶囊，高 ~32px（padding 7px 14px），圆角 999px，13px；选中态为反相实心（深色模式白底深字 / 浅色模式深底白字），未选中为 1px 描边。分类后跟数量。
- 最近使用条：单行，圆角 14px，padding 14px 18px；左侧「最近」等宽小标签，接 2 个工具胶囊（20×20 色块图标 + 名称），右侧「清除」。仅在无筛选时出现。
- 主推工具卡片：3 列网格，gap 14px，卡片 min-height 186px，圆角 18px，padding 22px。
  - 左上 46×46 圆角 14px 的图标块（等宽字形 15px / 600，底色为分类色 16–18% 透明度，字色为分类色）。
  - 右上 `↗` 15px。
  - 标题 17px/600 + 分类小标签（等宽 10px，1px 描边，圆角 5px）。
  - 描述 13.5px / line-height 1.6 / 次级色，`text-wrap: pretty`。
  - 卡片右上角有一枚 130×130、blur 28px、透明度 .18 的分类色光斑。
  - hover：深色模式边框提亮到 `rgba(255,255,255,.28)`；浅色模式加投影 `0 18px 34px -22px rgba(40,20,90,.45)`。
- 其余工具：2 列紧凑行，gap 10px，行高约 62px（padding 14px 16px），圆角 14px；34×34 图标块 + 名称 14.5px/500 + 单行省略的短描述 12.5px + 右端分类名（等宽 10px）。
- 规划中：1px 虚线容器，圆角 14px，padding 14px 18px，列出「正则测试 · 文本对比」，右端「去 GitHub 提需求 →」。
- 页脚：上边框，padding 18px 28px，13px 次级文字，右端 GitHub。

**主推 3 个工具**：JWT 工具、哈希计算、JSON 格式化。其余 6 个按 Base64、URL、颜色转换、随机生成器、二维码生成、时间戳转换排列。

### 2. 工具详情页（示例：`/[lang]/tools/hash`）
**目的**：进入后立即可用，输入即算。

**布局**
- 顶栏同首页，但次级导航换成面包屑：`Tinker / 加密与安全 / 哈希计算`（13px）。
- 页头：46×46 图标块 + 标题 24px/600/-.015em + 分类标签 + 描述 13.5px；右端提示「全部在本机计算 · 不上传」13px 次级色。
- 工具条：圆角 12px，padding 10px 14px，1px 边框；左侧「文本 / 文件」分段控件（外层 padding 3px、圆角 9px，选中项圆角 7px）；中间说明「输入即算，无需点按钮」12.5px；右端 `UTF-8 · 23 字节` 等宽 11.5px。
- 输入区：圆角 16px，1px 边框，padding 16px 18px，min-height 104px，等宽 13.5px / line-height 1.7。
- 结果行（MD5 / SHA-1 / SHA-256 / SHA-512）：每行圆角 12px、padding 13px 16px、1px 边框；算法名列宽 84px（等宽 12px/600），摘要单行省略（等宽 12.5px），右端「复制」按钮（padding 5px 11px，圆角 8px，12px）。
- 校验条：圆角 12px，padding 13px 16px，弱底色；左「校验」等宽小标签，中间 placeholder，右「比对」按钮。

JSON 格式化页（见 `1a` 版本）使用左右双栏编辑器：`grid-template-columns: 1fr 1fr`，gap 14px，面板圆角 16px，面板头 padding 10px 14px + 底边框，内容区等宽 12.5px / line-height 1.75；语法高亮：键 = 青色、字符串 = 琥珀、布尔 = 紫色。

### 3. 搜索结果
- 搜索条获得焦点态：浅色模式为 1px 品牌紫边框 + 3px `oklch(0.55 0.22 279 / .12)` 外发光；深色模式边框 `rgba(255,255,255,.18)`。
- 结果行样式同首页紧凑行，右端补一个匹配原因标注（等宽 10.5px，如「名称匹配」「关键字 atob」）。
- 底部提示条：「回车直接用剪贴板内容打开第一个结果」。

### 4. 空状态
- 1px 虚线容器，圆角 16px，padding 34px 20px，内容居中，gap 14px。
- 44×44 圆角 14px 的 `∅` 图标块。
- 主文案「「{query}」还在规划中」15px/600；辅助文案 13px 次级色，最大宽度 320px。
- 两个按钮：主按钮「清除筛选」（深色模式白底深字 / 浅色模式品牌紫底白字），次按钮「提一个 issue」（1px 描边）。
- 下方「试试：」+ 3 个建议工具胶囊。

## Interactions & Behavior
- 搜索：输入即过滤（沿用 `searchTools`），无防抖需求（纯本地）。`⌘K` / `Ctrl+K` 聚焦搜索；`Esc` 清空查询并回到「全部」。
- 分类胶囊：单选，当前分类下无结果的分类置灰禁用（仓库 `tool-explorer.tsx` 已有此逻辑，保留）。
- 「最近使用」仅在 `query === "" && category === "all"` 时渲染。
- 卡片 hover：`transition: all 160ms ease`；位移 `translateY(-2px)`，边框/投影如上；`↗` 图标 hover 时 `translate(1px,-1px)` 并变为分类色。
- 工具页输入：受控 `input` 事件即时计算，长文本或文件用 Web Crypto 的异步接口，>1MB 时显示一行进度/计算中状态。
- 复制按钮：点击后 1.5s 内文字变「已复制」（仓库已有 `copy-button.tsx`，复用）。
- 主题切换：`next-themes`（仓库已接入），深浅两套值即本文档令牌表两列。
- `prefers-reduced-motion: reduce` 时关闭 hero 光斑动画与卡片位移。
- 响应式：≥1024px 主推 3 列 + 紧凑行 2 列；768–1023px 主推 2 列 + 紧凑行 1 列；<768px 全部 1 列，hero 标题降到 32px，搜索条宽度 100%，分类胶囊横向可滚动。

## State Management
- `query: string`、`category: ToolCategory | "all"`（沿用现有 `ToolExplorer`）。
- `recent: ToolSlug[]`（localStorage，沿用 `src/lib/recent-tools.ts`）。
- 工具页：`mode: "text" | "file"`、`input: string | File`、`digests: Record<Algo,string>`、`verifyInput: string`、`copiedAlgo: Algo | null`。
- 无网络请求，全部本地计算。

## Design Tokens

字体
- Sans / 标题：`Space Grotesk`，中文回退 `Noto Sans SC`, `PingFang SC`, system-ui。
- Mono：`JetBrains Mono`（数字、摘要、键帽、眉标、分类小标签）。
- 字号阶：52 / 24 / 19 / 17 / 16 / 15 / 14.5 / 13.5 / 13 / 12.5 / 11 / 10.5 / 10。
- 字重：400 / 500 / 600 / 700。

颜色（oklch，沿用并扩展 `globals.css`）

| 角色 | 深色 | 浅色 |
| --- | --- | --- |
| background | `oklch(0.16 0.024 280)` | `oklch(0.995 0.004 285)` |
| surface / card | `rgba(255,255,255,.035)` ~ `.06` | `#fff` |
| border | `rgba(255,255,255,.09)` | `oklch(0.91 0.014 285)` |
| foreground | `oklch(0.96 0.01 280)` | `oklch(0.19 0.03 285)` |
| muted foreground | `oklch(0.70 0.025 280)` | `oklch(0.50 0.03 285)` |
| primary | `oklch(0.73 0.19 279)` | `oklch(0.55 0.22 279)` |
| brand gradient | `linear-gradient(135deg, oklch(0.66 0.22 300), oklch(0.68 0.2 279) 40%, oklch(0.74 0.17 220) 70%, oklch(0.78 0.15 195))` | `linear-gradient(135deg, oklch(0.62 0.24 300), oklch(0.6 0.22 279) 40%, oklch(0.7 0.18 220) 70%, oklch(0.75 0.16 195))` |

分类强调色（= `--chart-1..5`，`categoryAccent()` 已有映射）

| 分类 | 深色强调 | 深色图标底 | 浅色图标底 | 浅色图标字 |
| --- | --- | --- | --- | --- |
| 加密与安全 crypto | `oklch(0.68 0.2 279)` | 同色 18% | `oklch(0.94 0.035 285)` | `oklch(0.42 0.16 279)` |
| 编码转换 encoding | `oklch(0.78 0.13 200)` | 同色 16% | `oklch(0.94 0.03 205)` | `oklch(0.45 0.10 210)` |
| 格式化 format | `oklch(0.80 0.15 80)` | 同色 16% | `oklch(0.95 0.04 85)` | `oklch(0.48 0.11 70)` |
| 生成器 generator | `oklch(0.72 0.19 20)` | 同色 16% | `oklch(0.95 0.03 25)` | `oklch(0.47 0.16 20)` |
| 时间日期 datetime | `oklch(0.75 0.15 155)` | 同色 16% | `oklch(0.94 0.04 155)` | `oklch(0.42 0.10 155)` |

间距：4 / 7 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 26 / 28 / 40 / 52。
圆角：5（小标签）/ 6（键帽）/ 8（图标按钮）/ 9–10（小控件）/ 12（行、工具条）/ 14（图标块、条状容器、搜索条）/ 16（面板）/ 18（卡片）/ 22（外框，仅设计稿的画板圆角，产品里不需要）/ 999（胶囊）。
投影：
- 卡片 hover（浅色）`0 18px 34px -22px rgba(40,20,90,.45)`
- 搜索条（深色）`0 20px 40px -24px rgba(0,0,0,.8)`；（浅色）`0 18px 36px -26px rgba(40,20,90,.5)`
- 分段控件选中项 `0 1px 2px rgba(20,10,50,.08)`

## Assets
无位图资源。图标沿用仓库现有的 `lucide-react`（`KeyRound / Fingerprint / Binary / Link2 / Braces / Palette / Dices / QrCode / CalendarClock`）；设计稿中用等宽字形（`JW`、`##`、`{ }`、`64`、`://`、`◐`、`⚄`、`▦`、`◷`）只是占位表达，**实现时请用 lucide 图标**，尺寸 20px（34×34 块）/ 22px（46×46 块），描边 1.75。
字体通过 `next/font/google` 引入 Space Grotesk 与 JetBrains Mono，中文回退系统字体。

## Files
- `Tinker 重设计.dc.html` — 设计稿本体。`2a`＝深色（主），`2b`＝浅色，两者结构完全一致；`1a` / `1b` 为第一轮方案，其中 `1a` 的 JSON 格式化双栏详情页仍是有效参考，`1b`（左右侧栏结构）**已废弃，不要实现**。
- `support.js` — 设计稿预览运行时，仅为本地打开设计稿用，不要引入产品代码。

在浏览器里直接打开 `Tinker 重设计.dc.html` 即可查看全部画面。
