"use client"

import { Check, Languages } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALE_LABELS, LOCALES, localePath, stripLocale } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import { cn } from "@/lib/utils"

export function LocaleSwitcher() {
  const pathname = usePathname()
  const { locale, dict } = useI18n()

  // 只有一种语言时整个切换器没有意义；加第二种语言后会自动出现
  if (LOCALES.length < 2) return null

  // 去掉当前语言前缀，切换后停在同一个页面而不是跳回首页
  const rest = stripLocale(pathname ?? "")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={dict.header.language}>
          <Languages className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((item) => {
          const active = item === locale
          return (
            <DropdownMenuItem key={item} asChild>
              <Link
                href={localePath(item, rest)}
                hrefLang={item}
                aria-current={active ? "true" : undefined}
                className={cn("justify-between gap-6", active && "font-medium")}
              >
                {LOCALE_LABELS[item]}
                {active ? <Check className="size-3.5" /> : null}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
