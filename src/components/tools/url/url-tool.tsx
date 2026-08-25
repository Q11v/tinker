"use client"

import { useMemo, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { CopyableList } from "@/components/copyable-list"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  decodeUrlText,
  encodeUrlText,
  parseUrl,
  type UrlEncodeVariant,
  type UrlQueryParam,
} from "@/lib/url"

type Mode = "encode" | "decode" | "parse"

const MODES: { value: Mode; label: string }[] = [
  { value: "encode", label: "编码" },
  { value: "decode", label: "解码" },
  { value: "parse", label: "解析" },
]

const VARIANTS: { value: UrlEncodeVariant; label: string }[] = [
  { value: "component", label: "参数值" },
  { value: "uri", label: "整条链接" },
]

const VARIANT_HINT: Record<UrlEncodeVariant, string> = {
  component: "encodeURIComponent：连 / ? & = # 也一起编码，适合放进查询参数的值",
  uri: "encodeURI：保留 URL 的结构字符，只编码空格、中文这类非法字符",
}

function QueryParamRows({ params }: { params: UrlQueryParam[] }) {
  // 同名参数会重复出现（?a=1&a=2），标出来免得被当成解析错误
  const repeated = new Set(
    params.map((p) => p.name).filter((name, index, all) => all.indexOf(name) !== index)
  )

  return (
    <div className="divide-y rounded-lg border">
      {params.map((param) => (
        <div key={param.key} className="grid gap-1 px-3 py-2 sm:grid-cols-[160px_1fr] sm:gap-4">
          <div className="flex items-baseline gap-1.5">
            <code className="min-w-0 font-mono text-[13px] font-medium break-all">
              {param.name}
            </code>
            {repeated.has(param.name) ? (
              <span className="text-muted-foreground shrink-0 text-[10px]">重复</span>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-2">
            {param.value ? (
              <code className="min-w-0 flex-1 font-mono text-[13px] break-all">{param.value}</code>
            ) : (
              <span className="text-muted-foreground flex-1 text-[13px]">（空值）</span>
            )}
            <CopyButton value={param.value} size="icon" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UrlTool() {
  const [mode, setMode] = useState<Mode>("encode")

  const [encodeText, setEncodeText] = useState("")
  const [variant, setVariant] = useState<UrlEncodeVariant>("component")

  const [decodeText, setDecodeText] = useState("")
  const [plusAsSpace, setPlusAsSpace] = useState(true)

  const [parseText, setParseText] = useState("")

  const encoded = useMemo(() => encodeUrlText(encodeText, variant), [encodeText, variant])

  const decoded = useMemo(
    () => (decodeText ? decodeUrlText(decodeText, plusAsSpace) : null),
    [decodeText, plusAsSpace]
  )

  const parsed = useMemo(() => (parseText.trim() ? parseUrl(parseText) : null), [parseText])

  if (mode === "parse") {
    return (
      <div className="space-y-4">
        <SegmentedControl value={mode} onChange={setMode} options={MODES} />

        <Panel
          accent="violet"
          title="URL"
          hint="完整链接、省略协议的 example.com/x，或 /api?x=1 这样的相对路径都可以"
        >
          <Label htmlFor="url-parse-input" className="sr-only">
            待解析的 URL
          </Label>
          <Input
            id="url-parse-input"
            value={parseText}
            onChange={(event) => setParseText(event.target.value)}
            placeholder="https://user@api.example.com:8443/v1/search?q=中文&page=2#result"
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!!parsed && !parsed.ok}
            className="font-mono text-[13px]"
          />
          {parsed && !parsed.ok ? (
            <p className="text-destructive mt-2 text-xs">{parsed.error}</p>
          ) : parsed?.parsed.inferredProtocol ? (
            <p className="text-muted-foreground mt-2 text-xs">没写协议，已按 https:// 解析。</p>
          ) : parsed?.parsed.relative ? (
            <p className="text-muted-foreground mt-2 text-xs">
              相对路径，只解析路径、查询串与锚点。
            </p>
          ) : null}
        </Panel>

        {parsed?.ok ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel accent="sky" title="组成部分" hint="点右侧图标复制单项">
              <CopyableList
                items={parsed.parsed.parts.map((part) => ({
                  key: part.key,
                  label: part.label,
                  value: part.value,
                }))}
              />
            </Panel>

            <Panel
              accent="rose"
              title="查询参数"
              hint={
                parsed.parsed.params.length
                  ? `${parsed.parsed.params.length} 个，已解码`
                  : "没有查询参数"
              }
            >
              {parsed.parsed.params.length ? (
                <QueryParamRows params={parsed.parsed.params} />
              ) : (
                <p className="text-muted-foreground text-sm">这条 URL 没有查询参数。</p>
              )}
            </Panel>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SegmentedControl value={mode} onChange={setMode} options={MODES} />

      {mode === "encode" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel accent="violet" title="输入" hint="原始文本">
            <Label htmlFor="url-encode-text" className="sr-only">
              待编码文本
            </Label>
            <Textarea
              id="url-encode-text"
              value={encodeText}
              onChange={(event) => setEncodeText(event.target.value)}
              placeholder="中文 & 空格 / 特殊字符"
              spellCheck={false}
              autoComplete="off"
              className="max-h-64 min-h-40 font-mono text-[13px]"
            />
          </Panel>

          <Panel
            accent="sky"
            title="输出"
            hint="百分号编码结果"
            action={
              <div className="flex items-center gap-1">
                <SegmentedControl value={variant} onChange={setVariant} options={VARIANTS} />
                <CopyButton value={encoded} />
              </div>
            }
            footer={VARIANT_HINT[variant]}
          >
            {encoded ? (
              <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all">
                {encoded}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">在左侧输入要编码的文本。</p>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title="输入"
            hint="粘贴百分号编码的文本"
            action={
              <div className="flex items-center gap-2">
                <Label htmlFor="url-plus-space" className="text-muted-foreground text-xs">
                  + 当空格
                </Label>
                <Switch
                  id="url-plus-space"
                  checked={plusAsSpace}
                  onCheckedChange={setPlusAsSpace}
                />
              </div>
            }
            footer="查询串里的 + 表示空格（form-urlencoded），路径里的 + 就是加号本身"
          >
            <Label htmlFor="url-decode-text" className="sr-only">
              待解码文本
            </Label>
            <Textarea
              id="url-decode-text"
              value={decodeText}
              onChange={(event) => setDecodeText(event.target.value)}
              placeholder="%E4%B8%AD%E6%96%87%20%26%20a+b"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!decoded && !decoded.ok}
              className="max-h-64 min-h-40 font-mono text-[13px]"
            />
            {decoded && !decoded.ok ? (
              <p className="text-destructive mt-2 text-xs">{decoded.error}</p>
            ) : null}
          </Panel>

          <Panel
            accent="sky"
            title="输出"
            hint={!decoded ? "输入后自动解码" : decoded.ok ? "解码结果" : "解码失败"}
            action={decoded?.ok ? <CopyButton value={decoded.text} /> : undefined}
          >
            {!decoded ? (
              <p className="text-muted-foreground text-sm">在左侧粘贴编码后的文本。</p>
            ) : !decoded.ok ? (
              <p className="text-destructive text-sm">{decoded.error}</p>
            ) : (
              <p className="font-mono text-[13px] break-all whitespace-pre-wrap">{decoded.text}</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
