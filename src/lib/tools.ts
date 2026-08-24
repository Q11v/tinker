import {
  Binary,
  Braces,
  CalendarClock,
  FileDiff,
  Fingerprint,
  Hash,
  KeyRound,
  Link2,
  Palette,
  QrCode,
  Regex,
  type LucideIcon,
} from "lucide-react"

export type ToolCategory =
  | "加密与安全"
  | "编码转换"
  | "格式化"
  | "生成器"
  | "时间日期"
  | "文本处理"

export const CATEGORY_ORDER: ToolCategory[] = [
  "加密与安全",
  "编码转换",
  "格式化",
  "生成器",
  "时间日期",
  "文本处理",
]

/** 每个分类对应一个主题色变量（对应 globals.css 里的 --chart-1..5），用于卡片图标着色 */
const CATEGORY_ACCENTS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function categoryAccent(category: ToolCategory): string {
  const index = CATEGORY_ORDER.indexOf(category)
  return CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length]
}

export interface Tool {
  /** URL 片段，最终路径为 /tools/{slug} */
  slug: string
  name: string
  /** 一句话说明，用于卡片与工具页副标题 */
  description: string
  category: ToolCategory
  icon: LucideIcon
  /** 搜索关键字，中英文都写上，方便模糊匹配 */
  keywords: string[]
  /** ready 的工具才可点击进入 */
  status: "ready" | "planned"
}

export const tools: Tool[] = [
  {
    slug: "jwt",
    name: "JWT 工具",
    description: "解码 JWT、校验签名与声明，或用自己的密钥签发新的 Token。",
    category: "加密与安全",
    icon: KeyRound,
    keywords: ["jwt", "jsonwebtoken", "token", "解码", "签名", "校验", "hs256", "rs256"],
    status: "ready",
  },
  {
    slug: "hash",
    name: "哈希计算",
    description: "计算文本或文件的 SHA-1 / SHA-256 / SHA-512 摘要。",
    category: "加密与安全",
    icon: Fingerprint,
    keywords: ["hash", "sha", "md5", "摘要", "指纹"],
    status: "planned",
  },
  {
    slug: "base64",
    name: "Base64 编解码",
    description: "文本、图片与二进制数据的 Base64 / Base64URL 互转。",
    category: "编码转换",
    icon: Binary,
    keywords: ["base64", "编码", "解码", "base64url"],
    status: "planned",
  },
  {
    slug: "url",
    name: "URL 编解码",
    description: "百分号编码互转，并拆解 URL 的各个组成部分与查询参数。",
    category: "编码转换",
    icon: Link2,
    keywords: ["url", "uri", "encode", "querystring", "编码"],
    status: "planned",
  },
  {
    slug: "json",
    name: "JSON 格式化",
    description: "格式化、压缩与校验 JSON，支持树形浏览和路径提取。",
    category: "格式化",
    icon: Braces,
    keywords: ["json", "格式化", "美化", "压缩", "校验"],
    status: "planned",
  },
  {
    slug: "color",
    name: "颜色转换",
    description: "HEX / RGB / HSL / OKLCH 互转，附对比度检查。",
    category: "格式化",
    icon: Palette,
    keywords: ["color", "颜色", "hex", "rgb", "hsl", "oklch"],
    status: "planned",
  },
  {
    slug: "uuid",
    name: "UUID 生成",
    description: "批量生成 UUID v4 / v7 与 NanoID。",
    category: "生成器",
    icon: Hash,
    keywords: ["uuid", "guid", "nanoid", "随机", "id"],
    status: "planned",
  },
  {
    slug: "qrcode",
    name: "二维码生成",
    description: "把文本、链接或 Wi-Fi 配置生成为可下载的二维码。",
    category: "生成器",
    icon: QrCode,
    keywords: ["qrcode", "二维码", "qr"],
    status: "planned",
  },
  {
    slug: "timestamp",
    name: "时间戳转换",
    description: "Unix 时间戳与日期互转，支持多时区对照。",
    category: "时间日期",
    icon: CalendarClock,
    keywords: ["timestamp", "时间戳", "unix", "日期", "时区"],
    status: "planned",
  },
  {
    slug: "regex",
    name: "正则测试",
    description: "实时匹配高亮、分组捕获与常用正则速查。",
    category: "文本处理",
    icon: Regex,
    keywords: ["regex", "正则", "匹配", "regexp"],
    status: "planned",
  },
  {
    slug: "diff",
    name: "文本对比",
    description: "逐行 / 逐字符对比两段文本的差异。",
    category: "文本处理",
    icon: FileDiff,
    keywords: ["diff", "对比", "差异", "compare"],
    status: "planned",
  },
]

export const readyTools = tools.filter((tool) => tool.status === "ready")

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug)
}

/** 名称、描述与关键字的模糊匹配，空查询返回全部 */
export function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools
  return tools.filter((tool) =>
    [tool.name, tool.description, tool.category, ...tool.keywords]
      .join(" ")
      .toLowerCase()
      .includes(q)
  )
}
