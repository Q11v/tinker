# tinker

一系列轻量、纯前端的开发者小工具，无需登录、即开即用。所有计算都在浏览器本地完成，数据不会上传到任何服务器。

## 技术栈

- [Next.js 16](https://nextjs.org)（App Router，全站静态导出友好）
- TypeScript
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com)（radix-nova 预设）
- [jose](https://github.com/panva/jose) —— JWT 相关的签名与校验，底层走浏览器的 Web Crypto

## 本地开发

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 生产构建
npm run lint
```

## 已有工具

| 工具 | 路径 | 说明 |
| --- | --- | --- |
| JWT 工具 | `/tools/jwt` | 解码、校验签名与声明、用自己的密钥签发 Token，并可现场生成密钥对 |

其余工具在首页以「敬请期待」占位，按下面的步骤补齐即可。

## 新增一个工具

1. 在 [`src/lib/tools.ts`](src/lib/tools.ts) 的 `tools` 数组里加一条记录，`status` 写 `"ready"`。
   注册表同时驱动首页的分类网格、搜索和顶部导航，不需要改别的地方。
2. 新建页面 `src/app/tools/<slug>/page.tsx`，用 `getTool("<slug>")` 取到元信息，
   套上共用的 [`ToolShell`](src/components/tool-shell.tsx) 渲染标题区。
3. 工具的交互部分放在 `src/components/tools/<slug>/` 下，标记 `"use client"`；
   纯逻辑抽到 `src/lib/<slug>.ts`，方便单独测试和复用。

页面骨架示例：

```tsx
import { ToolShell } from "@/components/tool-shell"
import { getTool } from "@/lib/tools"

const tool = getTool("base64")

export const metadata = { title: tool?.name, description: tool?.description }

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

- 所有计算都在客户端完成，不要引入需要服务端的依赖。
- 复制按钮统一用 [`CopyButton`](src/components/copy-button.tsx)，提示统一用 `sonner`。
- 深色模式由 `next-themes` 的 `class` 策略驱动，配色只用 `globals.css` 里的语义化 CSS 变量。
