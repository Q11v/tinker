/**
 * 字典要从服务端组件传进客户端 Provider，必须是可序列化的纯数据，
 * 所以里面不能放函数。需要插值的文案写成 "第 {line} 行" 这样的占位符，
 * 由这个工具在使用处填充。
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  )
}

/**
 * 按语言的复数规则挑选文案。中文只有 other 一种形式，英文要区分 one / other，
 * 交给 Intl.PluralRules 判断，而不是自己写 count === 1。
 */
export function plural(
  forms: { one: string; other: string },
  count: number,
  bcp47: string
): string {
  const rule = new Intl.PluralRules(bcp47).select(count)
  return format(rule === "one" ? forms.one : forms.other, { count })
}
