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
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  decodeUrlText,
  encodeUrlText,
  parseUrl,
  type UrlEncodeVariant,
  type UrlQueryParam,
} from "@/lib/url"
import { cn, monoField } from "@/lib/utils"

type Mode = "encode" | "decode" | "parse"

function QueryParamRows({ params }: { params: UrlQueryParam[] }) {
  const dict = useDict()
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
              <span className="text-muted-foreground shrink-0 text-[10px]">
                {dict.urlTool.repeated}
              </span>
            ) : null}
          </div>
          <div className="flex items-start justify-between gap-2">
            {param.value ? (
              <code className="min-w-0 flex-1 font-mono text-[13px] break-all">{param.value}</code>
            ) : (
              <span className="text-muted-foreground flex-1 text-[13px]">
                {dict.urlTool.emptyValue}
              </span>
            )}
            <CopyButton value={param.value} size="icon" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UrlTool() {
  const dict = useDict()
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

  const modes = [
    { value: "encode" as const, label: dict.urlTool.encode },
    { value: "decode" as const, label: dict.urlTool.decode },
    { value: "parse" as const, label: dict.urlTool.parse },
  ]
  const variants = [
    { value: "component" as const, label: dict.urlTool.variantComponent },
    { value: "uri" as const, label: dict.urlTool.variantUri },
  ]
  const variantHint =
    variant === "component" ? dict.urlTool.variantHintComponent : dict.urlTool.variantHintUri

  const decodeError =
    !decoded || decoded.ok
      ? null
      : decoded.error.code === "strayPercent"
        ? format(dict.errors.url.strayPercent, { position: decoded.error.position })
        : dict.errors.url.badUtf8

  if (mode === "parse") {
    return (
      <div className="space-y-4">
        <SegmentedControl value={mode} onChange={setMode} options={modes} />

        <Panel
          accent="violet"
          title={dict.urlTool.parseInputTitle}
          hint={dict.urlTool.parseInputHint}
        >
          <Label htmlFor="url-parse-input" className="sr-only">
            {dict.urlTool.parseInputLabel}
          </Label>
          <Input
            id="url-parse-input"
            value={parseText}
            onChange={(event) => setParseText(event.target.value)}
            placeholder={dict.urlTool.parsePlaceholder}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!!parsed && !parsed.ok}
            className={monoField}
          />
          {parsed && !parsed.ok ? (
            <p className="text-destructive mt-2 text-xs">{dict.errors.url[parsed.error]}</p>
          ) : parsed?.parsed.inferredProtocol ? (
            <p className="text-muted-foreground mt-2 text-xs">{dict.urlTool.inferredProtocol}</p>
          ) : parsed?.parsed.relative ? (
            <p className="text-muted-foreground mt-2 text-xs">{dict.urlTool.relativePath}</p>
          ) : null}
        </Panel>

        {parsed?.ok ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel accent="sky" title={dict.urlTool.partsTitle} hint={dict.urlTool.partsHint}>
              <CopyableList
                items={parsed.parsed.parts.map((part) => ({
                  key: part.key,
                  label: dict.urlTool.parts[part.key],
                  value: part.value,
                }))}
              />
            </Panel>

            <Panel
              accent="rose"
              title={dict.urlTool.paramsTitle}
              hint={
                parsed.parsed.params.length
                  ? format(dict.urlTool.paramsHint, { count: parsed.parsed.params.length })
                  : dict.urlTool.noParamsHint
              }
            >
              {parsed.parsed.params.length ? (
                <QueryParamRows params={parsed.parsed.params} />
              ) : (
                <p className="text-muted-foreground text-sm">{dict.urlTool.noParams}</p>
              )}
            </Panel>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SegmentedControl value={mode} onChange={setMode} options={modes} />

      {mode === "encode" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel accent="violet" title={dict.common.input} hint={dict.urlTool.encodeInputHint}>
            <Label htmlFor="url-encode-text" className="sr-only">
              {dict.urlTool.encodeTextLabel}
            </Label>
            <Textarea
              id="url-encode-text"
              value={encodeText}
              onChange={(event) => setEncodeText(event.target.value)}
              placeholder={dict.urlTool.encodeTextPlaceholder}
              spellCheck={false}
              autoComplete="off"
              className={cn(monoField, "max-h-64 min-h-40")}
            />
          </Panel>

          <Panel
            accent="sky"
            title={dict.common.output}
            hint={dict.urlTool.encodeOutputHint}
            action={
              <div className="flex items-center gap-1">
                <SegmentedControl value={variant} onChange={setVariant} options={variants} />
                <CopyButton value={encoded} />
              </div>
            }
            footer={variantHint}
          >
            {encoded ? (
              <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all">
                {encoded}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">{dict.urlTool.encodeEmptyState}</p>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title={dict.common.input}
            hint={dict.urlTool.decodeInputHint}
            action={
              <div className="flex items-center gap-2">
                <Label htmlFor="url-plus-space" className="text-muted-foreground text-xs">
                  {dict.urlTool.plusAsSpace}
                </Label>
                <Switch
                  id="url-plus-space"
                  checked={plusAsSpace}
                  onCheckedChange={setPlusAsSpace}
                />
              </div>
            }
            footer={dict.urlTool.plusFooter}
          >
            <Label htmlFor="url-decode-text" className="sr-only">
              {dict.urlTool.decodeTextLabel}
            </Label>
            <Textarea
              id="url-decode-text"
              value={decodeText}
              onChange={(event) => setDecodeText(event.target.value)}
              placeholder="%E4%B8%AD%E6%96%87%20%26%20a+b"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!decoded && !decoded.ok}
              className={cn(monoField, "max-h-64 min-h-40")}
            />
            {decodeError ? <p className="text-destructive mt-2 text-xs">{decodeError}</p> : null}
          </Panel>

          <Panel
            accent="sky"
            title={dict.common.output}
            hint={
              !decoded
                ? dict.urlTool.decodeWaiting
                : decoded.ok
                  ? dict.urlTool.decodeResult
                  : dict.urlTool.decodeFailed
            }
            action={decoded?.ok ? <CopyButton value={decoded.text} /> : undefined}
          >
            {!decoded ? (
              <p className="text-muted-foreground text-sm">{dict.urlTool.decodeEmptyState}</p>
            ) : !decoded.ok ? (
              <p className="text-destructive text-sm">{decodeError}</p>
            ) : (
              <p className="font-mono text-[13px] break-all whitespace-pre-wrap">{decoded.text}</p>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
