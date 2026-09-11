"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { LocaleSwitcher } from "@/components/locale-switcher"
import { SearchShortcut } from "@/components/search-shortcut"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/i18n/context"
import { stripLocale } from "@/i18n/config"
import { CATEGORY_ORDER, getTool, readyTools, type Tool } from "@/lib/tools"
import { cn } from "@/lib/utils"

/** 次级导航与面包屑共用的胶囊尺寸：高 30px、圆角 8px、13px 文字 */
const PILL = "inline-flex h-[30px] items-center gap-1 rounded-[8px] px-3 text-[13px]"

function TinkerMark() {
  return (
    <span className="bg-gradient-brand flex size-7 items-center justify-center rounded-[9px] text-white shadow-sm">
      <svg viewBox="0 0 32 32" className="size-4" fill="currentColor" aria-hidden>
        <rect x="7" y="8" width="18" height="4" rx="1.5" />
        <rect x="14" y="8" width="4" height="16" rx="1.5" />
      </svg>
    </span>
  )
}

/**
 * 全部工具的下拉，按分类分组。
 * 首页里它是次级导航的「全部工具」，工具页里它是面包屑中间那一节 ——
 * 设计稿的面包屑是纯文字，但那样一来窄屏上换工具就只能先退回首页，
 * 所以把分类这一节做成下拉的触发器，多一个 14px 的小箭头换回一个入口。
 */
function ToolsMenu({
  label,
  active,
  className,
}: {
  label: string
  active: boolean
  className?: string
}) {
  const pathname = usePathname()
  const { dict, href } = useI18n()

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: readyTools.filter((tool) => tool.category === category),
      })).filter((group) => group.items.length > 0),
    []
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          PILL,
          "hover:text-foreground focus-visible:ring-ring/50 transition-colors focus-visible:ring-3 focus-visible:outline-none",
          active
            ? "bg-muted dark:bg-surface-hover text-foreground"
            : "text-muted-foreground hover:bg-muted dark:hover:bg-surface-hover",
          className
        )}
      >
        {label}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {groups.map((group, index) => (
          <div key={group.category}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {dict.categories[group.category]}
            </DropdownMenuLabel>
            {group.items.map((tool) => {
              const toolHref = href(`/tools/${tool.slug}`)
              return (
                <DropdownMenuItem key={tool.slug} asChild>
                  <Link
                    href={toolHref}
                    className={cn(pathname === toolHref && "font-medium")}
                    aria-current={pathname === toolHref ? "page" : undefined}
                  >
                    {dict.tools[tool.slug].name}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Separator() {
  return (
    <span aria-hidden className="text-muted-foreground/70 text-[13px]">
      /
    </span>
  )
}

function Breadcrumb({ tool }: { tool: Tool }) {
  const { dict } = useI18n()

  return (
    <nav aria-label={dict.header.breadcrumb} className="flex min-w-0 items-center gap-2">
      <Separator />
      <ToolsMenu
        label={dict.categories[tool.category]}
        active={false}
        className="text-foreground/85 px-2"
      />
      {/* 窄屏藏掉工具名这一节：正下方的页头已经是同一个名字，藏它比藏分类下拉划算 */}
      <span className="max-sm:hidden">
        <Separator />
      </span>
      <span className="truncate text-[13px] max-sm:hidden" aria-current="page">
        {dict.tools[tool.slug].name}
      </span>
    </nav>
  )
}

/** 从 /zh/tools/hash 这样的路径里取出当前工具，取不到就是非工具页 */
function useCurrentTool(): Tool | undefined {
  const pathname = usePathname()
  const slug = /^\/tools\/([^/]+)$/.exec(stripLocale(pathname ?? ""))?.[1]
  return slug ? getTool(slug) : undefined
}

export function SiteHeader() {
  const { dict, href } = useI18n()
  const tool = useCurrentTool()

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center gap-2.5 px-4 sm:gap-3.5 sm:px-7">
        <Link
          href={href()}
          className="focus-visible:ring-ring/50 flex shrink-0 items-center gap-2.5 rounded-[9px] focus-visible:ring-3 focus-visible:outline-none"
        >
          <TinkerMark />
          {/* 这行字同时是面包屑的第一节，窄屏也不能藏 */}
          <span className="text-base font-semibold tracking-[-0.01em]">Tinker</span>
        </Link>

        {tool ? (
          <Breadcrumb tool={tool} />
        ) : (
          <ToolsMenu label={dict.header.allTools} active className="sm:ml-2.5" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <SearchShortcut />
          {/* 设计稿：语言按钮是描边的，主题按钮是实底的（当前生效的那个开关更重一点） */}
          <LocaleSwitcher className="size-[30px] rounded-[8px] border" />
          <ThemeToggle className="bg-surface-hover text-foreground size-[30px] rounded-[8px]" />
        </div>
      </div>
    </header>
  )
}
