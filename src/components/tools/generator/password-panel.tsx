"use client"

import { RefreshCw, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { CopyableList } from "@/components/copyable-list"
import { NumberInput } from "@/components/number-input"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  buildCharPool,
  DEFAULT_SYMBOLS,
  estimateEntropyBits,
  generatePassword,
  type PasswordOptions,
} from "@/lib/password"
import { cn } from "@/lib/utils"

type CharSetKey = "uppercase" | "lowercase" | "numbers" | "symbols"

const CHAR_TOGGLES: { key: CharSetKey; sample: string }[] = [
  { key: "uppercase", sample: "ABC" },
  { key: "lowercase", sample: "abc" },
  { key: "numbers", sample: "123" },
  { key: "symbols", sample: "!@#" },
]

type StrengthKey = "weak" | "medium" | "strong" | "veryStrong"

/** 只判档位，文案交给字典；level 同时用来点亮强度条的格子 */
function strengthOf(bits: number): {
  key: StrengthKey
  level: number
  textClass: string
  barClass: string
} {
  if (bits < 40) {
    return { key: "weak", level: 1, textClass: "text-destructive", barClass: "bg-destructive" }
  }
  if (bits < 70) {
    return {
      key: "medium",
      level: 2,
      textClass: "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500",
    }
  }
  return {
    key: bits < 100 ? "strong" : "veryStrong",
    level: bits < 100 ? 3 : 4,
    textClass: "text-emerald-600 dark:text-emerald-400",
    barClass: "bg-emerald-500",
  }
}

function generateBatch(options: PasswordOptions, count: number): string[] {
  return Array.from({ length: count }, () => generatePassword(options))
}

/** 数字输入框 + 滑块，两个字段长得一样才不会各说各话 */
function SliderField({
  id,
  label,
  hint,
  value,
  onValueChange,
  min,
  max,
}: {
  id: string
  label: string
  hint: string
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <NumberInput
          id={id}
          value={value}
          onValueChange={onValueChange}
          min={min}
          max={max}
          className="h-7 w-16 text-center tabular-nums"
        />
      </div>
      <Slider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onValueChange={([next]) => onValueChange(next)}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

export function PasswordPanel() {
  const dict = useDict()
  const text = dict.generatorTool.password
  const [length, setLength] = useState(16)
  const [charSets, setCharSets] = useState<Record<CharSetKey, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [symbolChars, setSymbolChars] = useState(DEFAULT_SYMBOLS)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [count, setCount] = useState(5)
  const [passwords, setPasswords] = useState<string[]>([])

  const options: PasswordOptions = { length, ...charSets, symbolChars, excludeAmbiguous }
  const pool = buildCharPool(options)
  const entropyBits = Math.round(estimateEntropyBits(length, pool.length))
  const strength = strengthOf(entropyBits)

  useEffect(() => {
    // 随机内容只能在客户端生成，这里是为了避免和构建期生成的静态 HTML 打架（hydration mismatch）
    const opts: PasswordOptions = { length, ...charSets, symbolChars, excludeAmbiguous }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasswords(buildCharPool(opts) ? generateBatch(opts, count) : [])
  }, [length, charSets, symbolChars, excludeAmbiguous, count])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel accent="violet" title={dict.generatorTool.settingsTitle} hint={text.settingsHint}>
        <div className="space-y-4">
          <SliderField
            id="password-length"
            label={text.lengthLabel}
            hint={text.lengthRange}
            value={length}
            onValueChange={setLength}
            min={4}
            max={128}
          />

          <div className="border-t pt-4">
            <SliderField
              id="password-count"
              label={text.countLabel}
              hint={text.countRange}
              value={count}
              onValueChange={setCount}
              min={1}
              max={50}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            {CHAR_TOGGLES.map(({ key, sample }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`password-${key}`}
                    className="flex items-center gap-2 font-normal"
                  >
                    {text.charsets[key]}
                    {/* 符号展开后下面就是真实的符号集，再放静态示例反而对不上 */}
                    {key === "symbols" && charSets.symbols ? null : (
                      <span className="text-muted-foreground font-mono text-xs">{sample}</span>
                    )}
                  </Label>
                  <Switch
                    id={`password-${key}`}
                    checked={charSets[key]}
                    onCheckedChange={(checked) =>
                      setCharSets((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>

                {/* 输入框、提示、恢复按钮包在同一个边框里，视觉上是「一个字段」而不是三样东西 */}
                {key === "symbols" && charSets.symbols ? (
                  <div className="relative rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
                    <Textarea
                      aria-label={text.symbolCharsLabel}
                      className="min-h-0 resize-none rounded-none border-0 bg-transparent pt-1.5 pr-8 pb-0 font-mono text-xs focus-visible:ring-0 md:text-xs dark:bg-transparent"
                      rows={2}
                      value={symbolChars}
                      onChange={(event) => setSymbolChars(event.target.value)}
                    />
                    <p className="text-muted-foreground px-2.5 pt-1 pb-1.5 text-[11px]">
                      {text.symbolCharsHint}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground absolute top-1 right-1"
                      title={text.symbolCharsReset}
                      aria-label={text.symbolCharsReset}
                      disabled={symbolChars === DEFAULT_SYMBOLS}
                      onClick={() => setSymbolChars(DEFAULT_SYMBOLS)}
                    >
                      <RotateCcw />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password-ambiguous" className="flex items-center gap-2 font-normal">
                {text.excludeAmbiguous}
                <span className="text-muted-foreground font-mono text-xs">Il1O0</span>
              </Label>
              <Switch
                id="password-ambiguous"
                checked={excludeAmbiguous}
                onCheckedChange={setExcludeAmbiguous}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            {!pool ? (
              <p className="text-destructive text-xs">{text.needCharset}</p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1" aria-hidden>
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={cn(
                        "h-1 flex-1 rounded-full",
                        level <= strength.level ? strength.barClass : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  {text.strengthPrefix}
                  <span className={cn("font-medium", strength.textClass)}>
                    {text.strength[strength.key]}
                  </span>
                  {format(text.strengthDetail, { bits: entropyBits, pool: pool.length })}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!pool}
              onClick={() => setPasswords(generateBatch(options, count))}
            >
              <RefreshCw className="size-3.5" />
              {dict.generatorTool.regenerate}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel
        accent="sky"
        title={dict.generatorTool.resultTitle}
        hint={format(dict.generatorTool.resultCount, { count: passwords.length })}
        action={<CopyButton value={passwords.join("\n")} label={dict.generatorTool.copyAll} />}
      >
        {passwords.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {pool ? dict.generatorTool.generating : text.needCharset}
          </p>
        ) : (
          <CopyableList
            items={passwords.map((pwd, index) => ({ key: String(index), value: pwd }))}
          />
        )}
      </Panel>
    </div>
  )
}
