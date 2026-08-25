import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { HashTool } from "@/components/tools/hash/hash-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("hash")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function HashPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <HashTool />
    </ToolShell>
  )
}
