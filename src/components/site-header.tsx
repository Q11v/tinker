"use client"

import { ChevronDown, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { useI18n } from "@/i18n/context"
import { CATEGORY_ORDER, readyTools } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()
  const { dict, href } = useI18n()

  // 分组本身语言无关，但组标题要用当前语言的分类名，所以放在组件里算
  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: readyTools.filter((tool) => tool.category === category),
      })).filter((group) => group.items.length > 0),
    []
  )

  const onToolPage = pathname?.includes("/tools/") ?? false

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div
        aria-hidden
        className="bg-gradient-brand absolute inset-x-0 -bottom-px h-px opacity-70"
      />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href={href()} className="flex items-center gap-2 font-semibold">
          <span className="bg-gradient-brand flex size-7 items-center justify-center rounded-md text-white shadow-sm">
            <svg viewBox="0 0 32 32" className="size-4" fill="currentColor" aria-hidden>
              <rect x="7" y="8" width="18" height="4" rx="1.5" />
              <rect x="14" y="8" width="4" height="16" rx="1.5" />
            </svg>
          </span>
          <span className="text-gradient-brand tracking-tight">Tinker</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/*
              这个下拉原来是 hidden sm:inline-flex，移动端整个消失，
              于是手机上换工具只能先退回首页。窄屏保留成图标按钮。
            */}
            <Button
              variant="ghost"
              size="sm"
              aria-label={dict.header.allTools}
              className={cn(
                "gap-1 max-sm:size-9 max-sm:px-0",
                onToolPage ? "text-accent-foreground bg-accent" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="size-4 sm:hidden" />
              <span className="max-sm:hidden">{dict.header.allTools}</span>
              <ChevronDown className="size-3.5 max-sm:hidden" />
            </Button>
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
                  const active = pathname === toolHref
                  return (
                    <DropdownMenuItem key={tool.slug} asChild>
                      <Link href={toolHref} className={cn(active && "font-medium")}>
                        {dict.tools[tool.slug].name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
