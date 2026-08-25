"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
import { CATEGORY_ORDER, readyTools } from "@/lib/tools"
import { cn } from "@/lib/utils"

const GROUPED_TOOLS = CATEGORY_ORDER.map((name) => ({
  name,
  items: readyTools.filter((tool) => tool.category === name),
})).filter((group) => group.items.length > 0)

export function SiteHeader() {
  const pathname = usePathname()
  const onToolPage = pathname?.startsWith("/tools/") ?? false

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div
        aria-hidden
        className="bg-gradient-brand absolute inset-x-0 -bottom-px h-px opacity-70"
      />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
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
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden gap-1 sm:inline-flex",
                onToolPage ? "text-accent-foreground bg-accent" : "text-muted-foreground"
              )}
            >
              全部工具
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {GROUPED_TOOLS.map((group, index) => (
              <div key={group.name}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                  {group.name}
                </DropdownMenuLabel>
                {group.items.map((tool) => {
                  const href = `/tools/${tool.slug}`
                  const active = pathname === href
                  return (
                    <DropdownMenuItem key={tool.slug} asChild>
                      <Link href={href} className={cn(active && "font-medium")}>
                        {tool.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
