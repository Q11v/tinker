import type { Locale } from "@/i18n/config"

import { zh } from "./zh"

/**
 * 以简体中文字典为类型基准。其他语言写成 `const en: Dictionary = {...}` 即可，
 * 缺键、多键、结构不一致都会在编译期报错。
 */
export type Dictionary = typeof zh

/**
 * 用动态 import 是为了让每个语言的字典各自成块，
 * 构建产物里一个页面只会带上当前语言那一份。
 */
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  zh: () => import("./zh").then((m) => m.zh),
  en: () => import("./en").then((m) => m.en),
}

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]()
}
