"use client"

import Link from "next/link"

import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { ISSUES_URL } from "@/lib/links"
import { getTool, type ToolSlug } from "@/lib/tools"

/** 搜不到时推荐的三个工具，固定这几个：覆盖面最广，日常最常被找 */
const SUGGESTED: ToolSlug[] = ["json", "url", "hash"]

const ACTION = "rounded-[10px] px-3.5 py-2 text-[13px] transition-colors"

export function ToolEmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  const { dict, href } = useI18n()
  const trimmed = query.trim()

  return (
    <div className="flex flex-col items-center gap-3.5 rounded-[16px] border border-dashed px-5 py-[34px] text-center">
      <span className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-[14px] font-mono text-base">
        ∅
      </span>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[15px] font-semibold">
          {trimmed
            ? format(dict.explorer.emptyTitle, { query: trimmed })
            : dict.explorer.emptyTitleCategory}
        </p>
        <p className="text-muted-foreground max-w-[320px] text-[13px] text-pretty">
          {dict.explorer.emptyBody}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className={`bg-primary text-primary-foreground hover:bg-primary/85 dark:bg-foreground dark:text-background dark:hover:bg-foreground/85 font-medium ${ACTION}`}
        >
          {dict.explorer.clearFilters}
        </button>
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noreferrer"
          className={`hover:border-border-hover border ${ACTION}`}
        >
          {dict.explorer.reportIssue}
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <span className="text-muted-foreground text-[12.5px]">{dict.explorer.suggestions}</span>
        {SUGGESTED.map((slug) => {
          const tool = getTool(slug)
          if (!tool) return null
          return (
            <Link
              key={slug}
              href={href(`/tools/${slug}`)}
              className="bg-muted dark:bg-surface-hover hover:border-border-hover rounded-full border border-transparent px-3 py-1.5 text-[12.5px] transition-colors"
            >
              {dict.tools[slug].name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
