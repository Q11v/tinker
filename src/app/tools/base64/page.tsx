import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { Base64Tool } from "@/components/tools/base64/base64-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("base64")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function Base64Page() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <Base64Tool />
    </ToolShell>
  )
}
