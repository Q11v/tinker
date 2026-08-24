"use client"

import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  buildCharPool,
  estimateEntropyBits,
  generatePassword,
  type PasswordOptions,
} from "@/lib/password"
import { cn } from "@/lib/utils"

type CharSetKey = "uppercase" | "lowercase" | "numbers" | "symbols"

const CHAR_TOGGLES: { key: CharSetKey; label: string; sample: string }[] = [
  { key: "uppercase", label: "大写字母", sample: "ABC" },
  { key: "lowercase", label: "小写字母", sample: "abc" },
  { key: "numbers", label: "数字", sample: "123" },
  { key: "symbols", label: "符号", sample: "!@#" },
]

function strengthLabel(bits: number): { text: string; className: string } {
  if (bits < 40) return { text: "较弱", className: "text-destructive" }
  if (bits < 70) return { text: "中等", className: "text-amber-600 dark:text-amber-400" }
  return { text: bits < 100 ? "强" : "非常强", className: "text-emerald-600 dark:text-emerald-400" }
}

function generateBatch(options: PasswordOptions, count: number): string[] {
  return Array.from({ length: count }, () => generatePassword(options))
}

export function PasswordPanel() {
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
  const strength = strengthLabel(entropyBits)

  useEffect(() => {
    // 随机内容只能在客户端生成，这里是为了避免和构建期生成的静态 HTML 打架（hydration mismatch）
    const opts: PasswordOptions = { length, ...charSets, excludeAmbiguous }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasswords(buildCharPool(opts) ? generateBatch(opts, count) : [])
  }, [length, charSets, excludeAmbiguous, count])

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel accent="violet" title="生成设置" hint="选择长度与字符集">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-length">长度</Label>
            <Input
              id="password-length"
              inputMode="numeric"
              value={String(length)}
              onChange={(event) =>
                setLength(Math.min(128, Math.max(4, Number.parseInt(event.target.value, 10) || 4)))
              }
            />
            <p className="text-muted-foreground text-xs">4 ~ 128 位</p>
          </div>

          <div className="space-y-3 border-t pt-4">
            {CHAR_TOGGLES.map(({ key, label, sample }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`password-${key}`} className="flex items-center gap-2 font-normal">
                  {label}
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
                排除易混淆字符
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
            <Label htmlFor="password-count">生成数量</Label>
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
            <p className="text-destructive text-xs">请至少选择一种字符类型</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              强度预估：<span className={cn("font-medium", strength.className)}>{strength.text}</span>
              （约 {entropyBits} bit 熵，字符集 {pool.length} 种）
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
            换一批
          </Button>
        </div>
      </Panel>

      <Panel
        accent="sky"
        title="生成结果"
        hint={`共 ${passwords.length} 个`}
        action={<CopyButton value={passwords.join("\n")} label="复制全部" />}
      >
        {passwords.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {pool ? "生成中…" : "请先至少选择一种字符类型。"}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {passwords.map((pwd, index) => (
              <li key={index} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[13px]">{pwd}</code>
                <CopyButton value={pwd} size="icon" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
