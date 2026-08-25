import type { Metadata } from "next"

import { ToolPage } from "@/components/tool-page"
import { GeneratorTool } from "@/components/tools/generator/generator-tool"
import { toolMetadata } from "@/lib/tool-metadata"

type Props = PageProps<"/[lang]/tools/generator">

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return toolMetadata("generator", (await params).lang)
}

export default async function Page({ params }: Props) {
  return (
    <ToolPage slug="generator" lang={(await params).lang}>
      <GeneratorTool />
    </ToolPage>
  )
}
