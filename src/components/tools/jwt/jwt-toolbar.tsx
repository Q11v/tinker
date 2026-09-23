/** 两种模式共用的工具条外壳，尺寸与哈希页的工具条一致 */
export function JwtToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-raised flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[12px] border px-3.5 py-2.5">
      {children}
    </div>
  )
}

/** 工具条右端的描边小按钮（示例 Token / 清空） */
export const toolbarButton =
  "hover:border-border-hover text-foreground/85 hover:text-foreground rounded-[8px] border px-[11px] py-[5px] text-xs transition-colors disabled:pointer-events-none disabled:opacity-50"
