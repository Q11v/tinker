"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"

const TOKEN_PATTERN =
  /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g

type Kind = "key" | "string" | "number" | "literal" | "plain"

const COLORS: Record<Kind, string> = {
  key: "text-violet-600 dark:text-violet-400",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-amber-600 dark:text-amber-400",
  literal: "text-rose-600 dark:text-rose-400",
  plain: "text-muted-foreground",
}

function classify(text: string): Kind {
  if (text.startsWith('"')) return text.trimEnd().endsWith(":") ? "key" : "string"
  if (/^(true|false|null)$/.test(text)) return "literal"
  return "number"
}

/** 极简 JSON 着色，够用即可，不引入额外的高亮依赖 */
export function JsonBlock({ value, className }: { value: string; className?: string }) {
  const parts = useMemo(() => {
    const result: { text: string; kind: Kind }[] = []
    let index = 0
    for (const match of value.matchAll(TOKEN_PATTERN)) {
      const start = match.index ?? 0
      if (start > index) result.push({ text: value.slice(index, start), kind: "plain" })
      result.push({ text: match[0], kind: classify(match[0]) })
      index = start + match[0].length
    }
    if (index < value.length) result.push({ text: value.slice(index), kind: "plain" })
    return result
  }, [value])

  return (
    <pre
      className={cn(
        "font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all",
        className
      )}
    >
      {parts.map((part, i) => (
        <span key={i} className={COLORS[part.kind]}>
          {part.text}
        </span>
      ))}
    </pre>
  )
}
