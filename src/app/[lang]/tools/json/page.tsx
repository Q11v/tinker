import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { JsonTool } from "@/components/tools/json/json-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("json")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function JsonPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <JsonTool />
    </ToolShell>
  )
}
