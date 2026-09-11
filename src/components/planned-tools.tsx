"use client"

import { useDict } from "@/i18n/context"
import { REPO_URL } from "@/lib/links"
import { plannedTools } from "@/lib/tools"

/** 首页底部的「规划中」提示条：列出还没做的工具，并给一个提需求的出口 */
export function PlannedTools() {
  const dict = useDict()

  if (plannedTools.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[14px] border border-dashed px-[18px] py-3.5">
      <span className="text-label-mono text-muted-foreground">{dict.explorer.planned}</span>
      <span className="text-foreground/85 text-[13.5px]">
        {plannedTools.map((tool) => dict.tools[tool.slug].name).join(" · ")}
      </span>
      <a
        href={`${REPO_URL}/issues`}
        target="_blank"
        rel="noreferrer"
        className="text-accent-cool ml-auto text-[13px] hover:underline"
      >
        {dict.explorer.plannedCta}
      </a>
    </div>
  )
}
