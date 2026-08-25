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
import {
  bytesToText,
  decodeBase64,
  detectImage,
  encodeBase64,
  textToBytes,
  type Base64Variant,
} from "@/lib/base64"

type Mode = "encode" | "decode"
type Source = "text" | "file"

const MODES: { value: Mode; label: string }[] = [
  { value: "encode", label: "编码" },
  { value: "decode", label: "解码" },
]

const SOURCES: { value: Source; label: string }[] = [
  { value: "text", label: "文本" },
  { value: "file", label: "文件" },
]

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

  return (
    <div className="space-y-4">
      <SegmentedControl value={mode} onChange={setMode} options={MODES} />

      {mode === "encode" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            accent="violet"
            title="输入"
            hint="文本或文件，全部在本机完成"
            action={<SegmentedControl value={source} onChange={setSource} options={SOURCES} />}
          >
            {source === "text" ? (
              <>
                <Label htmlFor="b64-encode-text" className="sr-only">
                  待编码文本
                </Label>
                <Textarea
                  id="b64-encode-text"
                  value={encodeText}
                  onChange={(event) => setEncodeText(event.target.value)}
                  placeholder="输入要编码的文本"
                  spellCheck={false}
                  autoComplete="off"
                  className="max-h-64 min-h-40 font-mono text-[13px]"
                />
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="b64-encode-file" className="sr-only">
                  选择文件
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
            title="输出"
            hint="编码结果"
            action={
              <div className="flex items-center gap-1">
                <SegmentedControl value={variant} onChange={setVariant} options={VARIANTS} />
                <CopyButton value={encodedOutput} />
              </div>
            }
          >
            {!encodedOutput ? (
              <p className="text-muted-foreground text-sm">在左侧输入文本或选择文件。</p>
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
            title="输入"
            hint="粘贴 Base64，标准或 URL-safe 字母表都能识别"
            footer="可以直接粘贴 data:image/png;base64,... 这种带前缀的字符串"
          >
            <Label htmlFor="b64-decode-text" className="sr-only">
              待解码的 Base64
            </Label>
            <Textarea
              id="b64-decode-text"
              value={decodeText}
              onChange={(event) => setDecodeText(event.target.value)}
              placeholder="SGVsbG8sIOS4lueVjCEg8J+OiQ=="
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!decodeResult && !decodeResult.ok}
              className="max-h-64 min-h-40 font-mono text-[13px]"
            />
            {decodeResult && !decodeResult.ok ? (
              <p className="text-destructive mt-2 text-xs">{decodeResult.error}</p>
            ) : null}
          </Panel>

          <Panel
            accent="sky"
            title="输出"
            hint={
              !decodeResult
                ? "输入后自动解码"
                : !decodeResult.ok
                  ? "解码失败"
                  : decodedImage
                    ? "识别为图片"
                    : decodedText?.ok
                      ? "按 UTF-8 文本解码"
                      : "不是可显示的文本"
            }
            action={
              decodeResult?.ok ? (
                <div className="flex items-center gap-1">
                  {decodedText?.ok ? <CopyButton value={decodedText.text} /> : null}
                  {decodedBlobUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={decodedBlobUrl}
                        download={`decoded.${decodedImage?.ext ?? "bin"}`}
                      >
                        <Download className="size-3.5" />
                        下载
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            {!decodeResult ? (
              <p className="text-muted-foreground text-sm">在左侧粘贴 Base64 文本。</p>
            ) : !decodeResult.ok ? (
              <p className="text-destructive text-sm">{decodeResult.error}</p>
            ) : decodedImage ? (
              <div className="space-y-3">
                {decodedBlobUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 本地 blob URL，不走 next/image 优化没有意义
                  <img
                    src={decodedBlobUrl}
                    alt="解码后的图片预览"
                    className="max-h-64 rounded-lg border object-contain"
                  />
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {decodedImage.mime} · {decodeResult.bytes.length.toLocaleString()} 字节
                </p>
              </div>
            ) : decodedText?.ok ? (
              <p className="font-mono text-[13px] break-all whitespace-pre-wrap">
                {decodedText.text}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                解码得到 {decodeResult.bytes.length.toLocaleString()} 字节的二进制数据，不是可显示的文本，可以点右上角下载。
              </p>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}
