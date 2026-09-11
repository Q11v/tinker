"use client"

import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import type { HashAlgorithm } from "@/lib/hash"
import { cn } from "@/lib/utils"

/**
 * 粘一个期望的摘要，自动说出它是哪个算法的结果。
 * 设计稿右端画的是一枚「比对」按钮，但同一张稿的 placeholder 写着「自动比对」——
 * 既然是输入即比，就把那个位置留给结论，省掉一次没有意义的点击。
 */
export function VerifyBar({
  value,
  onChange,
  match,
}: {
  value: string
  onChange: (value: string) => void
  /** 命中的算法，null 表示填了但对不上 */
  match: HashAlgorithm | null
}) {
  const dict = useDict()
  const filled = value.trim().length > 0

  return (
    <div className="bg-muted dark:bg-surface-raised flex items-center gap-3 rounded-[12px] px-4 py-[13px]">
      <span className="text-label-mono text-muted-foreground shrink-0">
        {dict.hashTool.verifyLabel}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={dict.hashTool.verifyPlaceholder}
        aria-label={dict.hashTool.verifyLabel}
        spellCheck={false}
        autoComplete="off"
        // 16px 起步，iOS Safari 聚焦小字号输入框会把整页放大且不缩回
        className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent font-mono text-base outline-none md:text-[12.5px]"
      />
      <span
        aria-live="polite"
        className={cn(
          "shrink-0 rounded-[8px] border px-[11px] py-[5px] text-xs",
          !filled && "text-muted-foreground",
          filled &&
            match &&
            "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
          filled && !match && "border-destructive/30 bg-destructive/10 text-destructive"
        )}
      >
        {!filled
          ? dict.hashTool.verifyIdle
          : match
            ? format(dict.hashTool.verifyMatch, { algorithm: match })
            : dict.hashTool.verifyMismatch}
      </span>
    </div>
  )
}
