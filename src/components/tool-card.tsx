import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ToolIcon } from "@/components/tool-icon"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/i18n/dictionaries"
import { categoryAccent, type Tool } from "@/lib/tools"

export function ToolCard({ tool, dict, href }: { tool: Tool; dict: Dictionary; href: string }) {
  const accent = categoryAccent(tool.category)
  const text = dict.tools[tool.slug]

  return (
    <Link
      href={href}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div
        className="bg-card group relative flex h-full flex-col overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg sm:p-5"
        style={{ "--tool-accent": accent } as React.CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 0 1px color-mix(in oklch, var(--tool-accent) 45%, transparent), 0 12px 24px -12px color-mix(in oklch, var(--tool-accent) 55%, transparent)`,
          }}
        />

        {/*
          窄屏：图标与标题并排，省掉图标独占的那一行。
          sm 以上换回 block，图标重新独占一行，桌面端布局保持原样。
        */}
        <div className="relative flex items-start gap-3 sm:block">
          <ToolIcon icon={tool.icon} accent={accent} className="sm:mb-3" />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="leading-tight font-medium">{text.name}</h3>
              <Badge variant="outline" className="text-[10px] font-normal">
                {dict.categories[tool.category]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{text.description}</p>
          </div>

          {/*
            窄屏当作行内的第三个 flex 项，跟着标题走；
            sm 以上绝对定位回图标那一行的右端 —— top-2.5 正好是 (图标 36px − 箭头 16px) / 2，
            和改版前居中对齐的位置一致。
          */}
          <ArrowUpRight
            aria-hidden
            className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--tool-accent) sm:absolute sm:top-2.5 sm:right-0 sm:mt-0"
          />
        </div>
      </div>
    </Link>
  )
}
