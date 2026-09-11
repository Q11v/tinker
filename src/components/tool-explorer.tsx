"use client"

import { CornerDownLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { PlannedTools } from "@/components/planned-tools"
import { RecentTools } from "@/components/recent-tools"
import { SearchHero } from "@/components/search-hero"
import { ToolCard } from "@/components/tool-card"
import { ToolEmptyState } from "@/components/tool-empty-state"
import { ToolRow } from "@/components/tool-row"
import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { consumeSearchFocus, subscribeSearchFocus } from "@/lib/search-focus"
import {
  CATEGORY_ORDER,
  featuredTools,
  matchReason,
  readyTools,
  restTools,
  searchTools,
  type Tool,
  type ToolCategory,
} from "@/lib/tools"

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
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<ToolCategory | "all">("all")
  const inputRef = useRef<HTMLInputElement>(null)

  // 顶栏的 ⌘K：首页已挂载时是一个事件，从工具页跳回来时是挂载后补上的那一次
  useEffect(() => {
    function focus() {
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    const unsubscribe = subscribeSearchFocus(focus)
    if (consumeSearchFocus()) focus()
    return unsubscribe
  }, [])

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

  // 只有在没有任何筛选时才露出「最近使用」「主推卡片」「规划中」，否则会干扰结果的阅读
  const filtering = query.trim().length > 0 || category !== "all"

  // 胶囊上的数量跟着搜索词走；数量为 0 的分类顺便置灰，避免点进去只看到空状态
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: matched.length }
    for (const name of CATEGORIES) {
      result[name] = matched.filter((tool) => tool.category === name).length
    }
    return result
  }, [matched])

  function reset() {
    setQuery("")
    setCategory("all")
    inputRef.current?.focus()
  }

  // 回车直接打开第一个结果，省掉一次鼠标移动
  function openFirst() {
    const first = visible[0]
    if (first) router.push(href(`/tools/${first.slug}`))
  }

  const reasonLabel = (tool: Tool) => {
    const reason = matchReason(query, tool, textOf(tool))
    if (!reason) return undefined
    if (reason.kind === "keyword") {
      return format(dict.explorer.match.keyword, { keyword: reason.keyword })
    }
    return dict.explorer.match[reason.kind]
  }

  return (
    <>
      <SearchHero
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={CATEGORIES}
        counts={counts}
        resultCount={visible.length}
        inputRef={inputRef}
        onSubmit={openFirst}
        onEscape={reset}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-[26px] px-4 pt-2 pb-7 sm:px-7 sm:pb-[28px]">
        {filtering ? null : <RecentTools />}

        {visible.length === 0 ? (
          <ToolEmptyState query={query} onReset={reset} />
        ) : filtering ? (
          <div className="grid gap-2.5 md:grid-cols-2">
            {visible.map((tool) => (
              <ToolRow
                key={tool.slug}
                tool={tool}
                dict={dict}
                href={href(`/tools/${tool.slug}`)}
                note={reasonLabel(tool)}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {featuredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  dict={dict}
                  href={href(`/tools/${tool.slug}`)}
                />
              ))}
            </div>
            <div className="grid gap-2.5 md:grid-cols-2">
              {restTools.map((tool) => (
                <ToolRow
                  key={tool.slug}
                  tool={tool}
                  dict={dict}
                  href={href(`/tools/${tool.slug}`)}
                />
              ))}
            </div>
          </>
        )}

        {query.trim() && visible.length > 0 ? (
          <p className="text-foreground/85 bg-muted dark:bg-transparent dark:border-dashed dark:border flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-[13px]">
            <CornerDownLeft className="text-accent-cool size-3.5 shrink-0" strokeWidth={2} />
            {format(dict.explorer.enterHint, { name: dict.tools[visible[0].slug].name })}
          </p>
        ) : null}

        {filtering ? null : <PlannedTools />}
      </div>
    </>
  )
}
