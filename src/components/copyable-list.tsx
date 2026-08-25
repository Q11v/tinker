"use client"

import { CopyButton } from "@/components/copy-button"

export interface CopyableListItem {
  key: string
  label?: string
  value: string
}

/** 一行一个可复制值的结果列表；带 label 时展示成"字段名 · 值"两栏，不带就是纯值列表 */
export function CopyableList({ items }: { items: CopyableListItem[] }) {
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) =>
        item.label ? (
          <li
            key={item.key}
            className="grid gap-1 px-3 py-2 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4"
          >
            <span className="text-muted-foreground text-xs">{item.label}</span>
            <div className="flex items-center justify-between gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{item.value}</code>
              <CopyButton value={item.value} size="icon" />
            </div>
          </li>
        ) : (
          <li key={item.key} className="flex items-center justify-between gap-2 px-3 py-1.5">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{item.value}</code>
            <CopyButton value={item.value} size="icon" />
          </li>
        )
      )}
    </ul>
  )
}
