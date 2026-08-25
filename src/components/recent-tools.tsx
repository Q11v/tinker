"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"

import { ToolIcon } from "@/components/tool-icon"
import { Button } from "@/components/ui/button"
import {
  clearRecentTools,
  getRecentToolsServerSnapshot,
  getRecentToolsSnapshot,
  subscribeRecentTools,
} from "@/lib/recent-tools"
import { categoryAccent, getTool, type Tool } from "@/lib/tools"

function useRecentTools(): Tool[] {
  const slugs = useSyncExternalStore(
    subscribeRecentTools,
    getRecentToolsSnapshot,
    getRecentToolsServerSnapshot
  )

  // 顺手过滤掉已下线或还没做完的工具，避免留下死链接
  return useMemo(
    () => slugs.map(getTool).filter((tool): tool is Tool => tool?.status === "ready"),
    [slugs]
  )
}

function RecentToolChip({ tool }: { tool: Tool }) {
  const accent = categoryAccent(tool.category)

  return (
    <Link
      href={`/tools/${tool.slug}`}
      style={{ "--tool-accent": accent } as React.CSSProperties}
      className="bg-card focus-visible:ring-ring hover:border-(--tool-accent) inline-flex items-center gap-2 rounded-lg border py-1.5 pr-3 pl-1.5 text-sm transition-colors hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ToolIcon icon={tool.icon} accent={accent} size="xs" />
      {tool.name}
    </Link>
  )
}

export function RecentTools() {
  const tools = useRecentTools()

  // 首次访问没有记录时整块不渲染，不占位、不留空标题
  if (tools.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          最近使用
        </h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clearRecentTools}
          className="text-muted-foreground hover:text-foreground -mr-2 h-7 text-xs"
        >
          清除
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <RecentToolChip key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  )
}
