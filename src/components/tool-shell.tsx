import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { ToolIcon } from "@/components/tool-icon"
import { Badge } from "@/components/ui/badge"
import { categoryAccent, type Tool } from "@/lib/tools"

interface ToolShellProps {
  tool: Tool
  children: React.ReactNode
}

/** 所有工具页共用的标题区与容器，新增工具时直接复用 */
export function ToolShell({ tool, children }: ToolShellProps) {
  const accent = categoryAccent(tool.category)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeft className="size-4" />
        全部工具
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <ToolIcon icon={tool.icon} accent={accent} size="lg" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
            <Badge variant="outline" className="font-normal">
              {tool.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{tool.description}</p>
        </div>
      </div>

      {children}
    </div>
  )
}
