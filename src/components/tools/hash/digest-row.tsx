"use client"

import { CopyButton } from "@/components/copy-button"

/** 一行一个算法的摘要结果：算法名定宽对齐，摘要单行省略，右端复用现成的复制按钮 */
export function DigestRow({ algorithm, value }: { algorithm: string; value: string }) {
  return (
    <li className="bg-surface flex items-center gap-4 rounded-[12px] border px-4 py-[13px]">
      <span className="text-foreground/85 w-[84px] shrink-0 font-mono text-xs font-semibold">
        {algorithm}
      </span>
      <code className="text-foreground/90 min-w-0 flex-1 truncate font-mono text-[12.5px]">
        {value}
      </code>
      <CopyButton
        value={value}
        label={`${algorithm}`}
        className="bg-muted dark:bg-surface-hover text-foreground/85 hover:text-foreground h-auto shrink-0 rounded-[8px] px-[11px] py-[5px] text-xs"
      />
    </li>
  )
}
