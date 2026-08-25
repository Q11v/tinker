# tinker

一系列轻量、纯前端的开发者小工具，无需登录、即开即用。所有计算都在浏览器本地完成，数据不会上传到任何服务器。

## 技术栈

- [Next.js 16](https://nextjs.org)（App Router，`output: "export"` 静态导出）
- TypeScript
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com)（radix-nova 预设）
- [jose](https://github.com/panva/jose) —— JWT 相关的签名与校验，底层走浏览器的 Web Crypto

## 本地开发

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 生产构建，产物在 out/
npm run lint
```

## 已有工具

| 工具        | 路径               | 说明                                                                                           |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| JWT 工具    | `/tools/jwt`       | 解码、校验签名与声明、用自己的密钥签发 Token，并可现场生成密钥对                               |
| JSON 格式化 | `/tools/json`      | 格式化、压缩、树形浏览，输入支持宽松的 JS 对象字面量写法（单引号、无引号 key、结尾逗号、注释） |
| 随机生成器  | `/tools/generator` | UUID v4 / v7、NanoID，以及可自定义字符集与强度预估的密码生成                                   |
| 时间戳转换  | `/tools/timestamp` | Unix 时间戳与日期字符串互转，附常用时区对照                                                    |

其余工具在 [`src/lib/tools.ts`](src/lib/tools.ts) 里以 `status: "planned"` 占位，**不会**出现在首页或导航里，按下面的步骤把它做完并把状态改成 `"ready"` 即可上线。

## 新增一个工具

1. 在 [`src/lib/tools.ts`](src/lib/tools.ts) 的 `tools` 数组里加一条记录（或者把已有的 `planned` 记录改成 `"ready"`）。
   这张注册表同时驱动首页的分类网格与搜索、顶部导航下拉菜单，不需要改别的地方。
2. 新建页面 `src/app/tools/<slug>/page.tsx`，用 `getTool("<slug>")` 取元信息，套上共用的
   [`ToolShell`](src/components/tool-shell.tsx) 渲染标题区。
3. 工具的交互部分放在 `src/components/tools/<slug>/` 下，标记 `"use client"`；
   纯逻辑（解析、格式化、校验等不依赖 DOM 的部分）抽到 `src/lib/<slug>.ts`，方便单独测试和复用。
4. 卡片式的分区布局用共享的 [`Panel`](src/components/tool-panel.tsx) 组件（`accent` 目前有
   `rose` / `violet` / `sky` 三种，习惯上 violet 表示输入、sky 表示输出）；如果要展示带语法高亮的
   JSON，直接复用 [`JsonBlock`](src/components/json-block.tsx)，不要再写一份。

页面骨架示例：

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { Base64Tool } from "@/components/tools/base64/base64-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("base64")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function Base64Page() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <Base64Tool />
    </ToolShell>
  )
}
```

## 约定

- 所有计算都在客户端完成，不要引入需要服务端的依赖；随机数、当前时间等只能在客户端拿到的值放到
  `useEffect` 里再 `setState`，避免和静态导出构建期生成的 HTML 对不上（hydration mismatch）。
- 复制按钮统一用 [`CopyButton`](src/components/copy-button.tsx)，提示统一用 `sonner`。
- 深色模式由 `next-themes` 的 `class` 策略驱动，配色只用 `globals.css` 里的语义化 CSS 变量。
- 新逻辑写完后跑一遍 `npm run lint` 与 `npx tsc --noEmit`；涉及 `useEffect` 里 `setState` 或渲染期调用
  `Date.now()` / `Math.random()` 这类写法，eslint 的 `react-hooks` 规则会拦，能避免就避免，绕不开的话加
  一行说明原因的 `eslint-disable-next-line` 注释。
