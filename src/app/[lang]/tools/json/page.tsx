import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { JsonTool } from "@/components/tools/json/json-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/json">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("json", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="json" lang={(await params).lang}>
      <JsonTool />
    </ToolPage>
  )
}
