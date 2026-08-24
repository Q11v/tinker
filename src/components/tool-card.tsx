import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Tool } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const ready = tool.status === "ready"

  const content = (
    <div
      className={cn(
        "bg-card group relative flex h-full flex-col gap-3 rounded-xl border p-5 transition-all",
        ready
          ? "hover:border-foreground/20 hover:shadow-md"
          : "opacity-60 select-none"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="bg-muted text-foreground flex size-9 items-center justify-center rounded-lg border">
          <Icon className="size-4" />
        </span>
        {ready ? (
          <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
        ) : (
          <Badge variant="outline" className="text-[11px] font-normal">
            敬请期待
          </Badge>
        )}
      </div>
      <div className="space-y-1">
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
