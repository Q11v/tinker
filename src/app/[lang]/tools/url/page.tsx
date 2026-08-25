import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { UrlTool } from "@/components/tools/url/url-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/url">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("url", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="url" lang={(await params).lang}>
      <UrlTool />
    </ToolPage>
  )
}
