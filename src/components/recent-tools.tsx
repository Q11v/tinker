"use client"

import Link from "next/link"
import { useMemo, useSyncExternalStore } from "react"

import { ToolIcon } from "@/components/tool-icon"
import { useI18n } from "@/i18n/context"
import {
  clearRecentTools,
  getRecentToolsServerSnapshot,
  getRecentToolsSnapshot,
  subscribeRecentTools,
} from "@/lib/recent-tools"
import { categoryInk, categoryTint, getTool, type Tool } from "@/lib/tools"

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
  const { dict, href } = useI18n()

  return (
    <Link
      href={href(`/tools/${tool.slug}`)}
      className="bg-muted dark:bg-surface-hover hover:border-border-hover focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-[10px] border border-transparent py-1.5 pr-3 pl-2 text-[13px] transition-colors focus-visible:ring-3 focus-visible:outline-none"
    >
      <ToolIcon
        icon={tool.icon}
        tint={categoryTint(tool.category)}
        ink={categoryInk(tool.category)}
        size="xs"
      />
      {dict.tools[tool.slug].name}
    </Link>
  )
}

/** 首页的「最近使用」条，只在没有任何筛选时出现 */
export function RecentTools() {
  const { dict } = useI18n()
  const tools = useRecentTools()

  // 首次访问没有记录时整块不渲染，不占位、不留空标题
  if (tools.length === 0) return null

  return (
    <section className="bg-surface flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[14px] border px-[18px] py-3.5">
      <h2 className="text-label-mono text-muted-foreground">{dict.explorer.recent}</h2>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <RecentToolChip key={tool.slug} tool={tool} />
        ))}
      </div>
      <button
        type="button"
        onClick={clearRecentTools}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 ml-auto rounded-md text-[13px] transition-colors focus-visible:ring-3 focus-visible:outline-none"
      >
        {dict.explorer.clearRecent}
      </button>
    </section>
  )
}
