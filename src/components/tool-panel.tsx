import { cn } from "@/lib/utils"

const ACCENT_DOT = {
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
} as const

export type PanelAccent = keyof typeof ACCENT_DOT

/** 各工具子面板共用的卡片外壳：标题前的色点用来做分区强调色 */
export function Panel({
  accent,
  title,
  hint,
  action,
  footer,
  children,
}: {
  accent: PanelAccent
  title: string
  hint: string
  action?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card flex flex-col rounded-xl border">
      {/*
        窄屏上 hint 可能有四五十个字，action 里又常常挂着两个 SegmentedControl 加一个复制按钮。
        没有 min-w-0 的话 flex 子项不会收缩到内容宽度以下，标题区会把 action 挤出面板；
        flex-wrap 让 action 在实在放不下时掉到第二行，而不是横向溢出。
      */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className={cn("mt-1.5 size-1.5 shrink-0 self-start rounded-full", ACCENT_DOT[accent])}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-muted-foreground text-xs">{hint}</p>
          </div>
        </div>
        {action ? <div className="ml-auto shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
      {footer ? (
        <div className="text-muted-foreground mt-auto border-t px-4 py-2 text-xs">{footer}</div>
      ) : null}
    </div>
  )
}
