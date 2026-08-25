"use client"

import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  buildCharPool,
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

/** 只判档位，文案交给字典 */
function strengthOf(bits: number): { key: StrengthKey; className: string } {
  if (bits < 40) return { key: "weak", className: "text-destructive" }
  if (bits < 70) return { key: "medium", className: "text-amber-600 dark:text-amber-400" }
  return {
    key: bits < 100 ? "strong" : "veryStrong",
    className: "text-emerald-600 dark:text-emerald-400",
  }
}

function generateBatch(options: PasswordOptions, count: number): string[] {
  return Array.from({ length: count }, () => generatePassword(options))
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
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [count, setCount] = useState(5)
  const [passwords, setPasswords] = useState<string[]>([])

  const options: PasswordOptions = { length, ...charSets, excludeAmbiguous }
  const pool = buildCharPool(options)
  const entropyBits = Math.round(estimateEntropyBits(length, pool.length))
  const strength = strengthOf(entropyBits)

  useEffect(() => {
    // 随机内容只能在客户端生成，这里是为了避免和构建期生成的静态 HTML 打架（hydration mismatch）
    const opts: PasswordOptions = { length, ...charSets, excludeAmbiguous }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasswords(buildCharPool(opts) ? generateBatch(opts, count) : [])
  }, [length, charSets, excludeAmbiguous, count])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel accent="violet" title={dict.generatorTool.settingsTitle} hint={text.settingsHint}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-length">{text.lengthLabel}</Label>
            <Input
              id="password-length"
              inputMode="numeric"
              value={String(length)}
              onChange={(event) =>
                setLength(Math.min(128, Math.max(4, Number.parseInt(event.target.value, 10) || 4)))
              }
            />
            <p className="text-muted-foreground text-xs">{text.lengthRange}</p>
          </div>

          <div className="space-y-3 border-t pt-4">
            {CHAR_TOGGLES.map(({ key, sample }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`password-${key}`} className="flex items-center gap-2 font-normal">
                  {text.charsets[key]}
                  <span className="text-muted-foreground font-mono text-xs">{sample}</span>
                </Label>
                <Switch
                  id={`password-${key}`}
                  checked={charSets[key]}
                  onCheckedChange={(checked) =>
                    setCharSets((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Label htmlFor="password-ambiguous" className="font-normal">
                {text.excludeAmbiguous}
                <span className="text-muted-foreground ml-1.5 font-mono text-xs">Il1O0</span>
              </Label>
              <Switch
                id="password-ambiguous"
                checked={excludeAmbiguous}
                onCheckedChange={setExcludeAmbiguous}
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="password-count">{text.countLabel}</Label>
            <Input
              id="password-count"
              inputMode="numeric"
              value={String(count)}
              onChange={(event) =>
                setCount(Math.min(50, Math.max(1, Number.parseInt(event.target.value, 10) || 1)))
              }
            />
          </div>

          {!pool ? (
            <p className="text-destructive text-xs">{text.needCharset}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {text.strengthPrefix}
              <span className={cn("font-medium", strength.className)}>
                {text.strength[strength.key]}
              </span>
              {format(text.strengthDetail, { bits: entropyBits, pool: pool.length })}
            </p>
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
