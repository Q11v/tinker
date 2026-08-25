import type { Metadata } from "next"

import { isLocale, localeAlternates } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionaries"
import type { ToolSlug } from "@/lib/tools"

/** 工具页的 title/description 直接取当前语言字典里的工具文案 */
export async function toolMetadata(slug: ToolSlug, lang: string): Promise<Metadata> {
  if (!isLocale(lang)) return {}
  const dict = await getDictionary(lang)

  return {
    title: dict.tools[slug].name,
    description: dict.tools[slug].description,
    alternates: { languages: localeAlternates(`/tools/${slug}`) },
  }
}
