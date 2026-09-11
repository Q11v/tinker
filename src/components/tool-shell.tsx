import { CategoryTag } from "@/components/category-tag"
import { ToolIcon } from "@/components/tool-icon"
import { TrackRecentTool } from "@/components/track-recent-tool"
import type { Dictionary } from "@/i18n/dictionaries"
import { categoryInk, categoryTint, type Tool } from "@/lib/tools"

interface ToolShellProps {
  tool: Tool
  dict: Dictionary
  children: React.ReactNode
}

/**
 * 所有工具页共用的页头与容器。
 * 回首页的入口交给顶栏的面包屑，这里不再重复一个「← 全部工具」。
 */
export function ToolShell({ tool, dict, children }: ToolShellProps) {
  const text = dict.tools[tool.slug]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-[18px] px-4 pt-6 pb-[34px] sm:px-7 sm:pt-[26px]">
      <TrackRecentTool slug={tool.slug} />

      <div className="flex items-start gap-3.5">
        <ToolIcon
          icon={tool.icon}
          tint={categoryTint(tool.category)}
          ink={categoryInk(tool.category)}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-[-0.015em]">{text.name}</h1>
            <CategoryTag>{dict.categories[tool.category]}</CategoryTag>
          </div>
          <p className="text-muted-foreground text-[13.5px] text-pretty">{text.description}</p>
        </div>
        {/* 窄屏藏掉：这句是安心话，不值得挤掉标题的宽度 */}
        <p className="text-muted-foreground mt-1.5 ml-auto shrink-0 text-[13px] max-lg:hidden">
          {dict.common.localOnlyNote}
        </p>
      </div>

      {children}
    </div>
  )
}
