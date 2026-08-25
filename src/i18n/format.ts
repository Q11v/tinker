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
