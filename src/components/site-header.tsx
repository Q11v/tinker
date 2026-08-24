"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { readyTools } from "@/lib/tools"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
            <Wrench className="size-4" />
          </span>
          <span className="tracking-tight">tinker</span>
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
                  active && "text-foreground bg-accent"
                )}
              >
                <Link href={href}>{tool.name}</Link>
              </Button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="hidden font-normal md:inline-flex">
            100% 本地运行
          </Badge>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
