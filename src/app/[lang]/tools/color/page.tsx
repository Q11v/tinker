import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { ColorTool } from "@/components/tools/color/color-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/color">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("color", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="color" lang={(await params).lang}>
      <ColorTool />
    </ToolPage>
  )
}
