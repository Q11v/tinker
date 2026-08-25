import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { TimestampTool } from "@/components/tools/timestamp/timestamp-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/timestamp">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("timestamp", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="timestamp" lang={(await params).lang}>
      <TimestampTool />
    </ToolPage>
  )
}
