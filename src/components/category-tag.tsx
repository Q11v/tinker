import { cn } from "@/lib/utils"

/** 卡片标题与工具页页头后面跟的那枚等宽小标签，只写分类名 */
export function CategoryTag({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-muted-foreground shrink-0 rounded-[5px] border px-[7px] py-0.5 font-mono text-[10px] leading-4 tracking-[0.08em]",
        className
      )}
    >
      {children}
    </span>
  )
}
