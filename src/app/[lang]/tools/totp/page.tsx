import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { TotpTool } from "@/components/tools/totp/totp-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/totp">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("totp", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="totp" lang={(await params).lang}>
      <TotpTool />
    </ToolPage>
  )
}
