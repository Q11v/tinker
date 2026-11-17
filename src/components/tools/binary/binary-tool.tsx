"use client"

import { RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import { convertInteger, formatInteger, NUMBER_BASES, type NumberBase } from "@/lib/binary"
import { cn } from "@/lib/utils"

const WIDTHS = [8, 16, 32, 64, 128, 256]
const BADGES = { "2": "BIN", "8": "OCT", "10": "DEC", "16": "HEX" }
const COLORS = {
  "2": "bg-violet-500/15 text-violet-500 dark:text-violet-400",
  "8": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  "10": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "16": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
}
const CARD = "min-w-0 rounded-xl border bg-card"
const STEP =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-500/15 font-mono text-xs font-semibold text-violet-500 dark:text-violet-400"

export function BinaryTool() {
  const { binaryTool: text, common } = useDict()
  const [base, setBase] = useState<NumberBase>("16")
  const [input, setInput] = useState("FF")
  const [width, setWidth] = useState(32)
  const [prefix, setPrefix] = useState(false)
  const [uppercase, setUppercase] = useState(true)
  const [grouped, setGrouped] = useState(true)
  const result = useMemo(() => convertInteger(input, base), [input, base])
  const error = result.kind === "invalid" || result.kind === "tooLong" ? text[result.kind] : null
  const binary = result.kind === "valid" ? result.values[0].value : "0"
  const canEditBits =
    (result.kind === "empty" || result.kind === "valid") &&
    !binary.startsWith("-") &&
    binary.length <= 256
  // Expand rather than hiding high bits or silently truncating the number.
  const bitCount = Math.max(width, WIDTHS.find((size) => size >= binary.length) ?? 256)
  const bits = canEditBits ? binary.padStart(bitCount, "0") : ""
  const values = NUMBER_BASES.map((radix) => {
    const raw =
      result.kind === "valid"
        ? result.values.find((item) => item.base === radix)!.value
        : result.kind === "empty"
          ? "0"
          : null
    return {
      radix,
      value: raw === null ? "" : formatInteger(raw, radix, { prefix, uppercase, grouped }),
    }
  })
  const allowed = { "2": "0–1", "8": "0–7", "10": "0–9", "16": "0–9, A–F" }[base]

  function toggleBit(index: number) {
    const next = bits.slice(0, index) + (bits[index] === "1" ? "0" : "1") + bits.slice(index + 1)
    setInput(BigInt(`0b${next}`).toString(Number(base)).toUpperCase())
  }

  return (
    <div className="space-y-4">
      <section className={cn(CARD, "p-4 sm:p-5")} aria-labelledby="bit-explorer-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3
            id="bit-explorer-title"
            className="flex flex-wrap items-center gap-3 text-sm font-semibold"
          >
            <span className={STEP}>01</span>
            {text.explorerTitle}
            <span className="font-mono text-[10px] tracking-[0.18em] text-violet-500 dark:text-violet-400">
              BIT EXPLORER
            </span>
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Label htmlFor="binary-width" className="text-xs">
              {text.widthLabel}
            </Label>
            <select
              id="binary-width"
              value={bitCount}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="rounded-md border bg-background px-2 py-1.5 font-mono text-foreground focus-visible:outline-ring"
            >
              {WIDTHS.map((size) => (
                <option key={size} value={size}>
                  {size} bit
                </option>
              ))}
            </select>
            <span>{format(text.widthHint, { count: bitCount })}</span>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{text.msb}</span>
          <span className="hidden sm:inline">{text.clickHint}</span>
          <span>{text.lsb}</span>
        </div>
        {canEditBits ? (
          <div
            className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4"
            role="group"
            aria-label={text.explorerTitle}
          >
            {Array.from({ length: bits.length / 8 }, (_, byte) => (
              <div key={byte} className="min-w-0">
                <div className="grid grid-cols-8 gap-1">
                  {[...bits.slice(byte * 8, byte * 8 + 8)].map((bit, offset) => {
                    const index = byte * 8 + offset
                    const position = bits.length - index - 1
                    return (
                      <button
                        key={position}
                        type="button"
                        aria-pressed={bit === "1"}
                        aria-label={format(text.bitLabel, { position, value: bit })}
                        title={`2^${position} = ${(BigInt(1) << BigInt(position)).toString()}`}
                        onClick={() => toggleBit(index)}
                        className={cn(
                          "h-9 min-w-0 cursor-pointer rounded border font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          bit === "1"
                            ? "border-violet-500/30 bg-violet-500/15 font-semibold text-violet-600 hover:bg-violet-500/25 dark:text-violet-300"
                            : "border-border bg-background text-muted-foreground/60 hover:border-violet-400 hover:text-foreground"
                        )}
                      >
                        {bit}
                      </button>
                    )
                  })}
                </div>
                <div
                  aria-hidden="true"
                  className="mt-1 flex justify-between px-2 font-mono text-[10px] text-muted-foreground"
                >
                  <span>{bits.length - byte * 8 - 1}</span>
                  <span>{bits.length - byte * 8 - 8}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground" role="status">
            {error ?? text.bitsUnavailable}
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{text.explorerFooter}</p>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(230px,1fr)]">
        <section className={CARD} aria-labelledby="binary-input-title">
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
            <h3 id="binary-input-title" className="flex items-center gap-3 text-sm font-semibold">
              <span className={STEP}>02</span>
              {text.inputTitle}
            </h3>
            <span className="text-xs text-muted-foreground">{text.live}</span>
          </header>
          <div className="space-y-5 p-4 sm:p-5">
            <div>
              <div
                role="group"
                aria-label={text.baseLabel}
                className="mb-4 inline-flex max-w-full flex-wrap gap-1 rounded-lg border bg-background p-1"
              >
                {NUMBER_BASES.map((radix) => (
                  <button
                    key={radix}
                    type="button"
                    aria-pressed={base === radix}
                    onClick={() => {
                      if (result.kind === "valid")
                        setInput(result.values.find((item) => item.base === radix)!.value)
                      setBase(radix)
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-ring",
                      base === radix
                        ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {text.bases[radix]}
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                      {radix}
                    </span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border bg-background p-3 focus-within:border-ring">
                <div className="mb-2 flex justify-between gap-3 text-[11px] text-muted-foreground">
                  <Label htmlFor="binary-input" className="text-[11px]">
                    {text.inputLabel}
                  </Label>
                  <span>BASE {base}</span>
                </div>
                <Textarea
                  id="binary-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={text.placeholder}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!!error}
                  aria-describedby={error ? "binary-error" : "binary-allowed"}
                  className="min-h-12 max-h-40 resize-y rounded-none border-0 bg-transparent p-0 font-mono text-3xl text-cyan-600 shadow-none focus-visible:ring-0 md:text-3xl dark:bg-transparent dark:text-cyan-400"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p id="binary-allowed" className="text-xs text-muted-foreground">
                  {format(text.allowedHint, { chars: allowed })}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput("")}
                  className="text-xs text-muted-foreground"
                >
                  {text.clearInput}
                  <RotateCcw className="size-3" />
                </Button>
              </div>
              {error ? (
                <p id="binary-error" role="alert" className="mt-2 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-3 text-sm font-semibold">
                  <span className={STEP}>03</span>
                  {text.resultTitle}
                </h3>
                <CopyButton
                  label={text.copyAll}
                  value={
                    error
                      ? ""
                      : values
                          .map(({ radix, value }) => `${text.bases[radix]}: ${value}`)
                          .join("\n")
                  }
                  className="text-xs"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
                {values.map(({ radix, value }) => (
                  <div
                    key={radix}
                    className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-3"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-semibold",
                        COLORS[radix]
                      )}
                    >
                      {BADGES[radix]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        {text.bases[radix]}{" "}
                        <span className="ml-1 font-mono text-[10px]">BASE {radix}</span>
                      </p>
                      <p className="max-h-28 overflow-y-auto break-all font-mono text-xl leading-snug">
                        {value || "—"}
                      </p>
                    </div>
                    <CopyButton
                      size="icon"
                      value={value}
                      ariaLabel={`${common.copy} ${text.bases[radix]}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">
              {[
                { label: text.showPrefix, checked: prefix, change: setPrefix },
                { label: text.uppercase, checked: uppercase, change: setUppercase },
                { label: text.groupDigits, checked: grouped, change: setGrouped },
              ].map((option) => (
                <label key={option.label} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={(event) => option.change(event.target.checked)}
                    className="size-3.5 accent-violet-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <section className={cn(CARD, "p-4 sm:p-5")}>
            <h3 className="mb-4 text-sm font-semibold">{text.examplesTitle}</h3>
            <div className="flex flex-wrap gap-2">
              {[255, 1024, 65535, 2026, -42].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  onClick={() => setInput(BigInt(value).toString(Number(base)).toUpperCase())}
                  className="bg-background font-mono text-sm shadow-none"
                >
                  {value}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">{text.examplesHint}</p>
          </section>
          <section className={cn(CARD, "p-4 sm:p-5")}>
            <h3 className="mb-3 text-sm font-semibold text-violet-500 dark:text-violet-400">
              ◇ {text.precisionTitle}
            </h3>
            <p className="text-xs leading-6 text-muted-foreground">{text.footer}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
