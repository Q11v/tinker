"use client"

import { useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  contrastRatio,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  parseColor,
  rgbToHsl,
  rgbToOklch,
  type Rgb,
} from "@/lib/color"
import { cn } from "@/lib/utils"

const SAMPLE_COLOR = "oklch(0.7 0.15 250)"

function toPickerHex(rgb: Rgb | null): string {
  if (!rgb) return "#000000"
  return formatHex({ ...rgb, a: 1 })
}

interface ContrastCheck {
  label: string
  threshold: number
  pass: boolean
}

export function ColorTool() {
  const [input, setInput] = useState("")
  const [bgInput, setBgInput] = useState("#ffffff")

  const parsed = input.trim() ? parseColor(input) : null
  const rgb = parsed?.ok ? parsed.rgb : null

  const bgParsed = bgInput.trim() ? parseColor(bgInput) : null
  const bgRgb = bgParsed?.ok ? bgParsed.rgb : null

  const rows =
    rgb === null
      ? []
      : [
          { key: "hex", label: "HEX", value: formatHex(rgb) },
          { key: "rgb", label: "RGB", value: formatRgb(rgb) },
          { key: "hsl", label: "HSL", value: formatHsl(rgbToHsl(rgb)) },
          { key: "oklch", label: "OKLCH", value: formatOklch(rgbToOklch(rgb)) },
        ]

  const ratio = rgb && bgRgb ? contrastRatio(rgb, bgRgb) : null
  const checks: ContrastCheck[] =
    ratio === null
      ? []
      : [
          { label: "正常文本 AA", threshold: 4.5, pass: ratio >= 4.5 },
          { label: "正常文本 AAA", threshold: 7, pass: ratio >= 7 },
          { label: "大号文本 AA", threshold: 3, pass: ratio >= 3 },
          { label: "大号文本 AAA", threshold: 4.5, pass: ratio >= 4.5 },
        ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          accent="violet"
          title="输入"
          hint="HEX / RGB / HSL / OKLCH 任意一种格式"
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_COLOR)}>
                示例
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                清空
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="color-picker" className="sr-only">
              颜色选择器
            </Label>
            <input
              id="color-picker"
              type="color"
              value={toPickerHex(rgb)}
              onChange={(event) => setInput(event.target.value)}
              className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <Label htmlFor="color-input" className="sr-only">
              颜色文本
            </Label>
            <Input
              id="color-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="#3b82f6 / rgb(59 130 246) / oklch(0.6 0.2 260)"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!parsed && !parsed.ok}
              className="font-mono text-[13px]"
            />
          </div>
          {parsed && !parsed.ok ? (
            <p className="text-destructive mt-2 text-xs">{parsed.error}</p>
          ) : null}
        </Panel>

        <Panel accent="sky" title="输出" hint={rgb ? "同一个颜色的几种常见表示" : "输入后自动转换"}>
          {!rgb ? (
            <p className="text-muted-foreground text-sm">在左侧输入颜色。</p>
          ) : (
            <div className="space-y-3">
              <div className="h-16 rounded-lg border" style={{ backgroundColor: formatRgb(rgb) }} />
              <CopyableList items={rows} />
            </div>
          )}
        </Panel>
      </div>

      <Panel accent="sky" title="对比度检查" hint="WCAG 2 对比度，检查文字颜色在背景色上是否够清晰">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="color-bg-input">背景色</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="背景色选择器"
                value={toPickerHex(bgRgb)}
                onChange={(event) => setBgInput(event.target.value)}
                className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                id="color-bg-input"
                value={bgInput}
                onChange={(event) => setBgInput(event.target.value)}
                placeholder="#ffffff"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!!bgParsed && !bgParsed.ok}
                className="font-mono text-[13px]"
              />
            </div>
          </div>

          {ratio !== null ? (
            <div
              className="flex min-w-32 flex-col items-center justify-center rounded-lg border p-3"
              style={{ backgroundColor: formatRgb(bgRgb as Rgb), color: formatRgb(rgb as Rgb) }}
            >
              <span className="text-2xl font-semibold">{ratio.toFixed(2)}</span>
              <span className="text-xs opacity-80">对比度</span>
            </div>
          ) : null}
        </div>

        {!rgb || !bgRgb ? (
          <p className="text-muted-foreground mt-4 text-sm">需要先在上面输入一个合法的文字颜色。</p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {checks.map((check) => (
              <li
                key={check.label}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                  check.pass
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-destructive/30 bg-destructive/5"
                )}
              >
                <span>{check.label}</span>
                <span
                  className={cn(
                    "font-medium",
                    check.pass ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                  )}
                >
                  {check.pass ? "通过" : "不通过"} · 需 ≥ {check.threshold}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
