"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { RecentTools } from "@/components/recent-tools"
import { ToolCard } from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n/context"
import { CATEGORY_ORDER, readyTools, searchTools, type Tool, type ToolCategory } from "@/lib/tools"
import { cn } from "@/lib/utils"

/**
 * 分类栏是固定的一整排，不随搜索结果增删。
 * 否则选中的分类会在输入时从 DOM 里消失，而筛选状态还留着，
 * 用户就卡在一个看不见任何激活筛选器的空结果里。
 */
const CATEGORIES: ToolCategory[] = CATEGORY_ORDER.filter((category) =>
  readyTools.some((tool) => tool.category === category)
)

export function ToolExplorer() {
  const { dict, href } = useI18n()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ToolCategory | "all">("all")

  const textOf = useMemo(
    () => (tool: Tool) => ({
      name: dict.tools[tool.slug].name,
      description: dict.tools[tool.slug].description,
      category: dict.categories[tool.category],
      keywords: dict.tools[tool.slug].keywords,
    }),
    [dict]
  )

  const matched = useMemo(
    () => searchTools(query, textOf).filter((tool) => tool.status === "ready"),
    [query, textOf]
  )
  const visible = useMemo(
    () => (category === "all" ? matched : matched.filter((t) => t.category === category)),
    [matched, category]
  )

  // 只有在没有任何筛选时才露出「最近使用」，否则会干扰搜索结果的阅读
  const filtering = query.trim().length > 0 || category !== "all"

  // 当前搜索词下还有结果的分类，其余的置灰，避免点进去只看到空状态
  const nonEmpty = useMemo(() => new Set(matched.map((tool) => tool.category)), [matched])

  function reset() {
    setQuery("")
    setCategory("all")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dict.explorer.searchPlaceholder}
            className="pl-9"
            aria-label={dict.explorer.searchLabel}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...CATEGORIES] as const).map((name) => {
            const active = category === name
            // 选中项永远保持可点，否则又会失去退出筛选的入口
            const empty = !active && name !== "all" && !nonEmpty.has(name)

            return (
              <Button
                key={name}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                aria-pressed={active}
                disabled={empty}
                onClick={() => setCategory(name)}
                className={cn("text-xs", !active && "text-muted-foreground")}
              >
                {name === "all" ? dict.explorer.all : dict.categories[name]}
              </Button>
            )
          })}
        </div>
      </div>

      {filtering ? null : <RecentTools />}

      {visible.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-sm">
          <p>{dict.explorer.empty}</p>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            {dict.explorer.clearFilters}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} dict={dict} href={href(`/tools/${tool.slug}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
