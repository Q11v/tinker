import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { JwtTool } from "@/components/tools/jwt/jwt-tool"
import { ToolShell } from "@/components/tool-shell"
import { getTool } from "@/lib/tools"

const tool = getTool("jwt")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function JwtPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <JwtTool />
    </ToolShell>
  )
}
