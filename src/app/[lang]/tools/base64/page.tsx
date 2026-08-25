import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { Base64Tool } from "@/components/tools/base64/base64-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/base64">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("base64", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="base64" lang={(await params).lang}>
      <Base64Tool />
    </ToolPage>
  )
}
