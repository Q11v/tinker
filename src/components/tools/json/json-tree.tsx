"use client"

import { ChevronRight, Copy } from "lucide-react"
import { useState } from "react"

import { buildJsonPath } from "@/lib/json"
import { JSON_COLOR } from "@/lib/json-colors"
import { cn } from "@/lib/utils"

type PathSegment = string | number
type ValueKind = "object" | "array" | "string" | "number" | "boolean" | "null"

function valueKind(value: unknown): ValueKind {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  if (typeof value === "number") return "number"
  if (typeof value === "boolean") return "boolean"
  return typeof value === "string" ? "string" : "object"
}

const VALUE_COLOR: Partial<Record<ValueKind, string>> = {
  string: JSON_COLOR.string,
  number: JSON_COLOR.number,
  boolean: JSON_COLOR.literal,
  null: JSON_COLOR.literal,
}

function formatPrimitive(value: unknown): string {
  return typeof value === "string" ? JSON.stringify(value) : String(value)
}

export function JsonTree({
  value,
  onCopyPath,
}: {
  value: unknown
  onCopyPath: (path: string) => void
}) {
  return (
    <div className="font-mono text-[13px] leading-relaxed">
      <TreeNode segments={[]} value={value} onCopyPath={onCopyPath} />
    </div>
  )
}

function TreeNode({
  segments,
  keyLabel,
  value,
  onCopyPath,
}: {
  segments: PathSegment[]
  keyLabel?: PathSegment
  value: unknown
  onCopyPath: (path: string) => void
}) {
  const kind = valueKind(value)
  const isContainer = kind === "object" || kind === "array"
  const [collapsed, setCollapsed] = useState(false)

  const entries: [PathSegment, unknown][] = isContainer
    ? kind === "array"
      ? (value as unknown[]).map((item, index) => [index, item])
      : Object.entries(value as Record<string, unknown>)
    : []

  const [openBracket, closeBracket] = kind === "array" ? ["[", "]"] : ["{", "}"]
  const path = buildJsonPath(segments)

  return (
    <div>
      <div className="group hover:bg-muted/60 flex items-start gap-1 rounded px-1 py-0.5">
        {isContainer && entries.length > 0 ? (
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "展开" : "折叠"}
            className="text-muted-foreground mt-0.5 shrink-0"
          >
            <ChevronRight
              className={cn("size-3.5 transition-transform", !collapsed && "rotate-90")}
            />
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onCopyPath(path)}
          title={`点击复制路径 ${path}`}
          className="min-w-0 flex-1 text-left"
        >
          {keyLabel !== undefined ? (
            <>
              <span className={JSON_COLOR.key}>
                {typeof keyLabel === "number" ? keyLabel : JSON.stringify(keyLabel)}
              </span>
              <span className="text-muted-foreground">: </span>
            </>
          ) : null}

          {isContainer ? (
            <span className="text-muted-foreground">
              {openBracket}
              {entries.length > 0 ? (
                <span className="ml-1.5 text-xs">
                  {collapsed ? `… ${closeBracket} ` : ""}
                  {entries.length} 项
                </span>
              ) : (
                closeBracket
              )}
            </span>
          ) : (
            <span className={VALUE_COLOR[kind]}>{formatPrimitive(value)}</span>
          )}

          <span className="text-muted-foreground/0 group-hover:text-muted-foreground ml-2 inline-flex items-center gap-1 text-[11px] transition-colors">
            <Copy className="size-3" />
            复制路径
          </span>
        </button>
      </div>

      {isContainer && entries.length > 0 && !collapsed ? (
        <div className="border-muted-foreground/15 ml-[7px] border-l pl-3">
          {entries.map(([key, item]) => (
            <TreeNode
              key={key}
              segments={[...segments, key]}
              keyLabel={key}
              value={item}
              onCopyPath={onCopyPath}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
