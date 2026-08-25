"use client"

import { useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNowSeconds } from "@/hooks/use-now-seconds"
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
  const [input, setInput] = useState("")
  const nowSeconds = useNowSeconds()

  const parsed = input.trim() ? parseTimeInput(input) : null
  const errorMessage = parsed && !parsed.ok ? parsed.error : null
  const ms = parsed && parsed.ok ? parsed.ms : null

  // Intl 只在解析出结果后才会用到，不会在初次渲染（含静态导出构建期）里跑，
  // 不用担心构建服务器和访客浏览器的时区不一致导致 hydration mismatch。
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const rows =
    ms === null
      ? []
      : [
          { key: "unix-s", label: "Unix 时间戳（秒）", value: String(Math.floor(ms / 1000)) },
          { key: "unix-ms", label: "Unix 时间戳（毫秒）", value: String(ms) },
          { key: "iso", label: "ISO 8601（UTC）", value: formatIso(ms) },
          { key: "rfc2822", label: "RFC 2822（UTC）", value: formatRfc2822(ms) },
          {
            key: "local",
            label: `本地时间（${localTimeZone}）`,
            value: formatInTimeZone(ms, localTimeZone),
          },
          { key: "relative", label: "相对当前时间", value: formatRelative(ms, nowSeconds * 1000) },
        ]

  const timezoneRows =
    ms === null
      ? []
      : [{ id: localTimeZone, label: `本地 · ${localTimeZone}` }, ...COMMON_TIMEZONES].filter(
          (zone, index, all) => all.findIndex((z) => z.id === zone.id) === index
        )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          accent="violet"
          title="输入"
          hint="时间戳或日期字符串，自动识别格式"
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setInput(String(Date.now()))}>
                现在
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                清空
              </Button>
            </div>
          }
          footer="纯数字按位数自动识别秒 / 毫秒 / 微秒 / 纳秒；其余按 ISO 8601、RFC 2822 等日期字符串解析"
        >
          <Label htmlFor="time-input" className="sr-only">
            时间戳或日期
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
          title="转换结果"
          hint={ms === null ? "输入后自动转换" : "同一时刻的几种常见表示"}
        >
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">在左侧输入时间戳或日期。</p>
          ) : (
            <CopyableList items={rows} />
          )}
        </Panel>
      </div>

      {timezoneRows.length > 0 && ms !== null ? (
        <Panel accent="sky" title="时区对照" hint="同一时刻在不同时区的本地时间">
          <ul className="divide-y rounded-lg border">
            {timezoneRows.map((zone) => (
              <li key={zone.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <span className="text-sm">{zone.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs">
                    {getTimeZoneOffset(ms, zone.id)}
                  </span>
                  <code className="font-mono text-[13px]">{formatInTimeZone(ms, zone.id)}</code>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  )
}
