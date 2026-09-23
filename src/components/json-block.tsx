"use client"

import { useMemo } from "react"

import { JSON_COLOR } from "@/lib/json-colors"
import { cn } from "@/lib/utils"

const TOKEN_PATTERN =
  /"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g

type Kind = keyof typeof JSON_COLOR

function classify(text: string): Kind {
  if (text.startsWith('"')) return text.trimEnd().endsWith(":") ? "key" : "string"
  if (/^(true|false|null)$/.test(text)) return "literal"
  return "number"
}

/** 着色后的 span 序列，不带外层容器；JsonBlock 和需要把高亮垫在 textarea 底下的编辑器共用 */
export function JsonTokens({ value }: { value: string }) {
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

  return parts.map((part, i) => (
    <span key={i} className={JSON_COLOR[part.kind]}>
      {part.text}
    </span>
  ))
}

/** 极简 JSON 着色，够用即可，不引入额外的高亮依赖 */
export function JsonBlock({ value, className }: { value: string; className?: string }) {
  return (
    <pre
      className={cn(
        "font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-all",
        className
      )}
    >
      <JsonTokens value={value} />
    </pre>
  )
}
