"use client"

import { Search } from "lucide-react"
import { useMemo, useState } from "react"

import { ToolCard } from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORY_ORDER, searchTools, type ToolCategory } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function ToolExplorer() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ToolCategory | "全部">("全部")

  const matched = useMemo(
    () => searchTools(query).filter((tool) => tool.status === "ready"),
    [query]
  )
  const visible = useMemo(
    () => (category === "全部" ? matched : matched.filter((t) => t.category === category)),
    [matched, category]
  )

  const categoryOptions = useMemo(
    () => CATEGORY_ORDER.filter((name) => matched.some((tool) => tool.category === name)),
    [matched]
  )

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((name) => ({
        name,
        items: visible.filter((tool) => tool.category === name),
      })).filter((group) => group.items.length > 0),
    [visible]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索工具，例如 jwt…"
            className="pl-9"
            aria-label="搜索工具"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["全部", ...categoryOptions] as const).map((name) => (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={category === name ? "secondary" : "ghost"}
              onClick={() => setCategory(name)}
              className={cn("text-xs", category !== name && "text-muted-foreground")}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
          没有匹配的工具。
        </p>
      ) : (
        grouped.map((group) => (
          <section key={group.name} className="space-y-3">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {group.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
