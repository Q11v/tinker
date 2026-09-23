import { SEGMENT_COLOR, SEGMENTS } from "@/components/tools/jwt/segment-colors"
import { cn } from "@/lib/utils"

/**
 * 按 header / payload / signature 给 Token 着色，原样保留每一个字符（包括空白），
 * 这样既能单独展示，也能垫在 HighlightedTextarea 底下与原文逐字对齐。
 * 多出来的第 4 段起用中性色，让「段数不对」一眼可见。
 */
export function TokenSegments({ value }: { value: string }) {
  const parts = value.split(".")

  return parts.map((part, index) => (
    <span key={index}>
      {index > 0 ? <span className="text-muted-foreground">.</span> : null}
      <span
        className={
          index < SEGMENTS.length ? SEGMENT_COLOR[SEGMENTS[index]].text : "text-foreground"
        }
      >
        {part}
      </span>
    </span>
  ))
}

/** 只读的着色 Token，签发结果用 */
export function TokenPreview({ token, className }: { token: string; className?: string }) {
  return (
    <pre
      className={cn(
        "m-0 font-mono text-[12.5px] leading-[1.85] whitespace-pre-wrap break-all",
        className
      )}
    >
      <TokenSegments value={token} />
    </pre>
  )
}
