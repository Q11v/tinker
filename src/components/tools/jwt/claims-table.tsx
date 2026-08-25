"use client"

import { LOCALE_HTML_LANG } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import { formatRelative, formatUnixSeconds, isRegisteredClaim, isTimeClaim } from "@/lib/jwt"

function renderValue(value: unknown): string {
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

export function ClaimsTable({
  payload,
  nowSeconds,
}: {
  payload: Record<string, unknown>
  nowSeconds: number
}) {
  const { locale, dict } = useI18n()
  const bcp47 = LOCALE_HTML_LANG[locale]

  const entries = Object.entries(payload)
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">{dict.jwtTool.decode.noClaims}</p>
  }

  return (
    <div className="divide-y rounded-lg border">
      {entries.map(([key, value]) => {
        const time = isTimeClaim(key) && typeof value === "number"
        const expired = key === "exp" && typeof value === "number" && value < nowSeconds
        return (
          <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
            <div className="min-w-0">
              <code className="font-mono text-[13px] font-medium">{key}</code>
              {isRegisteredClaim(key) ? (
                <p className="text-muted-foreground text-xs">{dict.jwtTool.claims[key]}</p>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[13px] break-all">{renderValue(value)}</p>
              {time ? (
                <p
                  className={expired ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
                >
                  {formatUnixSeconds(value as number, bcp47) ?? dict.jwtTool.decode.invalidTime} ·{" "}
                  {formatRelative(value as number, nowSeconds, bcp47)}
                  {expired ? dict.jwtTool.decode.expiredSuffix : ""}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
