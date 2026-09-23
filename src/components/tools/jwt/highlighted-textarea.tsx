"use client"

import { cn } from "@/lib/utils"

/**
 * 编辑时也保持着色的文本框：textarea 文字透明、只留光标，底下垫一层排版完全相同的着色副本。
 * 两层叠在同一个 grid 格子里，格子高度由着色层撑开，所以文本框跟着内容自动长高，不会出现内滚动条。
 *
 * 两层必须共用同一套字体、字号、行高、内边距与换行规则（className 同时作用于两层），
 * 差一个像素，光标就会和看到的字对不上。
 */
export function HighlightedTextarea({
  id,
  value,
  onChange,
  highlight,
  placeholder,
  className,
  invalid,
  label,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  /** 与 value 逐字对应的着色内容 */
  highlight: React.ReactNode
  placeholder?: string
  /** 字体、字号、行高、内边距，两层共用 */
  className?: string
  invalid?: boolean
  label?: string
}) {
  const layer = cn("col-start-1 row-start-1 m-0 font-mono whitespace-pre-wrap break-all", className)

  return (
    <div className="grid">
      <div aria-hidden className={cn(layer, "pointer-events-none")}>
        {highlight}
        {/* textarea 以换行结尾时会多出一个空行给光标，着色层要补上同样的一行，否则高度少一截 */}
        {"\n"}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        rows={1}
        className={cn(
          layer,
          "caret-foreground placeholder:text-muted-foreground selection:bg-primary/25 resize-none overflow-hidden bg-transparent text-transparent outline-none"
        )}
      />
    </div>
  )
}
