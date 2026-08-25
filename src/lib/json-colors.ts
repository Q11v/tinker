/** JSON 值按类型着色的配色表，JsonBlock（文本高亮）和 JsonTree（树形浏览）共用，避免各写一份走偏 */
export const JSON_COLOR = {
  key: "text-violet-600 dark:text-violet-400",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-amber-600 dark:text-amber-400",
  literal: "text-rose-600 dark:text-rose-400",
  plain: "text-muted-foreground",
} as const
