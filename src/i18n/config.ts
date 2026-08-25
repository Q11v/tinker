/**
 * 新增一门语言只需要三步：
 * 1. 在 LOCALES 里加上代码
 * 2. 在 LOCALE_LABELS / LOCALE_HTML_LANG 里补上对应项
 * 3. 照着 dictionaries/zh.ts 写一份同构的字典，在 dictionaries/index.ts 里注册
 * 类型系统会把漏掉的地方全部报出来。
 */
export const LOCALES = ["zh", "en"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "zh"

/** 语言切换器里显示的名字，用该语言自己的写法 */
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "简体中文",
  en: "English",
}

/** <html lang> 用的 BCP 47 标签，和路由用的短代码不是一回事 */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/**
 * 去掉路径开头的语言前缀，拿到语言无关的那一截。
 * "/zh/tools/jwt" -> "/tools/jwt"，"/zh" -> ""，没有前缀时原样返回。
 */
export function stripLocale(pathname: string): string {
  const match = /^\/([^/]+)(?=\/|$)/.exec(pathname)
  const rest = match && isLocale(match[1]) ? pathname.slice(match[0].length) : pathname
  // 归一化成 ""，否则 localePath 会拼出 "/en/" 这种多一个斜杠的地址
  return rest === "/" ? "" : rest
}

/** 给定语言下某条路径的完整地址，例如 localePath("zh", "/tools/jwt") -> "/zh/tools/jwt" */
export function localePath(locale: Locale, path = ""): string {
  return path ? `/${locale}${path}` : `/${locale}`
}

/**
 * 各语言版本的互相声明（hreflang）。搜索引擎靠它把两个语言认成同一页面的不同版本，
 * 而不是内容重复的两个页面。
 */
export function localeAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of LOCALES) languages[LOCALE_HTML_LANG[locale]] = localePath(locale, path)
  languages["x-default"] = localePath(DEFAULT_LOCALE, path)
  return languages
}
