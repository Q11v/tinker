"use client"

import { Download } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  bytesToText,
  decodeBase64,
  detectImage,
  encodeBase64,
  textToBytes,
  type Base64Variant,
} from "@/lib/base64"
import { cn, monoField } from "@/lib/utils"

type Mode = "encode" | "decode"
type Source = "text" | "file"

const VARIANTS: { value: Base64Variant; label: string }[] = [
  { value: "standard", label: "Base64" },
  { value: "urlsafe", label: "Base64URL" },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** blob URL 只能在有实际二进制数据时创建，值变化时记得撤销旧的，避免内存泄漏 */
function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // blob URL 是要和浏览器的对象注册表同步的外部资源，创建/撤销放在 effect 里是标准用法
    if (!blob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}

export function Base64Tool() {
  const dict = useDict()
  const [mode, setMode] = useState<Mode>("encode")
  const [variant, setVariant] = useState<Base64Variant>("standard")

  const [source, setSource] = useState<Source>("text")
  const [encodeText, setEncodeText] = useState("")
  const [encodeFile, setEncodeFile] = useState<File | null>(null)
  const [encodeFileBytes, setEncodeFileBytes] = useState<Uint8Array | null>(null)

  const [decodeText, setDecodeText] = useState("")

  useEffect(() => {
    // 读文件是异步 I/O，属于外部系统，结果回来之后再同步进 state 是标准用法
    let cancelled = false
    if (!encodeFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEncodeFileBytes(null)
      return
    }
    encodeFile.arrayBuffer().then((buffer) => {
      if (!cancelled) setEncodeFileBytes(new Uint8Array(buffer))
    })
    return () => {
      cancelled = true
    }
  }, [encodeFile])

  const encodedOutput = useMemo(() => {
    const bytes = source === "text" ? textToBytes(encodeText) : encodeFileBytes
    if (!bytes || bytes.length === 0) return ""
    return encodeBase64(bytes, variant)
  }, [source, encodeText, encodeFileBytes, variant])

  const decodeResult = useMemo(
    () => (decodeText.trim() ? decodeBase64(decodeText) : null),
    [decodeText]
  )

  const decodedImage = decodeResult?.ok ? detectImage(decodeResult.bytes) : null
  const decodedText = decodeResult?.ok && !decodedImage ? bytesToText(decodeResult.bytes) : null

  // 能显示成文本的就不用再提供“下载”了，Copy 已经够用；
  // 只有图片或者真正的二进制数据才需要下载
  const decodedBlob = useMemo(() => {
    if (!decodeResult?.ok || decodedText?.ok) return null
    return new Blob([decodeResult.bytes.slice().buffer], {
      type: decodedImage?.mime ?? "application/octet-stream",
    })
  }, [decodeResult, decodedImage, decodedText])
  const decodedBlobUrl = useObjectUrl(decodedBlob)

  const modes = [
    { value: "encode" as const, label: dict.base64Tool.encode },
    { value: "decode" as const, label: dict.base64Tool.decode },
  ]
  const sources = [
    { value: "text" as const, label: dict.common.text },
    { value: "file" as const, label: dict.common.file },
  ]

  return (
    <div className="space-y-4">
      <SegmentedControl value={mode} onChange={setMode} options={modes} />

      {mode === "encode" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title={dict.common.input}
            hint={dict.base64Tool.inputHint}
            action={<SegmentedControl value={source} onChange={setSource} options={sources} />}
          >
            {source === "text" ? (
              <>
                <Label htmlFor="b64-encode-text" className="sr-only">
                  {dict.base64Tool.encodeTextLabel}
                </Label>
                <Textarea
                  id="b64-encode-text"
                  value={encodeText}
                  onChange={(event) => setEncodeText(event.target.value)}
                  placeholder={dict.base64Tool.encodeTextPlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                  className={cn(monoField, "max-h-64 min-h-40")}
                />
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="b64-encode-file" className="sr-only">
                  {dict.common.selectFile}
                </Label>
                <Input
                  id="b64-encode-file"
                  type="file"
                  onChange={(event) => setEncodeFile(event.target.files?.[0] ?? null)}
                />
                {encodeFile ? (
                  <p className="text-muted-foreground text-xs">
                    {encodeFile.name} · {formatFileSize(encodeFile.size)}
                  </p>
                ) : null}
              </div>
            )}
          </Panel>

          <Panel
            accent="sky"
            title={dict.common.output}
            hint={dict.base64Tool.outputHint}
            action={
              <div className="flex items-center gap-1">
                <SegmentedControl value={variant} onChange={setVariant} options={VARIANTS} />
                <CopyButton value={encodedOutput} />
              </div>
            }
          >
            {!encodedOutput ? (
              <p className="text-muted-foreground text-sm">{dict.base64Tool.encodeEmptyState}</p>
            ) : (
              <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all">
                {encodedOutput}
              </p>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title={dict.common.input}
            hint={dict.base64Tool.decodeInputHint}
            footer={dict.base64Tool.decodeInputFooter}
          >
            <Label htmlFor="b64-decode-text" className="sr-only">
              {dict.base64Tool.decodeTextLabel}
            </Label>
            <Textarea
              id="b64-decode-text"
              value={decodeText}
              onChange={(event) => setDecodeText(event.target.value)}
              placeholder="SGVsbG8sIOS4lueVjCEg8J+OiQ=="
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!decodeResult && !decodeResult.ok}
              className={cn(monoField, "max-h-64 min-h-40")}
            />
            {decodeResult && !decodeResult.ok ? (
              <p className="text-destructive mt-2 text-xs">
                {dict.errors.base64[decodeResult.error]}
              </p>
            ) : null}
          </Panel>

          <Panel
            accent="sky"
            title={dict.common.output}
            hint={
              !decodeResult
                ? dict.base64Tool.decodeWaiting
                : !decodeResult.ok
                  ? dict.base64Tool.decodeFailed
                  : decodedImage
                    ? dict.base64Tool.detectedImage
                    : decodedText?.ok
                      ? dict.base64Tool.decodedAsText
                      : dict.base64Tool.notDisplayable
            }
            action={
              decodeResult?.ok ? (
                <div className="flex items-center gap-1">
                  {decodedText?.ok ? <CopyButton value={decodedText.text} /> : null}
                  {decodedBlobUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={decodedBlobUrl} download={`decoded.${decodedImage?.ext ?? "bin"}`}>
                        <Download className="size-3.5" />
                        {dict.common.download}
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            {!decodeResult ? (
              <p className="text-muted-foreground text-sm">{dict.base64Tool.decodeEmptyState}</p>
            ) : !decodeResult.ok ? (
              <p className="text-destructive text-sm">{dict.errors.base64[decodeResult.error]}</p>
            ) : decodedImage ? (
              <div className="space-y-3">
                {decodedBlobUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 本地 blob URL，不走 next/image 优化没有意义
                  <img
                    src={decodedBlobUrl}
                    alt={dict.base64Tool.imageAlt}
                    className="max-h-64 rounded-lg border object-contain"
                  />
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {format(dict.base64Tool.imageMeta, {
                    mime: decodedImage.mime,
                    bytes: decodeResult.bytes.length.toLocaleString(),
                  })}
                </p>
              </div>
            ) : decodedText?.ok ? (
              <p className="font-mono text-[13px] break-all whitespace-pre-wrap">
                {decodedText.text}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {format(dict.base64Tool.binaryNote, {
                  bytes: decodeResult.bytes.length.toLocaleString(),
                })}
              </p>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
