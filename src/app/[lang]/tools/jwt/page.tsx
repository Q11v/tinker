import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { JwtTool } from "@/components/tools/jwt/jwt-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/jwt">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("jwt", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="jwt" lang={(await params).lang}>
      <JwtTool />
    </ToolPage>
  )
}
