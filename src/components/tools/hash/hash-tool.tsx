"use client"

import { useEffect, useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  digest,
  encodeDigest,
  HASH_ALGORITHMS,
  type HashEncoding,
} from "@/lib/hash"

type SourceMode = "text" | "file"

const SOURCE_MODES: { value: SourceMode; label: string }[] = [
  { value: "text", label: "文本" },
  { value: "file", label: "文件" },
]

const ENCODINGS: { value: HashEncoding; label: string }[] = [
  { value: "hex", label: "Hex" },
  { value: "base64", label: "Base64" },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function HashTool() {
  const [mode, setMode] = useState<SourceMode>("text")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [encoding, setEncoding] = useState<HashEncoding>("hex")
  const [digests, setDigests] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const bytes =
        mode === "text" ? new TextEncoder().encode(text) : file ? new Uint8Array(await file.arrayBuffer()) : null

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

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        accent="violet"
        title="输入"
        hint="文本或文件，全部计算都在本机完成"
        action={<SegmentedControl value={mode} onChange={setMode} options={SOURCE_MODES} />}
      >
        {mode === "text" ? (
          <>
            <Label htmlFor="hash-text" className="sr-only">
              待计算文本
            </Label>
            <Textarea
              id="hash-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="输入要计算摘要的文本"
              spellCheck={false}
              autoComplete="off"
              className="max-h-64 min-h-40 font-mono text-[13px]"
            />
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="hash-file" className="sr-only">
              选择文件
            </Label>
            <Input
              id="hash-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="text-muted-foreground text-xs">
                {file.name} · {formatFileSize(file.size)}
              </p>
            ) : null}
          </div>
        )}
      </Panel>

      <Panel
        accent="sky"
        title="摘要结果"
        hint={busy ? "计算中…" : hasInput ? "同一份数据的几种常见摘要算法" : "输入后自动计算"}
        action={<SegmentedControl value={encoding} onChange={setEncoding} options={ENCODINGS} />}
      >
        {!hasInput ? (
          <p className="text-muted-foreground text-sm">在左侧输入文本或选择文件。</p>
        ) : (
          <CopyableList
            items={HASH_ALGORITHMS.map((alg) => ({
              key: alg,
              label: alg,
              value: digests[alg] ?? "…",
            }))}
          />
        )}
      </Panel>
    </div>
  )
}
