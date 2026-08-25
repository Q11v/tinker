"use client"

import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { CopyableList } from "@/components/copyable-list"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { generateNanoId, generateUuidV4, generateUuidV7 } from "@/lib/uuid"

type GeneratorType = "v4" | "v7" | "nanoid"

const TYPE_LABELS: Record<GeneratorType, string> = {
  v4: "UUID v4（随机）",
  v7: "UUID v7（可排序）",
  nanoid: "NanoID",
}

function generateOne(type: GeneratorType): string {
  if (type === "v4") return generateUuidV4()
  if (type === "v7") return generateUuidV7()
  return generateNanoId()
}

function generateBatch(type: GeneratorType, count: number): string[] {
  return Array.from({ length: count }, () => generateOne(type))
}

function formatId(id: string, type: GeneratorType, uppercase: boolean, hyphens: boolean): string {
  if (type === "nanoid") return id
  const withHyphens = hyphens ? id : id.replaceAll("-", "")
  return uppercase ? withHyphens.toUpperCase() : withHyphens
}

export function UuidPanel() {
  const [type, setType] = useState<GeneratorType>("v4")
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    // 随机内容只能在客户端生成，这里是为了避免和构建期生成的静态 HTML 打架（hydration mismatch）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(generateBatch(type, count))
  }, [type, count])

  const formatted = ids.map((id) => formatId(id, type, uppercase, hyphens))

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Panel accent="violet" title="生成设置" hint="选择类型与数量">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uuid-type">类型</Label>
            <Select value={type} onValueChange={(value) => setType(value as GeneratorType)}>
              <SelectTrigger id="uuid-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as GeneratorType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uuid-count">数量</Label>
            <Input
              id="uuid-count"
              inputMode="numeric"
              value={String(count)}
              onChange={(event) =>
                setCount(Math.min(200, Math.max(1, Number.parseInt(event.target.value, 10) || 1)))
              }
            />
            <p className="text-muted-foreground text-xs">1 ~ 200 个</p>
          </div>

          {type !== "nanoid" ? (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="uuid-uppercase" className="font-normal">
                  大写
                </Label>
                <Switch id="uuid-uppercase" checked={uppercase} onCheckedChange={setUppercase} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="uuid-hyphens" className="font-normal">
                  保留连字符
                </Label>
                <Switch id="uuid-hyphens" checked={hyphens} onCheckedChange={setHyphens} />
              </div>
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setIds(generateBatch(type, count))}
          >
            <RefreshCw className="size-3.5" />
            换一批
          </Button>
        </div>
      </Panel>

      <Panel
        accent="sky"
        title="生成结果"
        hint={`共 ${formatted.length} 个`}
        action={<CopyButton value={formatted.join("\n")} label="复制全部" />}
      >
        {formatted.length === 0 ? (
          <p className="text-muted-foreground text-sm">生成中…</p>
        ) : (
          <CopyableList items={formatted.map((id, index) => ({ key: String(index), value: id }))} />
        )}
      </Panel>
    </div>
  )
}
