import { SEGMENT_COLOR, type Segment } from "@/components/tools/jwt/segment-colors"
import { cn } from "@/lib/utils"

/**
 * JWT 页的面板：标题栏只有一枚色块 + 等宽大写标签 + 右端动作，比通用 Panel 少一行说明文字。
 * 色块和标签颜色跟着 Token 的分段走，没有分段归属的面板（结果、Token 本身）用中性色。
 */
export function JwtCard({
  segment,
  label,
  meta,
  action,
  className,
  children,
}: {
  segment?: Segment
  label: string
  /** 紧跟标签的附加内容，比如 Token 卡片的三段图例 */
  meta?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const color = segment ? SEGMENT_COLOR[segment] : null

  return (
    <section
      className={cn(
        "bg-surface dark:bg-surface-sunken min-w-0 overflow-hidden rounded-[16px] border",
        className
      )}
    >
      <div className="flex min-h-11 flex-wrap items-center gap-x-3.5 gap-y-1.5 border-b px-4 py-2">
        {/* 不走 cn：tailwind-merge 会把自定义的 text-label-mono 当成颜色类，和后面的字色互相吞掉 */}
        <h3
          className={`text-label-mono flex items-center gap-2.5 tracking-[0.1em] ${
            color ? color.text : "text-muted-foreground"
          }`}
        >
          {color ? <span className={cn("size-[7px] rounded-[2px]", color.dot)} /> : null}
          {label}
        </h3>
        {meta}
        {action ? <div className="ml-auto flex items-center gap-1">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

/** 标题栏里的文字按钮：设计稿里是一段冷色小字，不是带框的按钮 */
export const cardAction =
  "text-accent-cool hover:text-accent-cool hover:bg-surface-hover h-auto rounded-[6px] px-1.5 py-0.5 text-xs font-normal [&_svg]:hidden"
