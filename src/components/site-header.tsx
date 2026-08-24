"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { readyTools } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()

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

        <nav className="hidden items-center gap-1 sm:flex">
          {readyTools.map((tool) => {
            const href = `/tools/${tool.slug}`
            const active = pathname === href
            return (
              <Button
                key={tool.slug}
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground",
                  active && "text-accent-foreground bg-accent"
                )}
              >
                <Link href={href}>{tool.name}</Link>
              </Button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
