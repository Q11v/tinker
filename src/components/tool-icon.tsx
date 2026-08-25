import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** 首页卡片与工具页标题区共用的图标徽标，按分类主题色染色 */
export function ToolIcon({
  icon: Icon,
  accent,
  size = "sm",
  className,
}: {
  icon: LucideIcon
  accent: string
  size?: "xs" | "sm" | "lg"
  /** 供调用方补外边距等布局相关的类名 */
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border",
        size === "xs" && "size-7 rounded-md",
        size === "sm" && "size-9 rounded-lg",
        size === "lg" && "size-11 rounded-xl",
        className
      )}
      style={{
        backgroundColor: `color-mix(in oklch, ${accent} 14%, transparent)`,
        borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
        color: accent,
      }}
    >
      <Icon
        className={cn(
          size === "xs" && "size-3.5",
          size === "sm" && "size-4",
          size === "lg" && "size-5"
        )}
      />
    </span>
  )
}
