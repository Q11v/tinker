import { cn } from "@/lib/utils"

const ACCENT_DOT = {
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
} as const

export type PanelAccent = keyof typeof ACCENT_DOT

/** 各工具子面板共用的卡片外壳：标题前的色点用来呼应 token 三段的着色 */
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
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", ACCENT_DOT[accent])} />
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-muted-foreground text-xs">{hint}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
      {footer ? (
        <div className="text-muted-foreground mt-auto border-t px-4 py-2 text-xs">{footer}</div>
      ) : null}
    </div>
  )
}
