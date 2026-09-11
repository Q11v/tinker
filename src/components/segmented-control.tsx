"use client"

import { cn } from "@/lib/utils"

/** 工具条里的分段控件比面板标题里的大一号，两种尺寸的内外圆角都不一样 */
const SIZES = {
  sm: { track: "gap-0.5 rounded-md p-0.5 text-xs", item: "rounded px-2 py-1" },
  md: {
    track: "gap-0.5 rounded-[9px] p-[3px] text-[12.5px]",
    item: "rounded-[7px] px-3.5 py-[5px]",
  },
} as const

/** 卡片标题栏与工具条里常见的小型分段切换按钮组，比如 文本/文件、格式化/压缩这类二选一场景 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  size?: keyof typeof SIZES
  /** 读屏用的组名，比如「来源」「编码」 */
  label?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("bg-surface-sunken flex items-center", SIZES[size].track)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "transition-colors",
            SIZES[size].item,
            value === option.value
              ? "text-foreground shadow-segment bg-white font-medium dark:bg-white/14 dark:shadow-none"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
