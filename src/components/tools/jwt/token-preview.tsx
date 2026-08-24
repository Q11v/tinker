"use client"

import { cn } from "@/lib/utils"

/** 按 jwt.io 的习惯给三段着色：header / payload / signature */
export function TokenPreview({ token, className }: { token: string; className?: string }) {
  const parts = token.trim().split(".")
  if (parts.length !== 3) return null

  return (
    <div
      className={cn(
        "bg-muted/50 rounded-lg border p-3 font-mono text-[13px] leading-relaxed break-all",
        className
      )}
    >
      <span className="text-rose-600 dark:text-rose-400">{parts[0]}</span>
      <span className="text-muted-foreground">.</span>
      <span className="text-violet-600 dark:text-violet-400">{parts[1]}</span>
      <span className="text-muted-foreground">.</span>
      <span className="text-sky-600 dark:text-sky-400">{parts[2] || "（无签名）"}</span>
    </div>
  )
}
