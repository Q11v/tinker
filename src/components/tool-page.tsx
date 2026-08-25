import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n/dictionaries"
import { getTool, type ToolSlug } from "@/lib/tools"

/**
 * 每个工具页都长得一样：校验语言、取字典、套 ToolShell。
 * 抽出来之后新增一个工具只剩两行样板。
 */
export async function ToolPage({
  slug,
  lang,
  children,
}: {
  slug: ToolSlug
  lang: string
  children: React.ReactNode
}) {
  if (!isLocale(lang)) notFound()

  const tool = getTool(slug)
  if (!tool) notFound()

  const dict = await getDictionary(lang)

  return (
    <ToolShell tool={tool} locale={lang} dict={dict}>
      {children}
    </ToolShell>
  )
}
