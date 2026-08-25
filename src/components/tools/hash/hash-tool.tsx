"use client"

import { useEffect, useState } from "react"

import { CopyableList } from "@/components/copyable-list"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { digest, encodeDigest, HASH_ALGORITHMS, type HashEncoding } from "@/lib/hash"
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

export function HashTool() {
  const dict = useDict()
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

  const sourceModes = [
    { value: "text" as const, label: dict.common.text },
    { value: "file" as const, label: dict.common.file },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        accent="violet"
        title={dict.common.input}
        hint={dict.hashTool.inputHint}
        action={<SegmentedControl value={mode} onChange={setMode} options={sourceModes} />}
      >
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
              className={cn(monoField, "max-h-64 min-h-40")}
            />
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="hash-file" className="sr-only">
              {dict.common.selectFile}
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
        title={dict.hashTool.resultTitle}
        hint={
          busy ? dict.hashTool.busy : hasInput ? dict.hashTool.resultHint : dict.hashTool.waiting
        }
        action={<SegmentedControl value={encoding} onChange={setEncoding} options={ENCODINGS} />}
      >
        {!hasInput ? (
          <p className="text-muted-foreground text-sm">{dict.hashTool.emptyState}</p>
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
