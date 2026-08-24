"use client"

import { Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { JsonBlock } from "@/components/json-block"
import { Panel } from "@/components/tool-panel"
import { JsonTree } from "@/components/tools/json/json-tree"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatJson, parseJson, SAMPLE_JSON, type JsonOutputMode } from "@/lib/json"
import { cn } from "@/lib/utils"

type ViewMode = "text" | "tree"

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "text", label: "文本" },
  { value: "tree", label: "树形" },
]

const OUTPUT_MODES: { value: JsonOutputMode; label: string }[] = [
  { value: "pretty", label: "格式化" },
  { value: "minified", label: "压缩" },
]

export function JsonTool() {
  const [input, setInput] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("text")
  const [outputMode, setOutputMode] = useState<JsonOutputMode>("pretty")

  const result = useMemo(() => parseJson(input), [input])
  const outputText = result.ok ? formatJson(result.value, outputMode) : ""

  function copyPath(path: string) {
    navigator.clipboard.writeText(path).then(
      () => toast.success(`已复制路径 ${path}`),
      () => toast.error("复制失败，请手动选中内容复制")
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        accent="violet"
        title="输入"
        hint="粘贴或输入 JSON，也支持 JS 对象字面量写法"
        footer="宽松模式：单引号、不加引号的 key、结尾逗号、// 与 /* 注释都可以"
        action={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_JSON)}>
              示例
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput("")}
              disabled={!input}
            >
              <Trash2 className="size-3.5" />
              清空
            </Button>
            <CopyButton value={input} label="复制" />
          </div>
        }
      >
        <Label htmlFor="json-input" className="sr-only">
          JSON 输入
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
        title="输出"
        hint={
          !input.trim() ? "等待输入" : result.ok ? "合法 JSON" : "JSON 不合法，请检查输入"
        }
        action={
          <div className="flex items-center gap-1">
            <div className="bg-muted flex items-center gap-0.5 rounded-md p-0.5 text-xs">
              {VIEW_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setViewMode(value)}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    viewMode === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {viewMode === "text" ? (
              <div className="bg-muted flex items-center gap-0.5 rounded-md p-0.5 text-xs">
                {OUTPUT_MODES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOutputMode(value)}
                    className={cn(
                      "rounded px-2 py-1 transition-colors",
                      outputMode === value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <CopyButton value={outputText} />
          </div>
        }
      >
        {!input.trim() ? (
          <p className="text-muted-foreground text-sm">在左侧粘贴或输入 JSON…</p>
        ) : !result.ok ? (
          <div className="space-y-1.5">
            <p className="text-destructive text-sm">{result.error.message}</p>
            {result.error.line ? (
              <p className="text-muted-foreground text-xs">
                第 {result.error.line} 行第 {result.error.column} 列附近
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
