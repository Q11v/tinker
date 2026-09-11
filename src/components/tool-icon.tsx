import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** 设计稿里的三种图标块：胶囊里的 20px、紧凑行的 34px、卡片与页头的 46px */
const SIZES = {
  xs: { box: "size-5 rounded-[6px]", icon: "size-3" },
  sm: { box: "size-[34px] rounded-[10px]", icon: "size-5" },
  lg: { box: "size-[46px] rounded-[14px]", icon: "size-[22px]" },
} as const

/**
 * 首页卡片、紧凑行与工具页页头共用的图标徽标。
 * 底色与字色分开传：深色模式下字色就是分类强调色，浅色模式下要压深，
 * 这个差异写在 globals.css 的 --tool-tint-N / --tool-ink-N 里，组件只负责套用。
 */
export function ToolIcon({
  icon: Icon,
  tint,
  ink,
  size = "sm",
  className,
}: {
  icon: LucideIcon
  tint: string
  ink: string
  size?: keyof typeof SIZES
  /** 供调用方补外边距等布局相关的类名 */
  className?: string
}) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center", SIZES[size].box, className)}
      style={{ backgroundColor: tint, color: ink }}
    >
      <Icon className={SIZES[size].icon} strokeWidth={1.75} />
    </span>
  )
}
