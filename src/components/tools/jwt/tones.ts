/**
 * 结论卡片、异常卡片与检查项共用的四种语气。
 * 红 / 琥珀 / 绿直接借分类色的 4 / 3 / 5 号槽，和设计稿的配色一致，深浅模式也都已调好。
 */
export const TONE = {
  bad: {
    box: "border-chart-4/35 bg-chart-4/8",
    dot: "bg-chart-4",
    ink: "text-(color:--tool-ink-4)",
    chip: "bg-chart-4/18 text-(color:--tool-ink-4)",
  },
  warn: {
    box: "border-chart-3/40 bg-chart-3/8",
    dot: "bg-chart-3",
    ink: "text-(color:--tool-ink-3)",
    chip: "bg-chart-3/18 text-(color:--tool-ink-3)",
  },
  good: {
    box: "border-chart-5/35 bg-chart-5/8",
    dot: "bg-chart-5",
    ink: "text-(color:--tool-ink-5)",
    chip: "bg-chart-5/18 text-(color:--tool-ink-5)",
  },
  neutral: {
    box: "bg-surface",
    dot: "bg-muted-foreground/60",
    ink: "text-foreground",
    chip: "bg-muted text-muted-foreground",
  },
} as const

export type Tone = keyof typeof TONE
