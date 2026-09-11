import { notFound } from "next/navigation"

import { ToolExplorer } from "@/components/tool-explorer"
import { isLocale } from "@/i18n/config"

/**
 * 首页的搜索词、分类与「最近使用」都是客户端状态，而 hero 里的搜索条正是入口，
 * 所以整块交给 ToolExplorer，这里只负责校验语言前缀。
 */
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  return <ToolExplorer />
}
