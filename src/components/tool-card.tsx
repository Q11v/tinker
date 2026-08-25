import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ToolIcon } from "@/components/tool-icon"
import { Badge } from "@/components/ui/badge"
import { categoryAccent, type Tool } from "@/lib/tools"

export function ToolCard({ tool }: { tool: Tool }) {
  const accent = categoryAccent(tool.category)

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div
        className="bg-card group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
        style={{ "--tool-accent": accent } as React.CSSProperties}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 0 1px color-mix(in oklch, var(--tool-accent) 45%, transparent), 0 12px 24px -12px color-mix(in oklch, var(--tool-accent) 55%, transparent)`,
          }}
        />
        <div className="relative flex items-center justify-between">
          <ToolIcon icon={tool.icon} accent={accent} />
          <ArrowUpRight className="text-muted-foreground size-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--tool-accent)" />
        </div>
        <div className="relative space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="leading-none font-medium">{tool.name}</h3>
            <Badge variant="outline" className="text-[10px] font-normal">
              {tool.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{tool.description}</p>
        </div>
      </div>
    </Link>
  )
}
