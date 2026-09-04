import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { QrcodeTool } from "@/components/tools/qrcode/qrcode-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/qrcode">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("qrcode", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="qrcode" lang={(await params).lang}>
      <QrcodeTool />
    </ToolPage>
  )
}
