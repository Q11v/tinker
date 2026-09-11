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

/**
 * 每个分类对应 globals.css 里的一组变量：
 * --chart-N 是强调色（箭头 hover、卡片光斑），--tool-tint-N / --tool-ink-N 是图标块的底色与字色。
 * 只有 5 组，分类多于 5 个时循环复用。
 */
const ACCENT_SLOTS = 5

function accentSlot(category: ToolCategory): number {
  return (CATEGORY_ORDER.indexOf(category) % ACCENT_SLOTS) + 1
}

export function categoryAccent(category: ToolCategory): string {
  return `var(--chart-${accentSlot(category)})`
}

/** 图标块底色。深色模式是强调色的低透明度，浅色模式是手调的浅实色 */
export function categoryTint(category: ToolCategory): string {
  return `var(--tool-tint-${accentSlot(category)})`
}

/** 图标块字色。深色模式等于强调色，浅色模式压深到能过对比度 */
export function categoryInk(category: ToolCategory): string {
  return `var(--tool-ink-${accentSlot(category)})`
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

export const plannedTools = tools.filter((tool) => tool.status === "planned")

/**
 * 首页主推的三张大卡片。写成 slug 白名单而不是取 tools 的前三个，
 * 是因为「主推谁」是产品决定，不该被数组顺序的调整悄悄改掉。
 */
const FEATURED_SLUGS: ToolSlug[] = ["jwt", "hash", "json"]

export const featuredTools = FEATURED_SLUGS.map((slug) => {
  const tool = readyTools.find((item) => item.slug === slug)
  if (!tool) throw new Error(`主推工具 ${slug} 不在 readyTools 里`)
  return tool
})

/** 主推之外的 ready 工具，顺序沿用 tools 里的声明顺序 */
export const restTools = readyTools.filter((tool) => !FEATURED_SLUGS.includes(tool.slug))

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

/** 搜索结果行右端要标注的匹配原因，keyword 还要带上命中的那个词 */
export type MatchReason =
  | { kind: "name" }
  | { kind: "category" }
  | { kind: "description" }
  | { kind: "keyword"; keyword: string }

/**
 * 这个工具是凭什么被搜出来的。名称命中最有说服力，所以优先级最高；
 * 描述最弱 —— 只有前面都没命中时才说是描述匹配。
 * 判断逻辑必须和 searchTools 的匹配范围保持一致，否则会出现「搜到了但说不出原因」。
 */
export function matchReason(query: string, tool: Tool, text: ToolSearchText): MatchReason | null {
  const q = query.trim().toLowerCase()
  if (!q) return null

  if (text.name.toLowerCase().includes(q)) return { kind: "name" }

  const keyword = [...text.keywords, ...tool.keywords].find((item) =>
    item.toLowerCase().includes(q)
  )
  if (keyword) return { kind: "keyword", keyword }

  if (text.category.toLowerCase().includes(q)) return { kind: "category" }
  if (text.description.toLowerCase().includes(q)) return { kind: "description" }

  return null
}
