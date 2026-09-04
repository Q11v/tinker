import {
  Binary,
  Braces,
  CalendarClock,
  Dices,
  FileDiff,
  Fingerprint,
  KeyRound,
  Link2,
  Palette,
  QrCode,
  Regex,
  type LucideIcon,
} from "lucide-react"

import type { Dictionary } from "@/i18n/dictionaries"

/**
 * 分类用稳定 id，不用显示文本。
 * 显示名在字典的 categories 里，换语言不影响这里的数据结构。
 */
export type ToolCategory = "crypto" | "encoding" | "format" | "generator" | "datetime" | "text"

export const CATEGORY_ORDER: ToolCategory[] = [
  "crypto",
  "encoding",
  "format",
  "generator",
  "datetime",
  "text",
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

/**
 * 工具 id 直接取自字典的 tools 键集合。
 * 这样在 tools.ts 里加一个工具却忘了写文案，会在编译期就报错。
 */
export type ToolSlug = keyof Dictionary["tools"]

export interface Tool {
  /** URL 片段，最终路径为 /{lang}/tools/{slug}，同时也是字典里的 key */
  slug: ToolSlug
  category: ToolCategory
  icon: LucideIcon
  /**
   * 语言无关的搜索关键字（技术术语、缩写、别名）。
   * 各语言自己的关键字写在字典的 tools[slug].keywords 里。
   */
  keywords: string[]
  /** ready 的工具才可点击进入 */
  status: "ready" | "planned"
}

export const tools: Tool[] = [
  {
    slug: "jwt",
    category: "crypto",
    icon: KeyRound,
    keywords: ["jwt", "jsonwebtoken", "token", "hs256", "rs256"],
    status: "ready",
  },
  {
    slug: "hash",
    category: "crypto",
    icon: Fingerprint,
    keywords: ["hash", "sha", "sha1", "sha256", "sha512", "md5", "checksum", "digest"],
    status: "ready",
  },
  {
    slug: "base64",
    category: "encoding",
    icon: Binary,
    keywords: ["base64", "base64url", "atob", "btoa"],
    status: "ready",
  },
  {
    slug: "url",
    category: "encoding",
    icon: Link2,
    keywords: ["url", "uri", "encode", "decode", "querystring", "percent"],
    status: "ready",
  },
  {
    slug: "json",
    category: "format",
    icon: Braces,
    keywords: ["json", "format", "beautify", "minify", "validate"],
    status: "ready",
  },
  {
    slug: "color",
    category: "format",
    icon: Palette,
    keywords: ["color", "hex", "rgb", "hsl", "oklch", "wcag", "contrast"],
    status: "ready",
  },
  {
    slug: "generator",
    category: "generator",
    icon: Dices,
    keywords: ["uuid", "guid", "uuidv4", "uuidv7", "nanoid", "password", "random", "id"],
    status: "ready",
  },
  {
    slug: "qrcode",
    category: "generator",
    icon: QrCode,
    keywords: ["qrcode", "qr", "wifi"],
    status: "ready",
  },
  {
    slug: "timestamp",
    category: "datetime",
    icon: CalendarClock,
    keywords: ["timestamp", "unix", "epoch", "iso 8601", "rfc 2822", "timezone"],
    status: "ready",
  },
  {
    slug: "regex",
    category: "text",
    icon: Regex,
    keywords: ["regex", "regexp", "pattern", "match"],
    status: "planned",
  },
  {
    slug: "diff",
    category: "text",
    icon: FileDiff,
    keywords: ["diff", "compare"],
    status: "planned",
  },
]

export const readyTools = tools.filter((tool) => tool.status === "ready")

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug)
}

/** 搜索时要参与匹配的文本，由调用方从当前语言的字典里取 */
export interface ToolSearchText {
  name: string
  description: string
  category: string
  /** 该语言特有的关键字，和 Tool.keywords 里的通用关键字合并 */
  keywords: string[]
}

/**
 * 名称、描述、分类与关键字的模糊匹配，空查询返回全部。
 * 不直接依赖字典模块，改由调用方注入文本，tools.ts 因此保持语言无关。
 */
export function searchTools(query: string, textOf: (tool: Tool) => ToolSearchText): Tool[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools
  return tools.filter((tool) => {
    const text = textOf(tool)
    return [text.name, text.description, text.category, ...text.keywords, ...tool.keywords]
      .join(" ")
      .toLowerCase()
      .includes(q)
  })
}
