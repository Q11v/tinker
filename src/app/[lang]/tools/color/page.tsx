import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { ColorTool } from "@/components/tools/color/color-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("color")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function ColorPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <ColorTool />
    </ToolShell>
  )
}
