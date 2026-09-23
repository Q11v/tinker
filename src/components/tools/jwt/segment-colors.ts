/**
 * Token 三段的配色，与设计稿一致：header 紫、payload 青、signature 琥珀。
 * 直接借分类色的 1 / 2 / 3 号槽 —— 深色模式它们就是设计稿的那三个色，
 * 浅色模式 --tool-ink-N 已经压深到能站在白底上，不必再调一套。
 */
export const SEGMENT_COLOR = {
  header: { text: "text-(color:--tool-ink-1)", dot: "bg-chart-1" },
  payload: { text: "text-(color:--tool-ink-2)", dot: "bg-chart-2" },
  signature: { text: "text-(color:--tool-ink-3)", dot: "bg-chart-3" },
} as const

export type Segment = keyof typeof SEGMENT_COLOR

export const SEGMENTS: Segment[] = ["header", "payload", "signature"]
