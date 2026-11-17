# Tinker

轻量的纯前端开发者工具箱，支持简体中文和英文、深浅色主题。计算在浏览器中完成，无需登录或后端服务。

## 开发与构建

使用 Node.js 20.9 或更高版本与 npm。

```bash
npm ci
npm run dev       # http://localhost:3000
npm run lint
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm run format:check
npm run build     # 静态产物写入 out/
npm start         # 本地预览 out/
```

技术栈：Next.js 16.3 App Router、React 19、TypeScript、Tailwind CSS v4、shadcn/ui（Radix）、jose、qrcode-generator。Next.js 的具体 API 以安装包内 `node_modules/next/dist/docs/` 为准。

生产环境直接部署 `out/`，不需要 Node.js 服务端。构建时 `next/font/google` 需要访问 Google Fonts；生成的字体由站点静态资源提供。若当前环境无法运行 Turbopack，可使用 `npm run build -- --webpack` 验证构建。

## 当前工具

所有工具路径都带语言前缀：`/{lang}/tools/{slug}`，其中 `lang` 为 `zh` 或 `en`。根路径 `/` 由 `public/index.html` 按浏览器语言跳转，默认中文。

| 工具          | slug        | 功能                                                                                       |
| ------------- | ----------- | ------------------------------------------------------------------------------------------ |
| 进制转换      | `binary`    | 二、八、十、十六进制整数互转；可点击的二进制位面板、示例数字、前缀、大小写、分组与复制全部 |
| JWT 工具      | `jwt`       | 解码、签名与声明校验、签发 Token、生成密钥对                                               |
| 哈希计算      | `hash`      | 文本与文件的 MD5、SHA-1、SHA-256、SHA-384、SHA-512 摘要                                    |
| 2FA 验证码    | `totp`      | TOTP 实时生成与校验、otpauth 链接导入导出、绑定二维码                                      |
| Base64 编解码 | `base64`    | 文本、文件与图片的 Base64 / Base64URL 编解码                                               |
| URL 编解码    | `url`       | 百分号编码、解码、URL 组成部分与查询参数解析                                               |
| JSON 格式化   | `json`      | 格式化、压缩、校验、树形浏览；支持宽松对象字面量输入                                       |
| 颜色转换      | `color`     | HEX、RGB、HSL、OKLCH 转换与 WCAG 对比度检查                                                |
| 随机生成器    | `generator` | UUID v4 / v7、NanoID、可配置密码与强度预估                                                 |
| 二维码生成    | `qrcode`    | 文本、链接、Wi-Fi 二维码及 PNG / SVG 导出                                                  |
| 时间戳转换    | `timestamp` | Unix 时间戳与日期字符串互转、常用时区对照                                                  |

目前有 11 个可用工具。`regex` 和 `diff` 仍以 `planned` 状态保留在注册表中，没有可访问的工具页。首页和导航只展示 `ready` 工具，首页已移除“规划中”提示栏，工具页页头也已移除本地计算提示。

进制工具使用 `BigInt` 保证整数精度，输入去除首尾空白后最多 4096 个字符，不支持小数。`0b`、`0o`、`0x` 前缀须匹配所选进制。位面板支持非负的 8 / 16 / 32 / 64 / 128 / 256 位整数，数值超出所选位宽时自动扩展，不截断高位；负数和超过 256 位的整数仍可通过输入框转换。结果分组以空格显示：二进制与十六进制每 4 位、八进制与十进制每 3 位；复制使用当前显示格式。

## 代码结构

- `src/app/[lang]/`：本地化布局、首页与工具路由，静态生成中英文页面。
- `src/components/tools/<slug>/`：各工具的客户端交互组件。
- `src/lib/`：工具注册表、转换与校验逻辑、元数据、最近使用记录与链接配置。
- `src/i18n/`：语言配置、上下文与字典；中文定义字典类型，英文必须保持同构。
- `src/components/ui/`：项目实际使用的基础 UI 组件。
- `public/index.html`：根路径语言跳转页。

`src/lib/tools.ts` 驱动首页分类、搜索、工具数量和导航。首页主推 JWT、哈希与 JSON，其余可用工具按注册表顺序展示。最近使用记录和语言、主题偏好由浏览器保存。对外链接集中在 `src/lib/links.ts`。

## 新增工具

1. 在 `src/i18n/dictionaries/zh.ts` 与 `en.ts` 的 `tools` 中添加同名 slug，补齐名称、描述、搜索词及界面文案。
2. 在 `src/lib/tools.ts` 注册分类、图标、通用搜索词与状态；只有完成页面后才设为 `ready`。
3. 将纯计算逻辑放入 `src/lib/<slug>.ts`，将交互组件放入 `src/components/tools/<slug>/`，需要交互的入口使用 `"use client"`。
4. 新建 `src/app/[lang]/tools/<slug>/page.tsx`，复用 `ToolPage` 和 `toolMetadata`。可参考进制工具页面：

```tsx
import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { BinaryTool } from "@/components/tools/binary/binary-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/binary">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("binary", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="binary" lang={(await params).lang}>
      <BinaryTool />
    </ToolPage>
  )
}
```

`ToolPage` 负责校验语言、读取字典并套用 `ToolShell`。常规分区可复用 `Panel`，复制统一用 `CopyButton`，提示使用 `sonner`，JSON 高亮使用 `JsonBlock`。移除功能时同步清理组件、导出、字典和文档。

新增语言时更新 `src/i18n/config.ts`、字典加载器和字典文件，同时更新 `public/index.html` 中手工维护的语言列表与备用链接。

## 验证约定

提交前运行 lint、TypeScript、格式检查与生产构建。Next.js 自动生成路由类型；新建路由后若单独运行 TypeScript 提示路由类型缺失，先执行 `npx next typegen` 或构建。

为解析、校验和精度相关改动验证正常值、非法输入、空输入、边界值及大整数。涉及 UI 时检查中英文、深浅色和窄屏布局。随机数、当前时间和浏览器专属 API 应在客户端合适的时机读取，避免静态 HTML 与首次渲染不一致。
