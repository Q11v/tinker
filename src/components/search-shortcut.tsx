"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { useModifierKey } from "@/hooks/use-modifier-key"
import { useI18n } from "@/i18n/context"
import { requestSearchFocus } from "@/lib/search-focus"

/**
 * 顶栏右侧的 ⌘K 胶囊，同时也是全站快捷键的注册点 —— 顶栏在每个页面都挂载，
 * 放在这里就不用再找一个「全局但又不是 layout」的地方。
 */
export function SearchShortcut() {
  const { dict, href } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const home = href()
  const modifier = useModifierKey()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      focusSearch()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
    // focusSearch 只依赖 pathname / home，这两个变了才需要重新绑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, home])

  function focusSearch() {
    // 不在首页时先回首页，标记会被 ToolExplorer 挂载后消费
    if (pathname !== home) router.push(home)
    requestSearchFocus()
  }

  return (
    <button
      type="button"
      onClick={focusSearch}
      aria-label={dict.explorer.searchLabel}
      className="text-muted-foreground hover:text-foreground hover:border-border-hover focus-visible:ring-ring/50 focus-visible:border-ring hidden h-[30px] items-center gap-1.5 rounded-[8px] border px-2.5 font-mono text-[11px] transition-colors focus-visible:ring-3 focus-visible:outline-none sm:inline-flex"
    >
      {modifier}K
    </button>
  )
}
