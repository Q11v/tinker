"use client"

import { Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { JsonBlock } from "@/components/json-block"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { JsonTree } from "@/components/tools/json/json-tree"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import { formatJson, parseJson, SAMPLE_JSON, type JsonOutputMode } from "@/lib/json"

type ViewMode = "text" | "tree"

export function JsonTool() {
  const dict = useDict()
  const [input, setInput] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("text")
  const [outputMode, setOutputMode] = useState<JsonOutputMode>("pretty")

  const viewModes = [
    { value: "text" as const, label: dict.jsonTool.viewText },
    { value: "tree" as const, label: dict.jsonTool.viewTree },
  ]
  const outputModes = [
    { value: "pretty" as const, label: dict.jsonTool.pretty },
    { value: "minified" as const, label: dict.jsonTool.minified },
  ]

  const result = useMemo(() => parseJson(input), [input])
  const outputText = result.ok ? formatJson(result.value, outputMode) : ""

  function copyPath(path: string) {
    navigator.clipboard.writeText(path).then(
      () => toast.success(format(dict.jsonTool.pathCopied, { path })),
      () => toast.error(dict.common.copyFailed)
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        accent="violet"
        title={dict.common.input}
        hint={dict.jsonTool.inputHint}
        footer={dict.jsonTool.inputFooter}
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_JSON)}>
              {dict.common.sample}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
              <Trash2 className="size-3.5" />
              {dict.common.clear}
            </Button>
            <CopyButton value={input} label={dict.common.copy} />
          </div>
        }
      >
        <Label htmlFor="json-input" className="sr-only">
          {dict.jsonTool.inputLabel}
        </Label>
        <Textarea
          id="json-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='{"key": "value"}'
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!result.ok && input.trim().length > 0}
          className="max-h-[32rem] min-h-64 font-mono text-[13px]"
        />
      </Panel>

      <Panel
        accent="sky"
        title={dict.common.output}
        hint={
          !input.trim()
            ? dict.jsonTool.waiting
            : result.ok
              ? dict.jsonTool.valid
              : dict.jsonTool.invalid
        }
        action={
          <div className="flex items-center gap-1">
            <SegmentedControl value={viewMode} onChange={setViewMode} options={viewModes} />
            {viewMode === "text" ? (
              <SegmentedControl value={outputMode} onChange={setOutputMode} options={outputModes} />
            ) : null}
            <CopyButton value={outputText} />
          </div>
        }
      >
        {!input.trim() ? (
          <p className="text-muted-foreground text-sm">{dict.jsonTool.emptyState}</p>
        ) : !result.ok ? (
          <div className="space-y-1.5">
            <p className="text-destructive text-sm">
              {format(dict.errors.json[result.error.code], result.error.params ?? {})}
            </p>
            {result.error.line ? (
              <p className="text-muted-foreground text-xs">
                {format(dict.errors.json.position, {
                  line: result.error.line,
                  column: result.error.column ?? 0,
                })}
              </p>
            ) : null}
          </div>
        ) : viewMode === "tree" ? (
          <JsonTree value={result.value} onCopyPath={copyPath} />
        ) : (
          <JsonBlock value={outputText} />
        )}
      </Panel>
    </div>
  )
}
