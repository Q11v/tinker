import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import { CategoryTag } from "@/components/category-tag"
import { ToolIcon } from "@/components/tool-icon"
import type { Dictionary } from "@/i18n/dictionaries"
import { categoryAccent, categoryInk, categoryTint, type Tool } from "@/lib/tools"

/** 首页主推的三张大卡片 */
export function ToolCard({ tool, dict, href }: { tool: Tool; dict: Dictionary; href: string }) {
  const text = dict.tools[tool.slug]

  return (
    <Link
      href={href}
      style={{ "--tool-accent": categoryAccent(tool.category) } as React.CSSProperties}
      className="group bg-gradient-card hover-lift hover:border-border-hover hover:shadow-card-hover focus-visible:ring-ring/50 relative flex min-h-[186px] flex-col gap-3.5 overflow-hidden rounded-[18px] border p-[22px] focus-visible:ring-3 focus-visible:outline-none"
    >
      {/* 右上角那枚分类色光斑。卡片本身 overflow-hidden，所以负偏移只会露出四分之一 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-7 -right-7 size-[130px] rounded-full opacity-[0.22] blur-[28px] dark:opacity-[0.18]"
        style={{ background: "var(--tool-accent)" }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <ToolIcon
          icon={tool.icon}
          tint={categoryTint(tool.category)}
          ink={categoryInk(tool.category)}
          size="lg"
        />
        <ArrowUpRight
          aria-hidden
          className="text-muted-foreground size-[15px] shrink-0 transition-all duration-150 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-(--tool-accent)"
        />
      </div>

      <div className="relative flex flex-col gap-[7px]">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[17px] leading-tight font-semibold">{text.name}</h3>
          <CategoryTag>{dict.categories[tool.category]}</CategoryTag>
        </div>
        <p className="text-muted-foreground text-[13.5px] leading-[1.6] text-pretty">
          {text.description}
        </p>
      </div>
    </Link>
  )
}
