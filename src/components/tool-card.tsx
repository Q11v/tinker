import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { categoryAccent, type Tool } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const ready = tool.status === "ready"
  const accent = categoryAccent(tool.category)

  const content = (
    <div
      className={cn(
        "bg-card group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border p-5 transition-all",
        ready
          ? "hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg"
          : "opacity-60 select-none"
      )}
      style={
        ready
          ? ({ "--tool-accent": accent } as React.CSSProperties)
          : undefined
      }
    >
      {ready && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 ring-1 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: `0 0 0 1px color-mix(in oklch, var(--tool-accent) 45%, transparent), 0 12px 24px -12px color-mix(in oklch, var(--tool-accent) 55%, transparent)`,
          }}
        />
      )}
      <div className="relative flex items-center justify-between">
        <span
          className="flex size-9 items-center justify-center rounded-lg border transition-colors"
          style={{
            backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="size-4" />
        </span>
        {ready ? (
          <ArrowUpRight className="text-muted-foreground size-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-(--tool-accent)" />
        ) : (
          <Badge variant="outline" className="text-[11px] font-normal">
            敬请期待
          </Badge>
        )}
      </div>
      <div className="relative space-y-1">
        <h3 className="leading-none font-medium">{tool.name}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {tool.description}
        </p>
      </div>
    </div>
  )

  if (!ready) return content

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {content}
    </Link>
  )
}
