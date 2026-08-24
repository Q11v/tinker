import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { GeneratorTool } from "@/components/tools/generator/generator-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("generator")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function GeneratorPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <GeneratorTool />
    </ToolShell>
  )
}
