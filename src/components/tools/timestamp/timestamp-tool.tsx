"use client"

import { useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { LOCALE_HTML_LANG } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  COMMON_TIMEZONES,
  formatInTimeZone,
  formatIso,
  formatRelative,
  formatRfc2822,
  getTimeZoneOffset,
  parseTimeInput,
} from "@/lib/timestamp"

export function TimestampTool() {
  const { locale, dict } = useI18n()
  const [input, setInput] = useState("")
  const nowSeconds = useNowSeconds()

  // Intl 要的是 BCP 47 标签（zh-CN），不是路由里那个短代码（zh）
  const bcp47 = LOCALE_HTML_LANG[locale]

  const parsed = input.trim() ? parseTimeInput(input) : null
  const errorMessage = parsed && !parsed.ok ? dict.errors.timestamp[parsed.error] : null
  const ms = parsed && parsed.ok ? parsed.ms : null

  // Intl 只在解析出结果后才会用到，不会在初次渲染（含静态导出构建期）里跑，
  // 不用担心构建服务器和访客浏览器的时区不一致导致 hydration mismatch。
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const rows =
    ms === null
      ? []
      : [
          {
            key: "unix-s",
            label: dict.timestampTool.unixSeconds,
            value: String(Math.floor(ms / 1000)),
          },
          { key: "unix-ms", label: dict.timestampTool.unixMillis, value: String(ms) },
          { key: "iso", label: dict.timestampTool.iso, value: formatIso(ms) },
          { key: "rfc2822", label: dict.timestampTool.rfc2822, value: formatRfc2822(ms) },
          {
            key: "local",
            label: format(dict.timestampTool.localTime, { zone: localTimeZone }),
            value: formatInTimeZone(ms, localTimeZone, bcp47),
          },
          {
            key: "relative",
            label: dict.timestampTool.relative,
            value: formatRelative(ms, nowSeconds * 1000, bcp47),
          },
        ]

  const timezoneRows =
    ms === null
      ? []
      : [
          {
            id: localTimeZone,
            label: format(dict.timestampTool.localZone, { zone: localTimeZone }),
          },
          ...COMMON_TIMEZONES.map((id) => ({ id, label: dict.timestampTool.timezones[id] })),
        ].filter((zone, index, all) => all.findIndex((z) => z.id === zone.id) === index)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          accent="violet"
          title={dict.common.input}
          hint={dict.timestampTool.inputHint}
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setInput(String(Date.now()))}>
                {dict.timestampTool.now}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                {dict.common.clear}
              </Button>
            </div>
          }
          footer={dict.timestampTool.inputFooter}
        >
          <Label htmlFor="time-input" className="sr-only">
            {dict.timestampTool.inputLabel}
          </Label>
          <Input
            id="time-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="1735689600 / 2025-01-01T00:00:00Z / 2025-01-01 08:00:00"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!!errorMessage}
            className="font-mono text-[13px]"
          />
          {errorMessage ? <p className="text-destructive mt-2 text-xs">{errorMessage}</p> : null}
        </Panel>

        <Panel
          accent="sky"
          title={dict.timestampTool.resultTitle}
          hint={ms === null ? dict.timestampTool.waiting : dict.timestampTool.resultHint}
        >
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">{dict.timestampTool.emptyState}</p>
          ) : (
            <CopyableList items={rows} />
          )}
        </Panel>
      </div>

      {timezoneRows.length > 0 && ms !== null ? (
        <Panel
          accent="sky"
          title={dict.timestampTool.timezoneTitle}
          hint={dict.timestampTool.timezoneHint}
        >
          <ul className="divide-y rounded-lg border">
            {timezoneRows.map((zone) => (
              <li key={zone.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <span className="text-sm">{zone.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs">
                    {getTimeZoneOffset(ms, zone.id)}
                  </span>
                  <code className="font-mono text-[13px]">
                    {formatInTimeZone(ms, zone.id, bcp47)}
                  </code>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  )
}
