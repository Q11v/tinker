"use client"

import { useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
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
import { cn, monoField } from "@/lib/utils"

const SAMPLE_COLOR = "oklch(0.7 0.15 250)"

function toPickerHex(rgb: Rgb | null): string {
  if (!rgb) return "#000000"
  return formatHex({ ...rgb, a: 1 })
}

export function ColorTool() {
  const dict = useDict()
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
  const checks =
    ratio === null
      ? []
      : [
          { label: dict.colorTool.normalAa, threshold: 4.5 },
          { label: dict.colorTool.normalAaa, threshold: 7 },
          { label: dict.colorTool.largeAa, threshold: 3 },
          { label: dict.colorTool.largeAaa, threshold: 4.5 },
        ].map((check) => ({ ...check, pass: ratio >= check.threshold }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          accent="violet"
          title={dict.common.input}
          hint={dict.colorTool.inputHint}
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_COLOR)}>
                {dict.common.sample}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
                {dict.common.clear}
              </Button>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <Label htmlFor="color-picker" className="sr-only">
              {dict.colorTool.pickerLabel}
            </Label>
            <input
              id="color-picker"
              type="color"
              value={toPickerHex(rgb)}
              onChange={(event) => setInput(event.target.value)}
              className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <Label htmlFor="color-input" className="sr-only">
              {dict.colorTool.textLabel}
            </Label>
            <Input
              id="color-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="#3b82f6 / rgb(59 130 246) / oklch(0.6 0.2 260)"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!parsed && !parsed.ok}
              className={monoField}
            />
          </div>
          {parsed && !parsed.ok ? (
            <p className="text-destructive mt-2 text-xs">{dict.errors.color[parsed.error]}</p>
          ) : null}
        </Panel>

        <Panel
          accent="sky"
          title={dict.common.output}
          hint={rgb ? dict.colorTool.outputHint : dict.colorTool.waiting}
        >
          {!rgb ? (
            <p className="text-muted-foreground text-sm">{dict.colorTool.emptyState}</p>
          ) : (
            <div className="space-y-3">
              <div className="h-16 rounded-lg border" style={{ backgroundColor: formatRgb(rgb) }} />
              <CopyableList items={rows} />
            </div>
          )}
        </Panel>
      </div>

      <Panel accent="sky" title={dict.colorTool.contrastTitle} hint={dict.colorTool.contrastHint}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="color-bg-input">{dict.colorTool.background}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={dict.colorTool.backgroundPickerLabel}
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
                className={monoField}
              />
            </div>
          </div>

          {ratio !== null ? (
            <div
              className="flex min-w-32 flex-col items-center justify-center rounded-lg border p-3"
              style={{ backgroundColor: formatRgb(bgRgb as Rgb), color: formatRgb(rgb as Rgb) }}
            >
              <span className="text-2xl font-semibold">{ratio.toFixed(2)}</span>
              <span className="text-xs opacity-80">{dict.colorTool.ratio}</span>
            </div>
          ) : null}
        </div>

        {!rgb || !bgRgb ? (
          <p className="text-muted-foreground mt-4 text-sm">{dict.colorTool.needForeground}</p>
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
                  {check.pass ? dict.colorTool.pass : dict.colorTool.fail} ·{" "}
                  {format(dict.colorTool.requirement, { threshold: check.threshold })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
