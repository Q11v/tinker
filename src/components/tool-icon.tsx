import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** 首页卡片与工具页标题区共用的图标徽标，按分类主题色染色 */
export function ToolIcon({
  icon: Icon,
  accent,
  size = "sm",
}: {
  icon: LucideIcon
  accent: string
  size?: "sm" | "lg"
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border",
        size === "sm" ? "size-9 rounded-lg" : "size-11 rounded-xl"
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
        borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
        color: accent,
      }}
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  )
}
