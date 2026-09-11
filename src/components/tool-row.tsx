import Link from "next/link"

import { ToolIcon } from "@/components/tool-icon"
import type { Dictionary } from "@/i18n/dictionaries"
import { categoryInk, categoryTint, type Tool } from "@/lib/tools"

/**
 * 主推之外的工具与搜索结果共用的紧凑行。
 * 右端只放一样东西：平时是分类名，搜索时换成匹配原因 —— 设计稿里这两者是互斥的，
 * 因为一行 62px 高的行右边再塞第二段等宽小字就开始抢眼了。
 */
export function ToolRow({
  tool,
  dict,
  href,
  note,
}: {
  tool: Tool
  dict: Dictionary
  href: string
  /** 右端标注，不传就用分类名 */
  note?: string
}) {
  const text = dict.tools[tool.slug]

  return (
    <Link
      href={href}
      className="bg-surface hover:bg-surface-hover hover:border-border-hover focus-visible:ring-ring/50 flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      <ToolIcon
        icon={tool.icon}
        tint={categoryTint(tool.category)}
        ink={categoryInk(tool.category)}
      />
      <span className="flex min-w-0 flex-col gap-[3px]">
        <span className="text-[14.5px] leading-tight font-medium">{text.name}</span>
        <span className="text-muted-foreground truncate text-[12.5px] leading-tight">
          {text.description}
        </span>
      </span>
      <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[10.5px] tracking-[0.08em]">
        {note ?? dict.categories[tool.category]}
      </span>
    </Link>
  )
}
