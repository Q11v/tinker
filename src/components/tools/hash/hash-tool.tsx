"use client"

import { useEffect, useMemo, useState } from "react"

import { SegmentedControl } from "@/components/segmented-control"
import { DigestRow } from "@/components/tools/hash/digest-row"
import { VerifyBar } from "@/components/tools/hash/verify-bar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  digest,
  encodeDigest,
  HASH_ALGORITHMS,
  type HashAlgorithm,
  type HashEncoding,
} from "@/lib/hash"
import { cn, monoField } from "@/lib/utils"

type SourceMode = "text" | "file"

const ENCODINGS: { value: HashEncoding; label: string }[] = [
  { value: "hex", label: "Hex" },
  { value: "base64", label: "Base64" },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 比对时忽略空格与冒号：抄下来的摘要常带 aa:bb:cc 这种分隔 */
function normalizeDigest(value: string): string {
  return value.replace(/[\s:]/g, "")
}

export function HashTool() {
  const dict = useDict()
  const [mode, setMode] = useState<SourceMode>("text")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [encoding, setEncoding] = useState<HashEncoding>("hex")
  const [digests, setDigests] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [verify, setVerify] = useState("")

  useEffect(() => {
    let cancelled = false

    async function run() {
      const bytes =
        mode === "text"
          ? new TextEncoder().encode(text)
          : file
            ? new Uint8Array(await file.arrayBuffer())
            : null

      if (!bytes || bytes.length === 0) {
        if (!cancelled) setDigests({})
        return
      }

      setBusy(true)
      const entries = await Promise.all(
        HASH_ALGORITHMS.map(async (alg) => {
          const result = await digest(alg, bytes.buffer as ArrayBuffer)
          return [alg, encodeDigest(result, encoding)] as const
        })
      )
      if (!cancelled) {
        setDigests(Object.fromEntries(entries))
        setBusy(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [mode, text, file, encoding])

  const hasInput = mode === "text" ? text.length > 0 : file !== null

  // 工具条右端的一行元信息：文本模式报 UTF-8 字节数，文件模式报文件名与大小
  const meta = useMemo(() => {
    if (busy) return dict.hashTool.busy
    if (mode === "text") {
      return format(dict.hashTool.textMeta, { bytes: new TextEncoder().encode(text).length })
    }
    if (!file) return null
    return format(dict.hashTool.fileMeta, { name: file.name, size: formatFileSize(file.size) })
  }, [busy, mode, text, file, dict])

  // 粘进来的摘要是哪个算法算出来的。hex 不分大小写，base64 区分
  const match = useMemo<HashAlgorithm | null>(() => {
    const target = normalizeDigest(verify)
    if (!target) return null
    const hit = HASH_ALGORITHMS.find((alg) => {
      const value = digests[alg]
      if (!value) return false
      return encoding === "hex" ? value.toLowerCase() === target.toLowerCase() : value === target
    })
    return hit ?? null
  }, [verify, digests, encoding])

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="bg-surface-raised flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-[12px] border px-3.5 py-2.5">
        <SegmentedControl
          size="md"
          label={dict.common.input}
          value={mode}
          onChange={setMode}
          options={[
            { value: "text" as const, label: dict.common.text },
            { value: "file" as const, label: dict.common.file },
          ]}
        />
        <SegmentedControl
          size="md"
          label={dict.hashTool.encodingLabel}
          value={encoding}
          onChange={setEncoding}
          options={ENCODINGS}
        />
        <span className="text-muted-foreground text-[12.5px] max-lg:hidden">
          {dict.hashTool.autoHint}
        </span>
        {meta ? (
          <span className="text-muted-foreground ml-auto font-mono text-[11.5px]">{meta}</span>
        ) : null}
      </div>

      <div className="bg-surface dark:bg-surface-sunken rounded-[16px] border px-[18px] py-4">
        {mode === "text" ? (
          <>
            <Label htmlFor="hash-text" className="sr-only">
              {dict.hashTool.textLabel}
            </Label>
            <Textarea
              id="hash-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={dict.hashTool.textPlaceholder}
              spellCheck={false}
              autoComplete="off"
              // 外层那圈 16px 的框已经是输入区的边界，textarea 自己不再画边框和内边距
              className={cn(
                monoField,
                "max-h-72 min-h-[104px] resize-none rounded-none border-0 bg-transparent p-0 leading-[1.7] focus-visible:ring-0 md:text-[13.5px] dark:bg-transparent"
              )}
            />
          </>
        ) : (
          <div className="flex min-h-[104px] flex-col justify-center gap-2">
            <Label htmlFor="hash-file" className="text-[13px]">
              {dict.common.selectFile}
            </Label>
            <Input
              id="hash-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="h-9 max-w-md"
            />
          </div>
        )}
      </div>

      {hasInput ? (
        <ul className="flex flex-col gap-2">
          {HASH_ALGORITHMS.map((alg) => (
            <DigestRow key={alg} algorithm={alg} value={digests[alg] ?? "…"} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-[12px] border border-dashed px-4 py-[13px] text-[13px]">
          {dict.hashTool.emptyState}
        </p>
      )}

      <VerifyBar value={verify} onChange={setVerify} match={match} />
    </div>
  )
}
