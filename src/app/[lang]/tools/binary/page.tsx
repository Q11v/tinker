import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { BinaryTool } from "@/components/tools/binary/binary-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/binary">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("binary", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="binary" lang={(await params).lang}>
      <BinaryTool />
    </ToolPage>
  )
}
