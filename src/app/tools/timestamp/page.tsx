import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { TimestampTool } from "@/components/tools/timestamp/timestamp-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("timestamp")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function TimestampPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <TimestampTool />
    </ToolShell>
  )
}
