"use client"

import { Search } from "lucide-react"
import type { RefObject } from "react"

import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { readyTools, type ToolCategory } from "@/lib/tools"
import { cn } from "@/lib/utils"

interface SearchHeroProps {
  query: string
  onQueryChange: (value: string) => void
  category: ToolCategory | "all"
  onCategoryChange: (value: ToolCategory | "all") => void
  /** 固定的一整排分类，顺序不随搜索结果变化 */
  categories: ToolCategory[]
  /** 当前搜索词下每个分类还剩几个工具，"all" 是总数 */
  counts: Record<string, number>
  resultCount: number
  inputRef: RefObject<HTMLInputElement | null>
  /** 回车：直接打开第一个结果 */
  onSubmit: () => void
  /** Esc：清空搜索词并回到「全部」 */
  onEscape: () => void
}

export function SearchHero({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  counts,
  resultCount,
  inputRef,
  onSubmit,
  onEscape,
}: SearchHeroProps) {
  const { dict } = useI18n()

  return (
    <section className="relative flex flex-col items-center gap-[22px] overflow-hidden px-4 pt-10 pb-5 sm:px-7 sm:pt-[52px]">
      <div
        aria-hidden
        className="bg-hero-glow animate-blob pointer-events-none absolute -top-[170px] left-1/2 -z-10 h-[330px] w-[860px] max-w-[150vw] -translate-x-1/2 rounded-[50%] blur-[11px]"
      />

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-eyebrow text-accent-cool">{dict.explorer.eyebrow}</span>
        <h1 className="text-gradient-hero text-[32px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[52px]">
          {dict.home.title}
        </h1>
        <p className="text-muted-foreground text-[15px] text-pretty sm:text-base">
          {format(dict.home.subtitle, { count: readyTools.length })}
        </p>
      </div>

      {/*
        整条是一个 label，点哪儿都能聚焦到里面那个 input。
        聚焦态画在外框上：浅色模式是品牌紫描边 + 一层薄光晕，深色模式只把边提亮 ——
        深色底上再加紫光晕会和 hero 的光斑打在一起。
      */}
      <label className="bg-surface-raised shadow-search focus-within:border-ring focus-within:ring-ring/12 dark:focus-within:border-input dark:focus-within:ring-0 flex h-14 w-full max-w-[720px] items-center gap-3 rounded-[14px] border px-[18px] transition-colors focus-within:ring-3">
        <Search className="text-primary dark:text-accent-cool size-4 shrink-0" strokeWidth={1.75} />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSubmit()
            if (event.key === "Escape") onEscape()
          }}
          placeholder={dict.explorer.searchPlaceholder}
          aria-label={dict.explorer.searchLabel}
          spellCheck={false}
          autoComplete="off"
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
        {query.trim() ? (
          <span className="text-muted-foreground shrink-0 text-[13px] max-sm:hidden">
            {format(dict.explorer.resultCount, { count: resultCount })}
          </span>
        ) : (
          <span className="text-muted-foreground shrink-0 rounded-[6px] border px-[7px] py-[3px] font-mono text-[11px] max-sm:hidden">
            Enter
          </span>
        )}
      </label>

      {/* 窄屏放不下六枚胶囊，改成横向滚动，而不是折行把 hero 撑高 */}
      <div className="flex w-full justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
        {(["all", ...categories] as const).map((name) => {
          const active = category === name
          // 选中项永远保持可点，否则又会失去退出筛选的入口
          const empty = !active && name !== "all" && !counts[name]

          return (
            <button
              key={name}
              type="button"
              aria-pressed={active}
              disabled={empty}
              onClick={() => onCategoryChange(name)}
              className={cn(
                "focus-visible:ring-ring/50 shrink-0 rounded-full px-3.5 py-[7px] text-[13px] transition-colors focus-visible:ring-3 focus-visible:outline-none",
                active
                  ? "bg-foreground text-background font-medium"
                  : "bg-surface text-foreground/80 hover:border-border-hover hover:text-foreground border",
                empty && "pointer-events-none opacity-40"
              )}
            >
              {name === "all" ? dict.explorer.all : dict.categories[name]}
              <span className="ml-1.5 opacity-60">{counts[name] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
