"use client"

import { CopyButton } from "@/components/copy-button"
import { LOCALE_HTML_LANG } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { formatRelative, formatUnixSeconds, hasClaimLabel, isTimeClaim } from "@/lib/jwt"
import { cn } from "@/lib/utils"

function renderValue(value: unknown): string {
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

/**
 * 声明表：键 · 短名 · 值，时间类声明在值下面补一行本地时间与相对时间。
 *
 * 列宽交给一个 grid 统一算（行用 subgrid 接上），不写死像素：
 * 真实 Token 里大半是 passwordVersion、oAuthLogin 这种没有短名的自定义键，
 * 固定列宽要么把它们挤断行，要么给标准声明留下一大片空槽。
 * 整张表没有任何带短名的键时，短名那一列直接不要，省掉一条空过道。
 */
export function ClaimsTable({
  payload,
  nowSeconds,
}: {
  payload: Record<string, unknown>
  nowSeconds: number
}) {
  const { locale, dict } = useI18n()
  const text = dict.jwtTool.decode
  const bcp47 = LOCALE_HTML_LANG[locale]

  const entries = Object.entries(payload)
  if (entries.length === 0) {
    return <p className="text-muted-foreground px-4 py-3.5 text-[13px]">{text.noClaims}</p>
  }

  const labeled = entries.some(([key]) => hasClaimLabel(key))

  return (
    // 窄屏放弃分栏：键名列会吃掉小半个屏宽，把 superadmin 这种值挤成两行
    <ul
      className={cn(
        "grid px-2.5 py-2 max-sm:flex max-sm:flex-col",
        labeled ? "grid-cols-[auto_auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto]"
      )}
    >
      {entries.map(([key, value]) => {
        const seconds = isTimeClaim(key) && typeof value === "number" ? value : null
        const expired = key === "exp" && seconds !== null && seconds < nowSeconds
        const time =
          seconds === null ? null : (formatUnixSeconds(seconds, bcp47) ?? text.invalidTime)
        const rendered = renderValue(value)

        return (
          <li
            key={key}
            className={cn(
              "group hover:bg-surface-hover grid grid-cols-subgrid items-baseline gap-x-3.5 rounded-[10px] px-3 py-2 transition-colors",
              "max-sm:flex max-sm:flex-wrap max-sm:gap-y-1",
              labeled ? "col-span-4" : "col-span-3"
            )}
          >
            <code className="font-mono text-[12.5px] font-semibold break-all text-(color:--tool-ink-2)">
              {key}
            </code>
            {labeled ? (
              <span className="text-muted-foreground text-xs">
                {hasClaimLabel(key) ? dict.jwtTool.claims[key] : null}
              </span>
            ) : null}
            {/* 窄屏上值整行独占，排在键名与复制按钮那一行的下面 */}
            <div className="flex min-w-0 flex-col gap-[3px] max-sm:order-last max-sm:basis-full">
              <span className="text-foreground/90 font-mono text-[12.5px] break-all">
                {rendered}
              </span>
              {time ? (
                <span
                  className={cn(
                    "text-[11.5px]",
                    expired ? "text-(color:--tool-ink-4)" : "text-muted-foreground"
                  )}
                >
                  {format(expired ? text.expiredNote : text.timeNote, {
                    time,
                    relative: formatRelative(seconds as number, nowSeconds, bcp47),
                  })}
                </span>
              ) : null}
            </div>
            {/*
              十几行里每行都亮着一个「复制」太吵，平时收起来，指针移到行上或键盘 tab 进来再出现。
              触摸屏没有 hover，pointer-coarse 下保持常显。
            */}
            <CopyButton
              value={rendered}
              ariaLabel={format(text.copyClaim, { key })}
              className="text-muted-foreground hover:text-foreground h-auto self-center rounded-[6px] px-1.5 py-0.5 text-[11.5px] font-normal opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:ml-auto pointer-coarse:opacity-100 [&_svg]:hidden"
            />
          </li>
        )
      })}
    </ul>
  )
}
