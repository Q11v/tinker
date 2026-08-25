import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { HashTool } from "@/components/tools/hash/hash-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/hash">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("hash", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="hash" lang={(await params).lang}>
      <HashTool />
    </ToolPage>
  )
}
