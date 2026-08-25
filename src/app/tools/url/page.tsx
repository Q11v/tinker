import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ToolShell } from "@/components/tool-shell"
import { UrlTool } from "@/components/tools/url/url-tool"
import { getTool } from "@/lib/tools"

const tool = getTool("url")

export const metadata: Metadata = {
  title: tool?.name,
  description: tool?.description,
}

export default function UrlPage() {
  if (!tool) notFound()
  return (
    <ToolShell tool={tool}>
      <UrlTool />
    </ToolShell>
  )
}
