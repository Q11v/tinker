"use client"

import { AlertTriangle, ShieldCheck, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { JsonBlock } from "@/components/json-block"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { ClaimsTable } from "@/components/tools/jwt/claims-table"
import { TokenInput } from "@/components/tools/jwt/token-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { decodeToken, REGISTERED_HEADERS, SAMPLE_TOKEN } from "@/lib/jwt"

type PayloadView = "json" | "detail"

const PAYLOAD_VIEWS: { value: PayloadView; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "detail", label: "详情" },
]

interface DecodePanelProps {
  token: string
  onTokenChange: (token: string) => void
  onGoVerify: () => void
}

export function DecodePanel({ token, onTokenChange, onGoVerify }: DecodePanelProps) {
  const result = useMemo(() => decodeToken(token), [token])
  const nowSeconds = useNowSeconds()
  const [payloadView, setPayloadView] = useState<PayloadView>("json")
  const headerJson =
    result.ok && result.value.header ? JSON.stringify(result.value.header, null, 2) : ""
  const payloadJson =
    result.ok && result.value.payload ? JSON.stringify(result.value.payload, null, 2) : ""

  // Header 只有 alg/typ 这两个最常见字段时，用一行摘要代替完整 JSON，减少和 footer 的重复
  const headerEntries = result.ok && result.value.header ? Object.entries(result.value.header) : []
  const isMinimalHeader =
    headerEntries.length > 0 && headerEntries.every(([key]) => key === "alg" || key === "typ")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="jwt-token">JWT</Label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onTokenChange(SAMPLE_TOKEN)}>
              示例
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onTokenChange("")} disabled={!token}>
              <Trash2 className="size-3.5" />
              清空
            </Button>
            <CopyButton value={token} label="复制" />
          </div>
        </div>
        <TokenInput
          id="jwt-token"
          value={token}
          onChange={onTokenChange}
          placeholder="粘贴 eyJhbGciOi… 形式的 JWT"
          className="max-h-64 min-h-28"
        />
      </div>

      {!result.ok ? (
        token.trim() ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>无法解析</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        ) : null
      ) : (
        <>
          {result.value.alg === "none" ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>alg 为 none</AlertTitle>
              <AlertDescription>
                这个 Token 没有签名保护，任何人都能伪造，生产环境务必拒绝这类算法。
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                解码结果
              </h2>
              <Button variant="outline" size="sm" onClick={onGoVerify}>
                <ShieldCheck className="size-3.5" />
                去校验签名
              </Button>
            </div>

            <Panel
              accent="rose"
              title="Header"
              hint="描述签名算法与密钥信息"
              action={<CopyButton value={headerJson} />}
              footer={
                !isMinimalHeader && result.value.header ? (
                  <>
                    {headerEntries
                      .filter(([key]) => REGISTERED_HEADERS[key])
                      .map(
                        ([key, value]) =>
                          `${key}: ${typeof value === "string" ? value : JSON.stringify(value)} · ${REGISTERED_HEADERS[key]}`
                      )
                      .join("　") || "无标准字段"}
                  </>
                ) : undefined
              }
            >
              {result.value.headerError ? (
                <p className="text-destructive text-sm">{result.value.headerError}</p>
              ) : isMinimalHeader ? (
                <div className="flex flex-col gap-2">
                  {headerEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-rose-500/30 bg-rose-500/10 font-mono text-rose-600 dark:text-rose-400"
                      >
                        {key}: {String(value)}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {REGISTERED_HEADERS[key]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <JsonBlock value={headerJson} />
              )}
            </Panel>

            <Panel
              accent="violet"
              title="Payload"
              hint="携带的声明（claims）"
              action={
                <div className="flex items-center gap-1">
                  {!result.value.payloadError && result.value.payload ? (
                    <SegmentedControl
                      value={payloadView}
                      onChange={setPayloadView}
                      options={PAYLOAD_VIEWS}
                    />
                  ) : null}
                  <CopyButton value={payloadJson} />
                </div>
              }
            >
              {result.value.payloadError ? (
                <p className="text-destructive text-sm">{result.value.payloadError}</p>
              ) : payloadView === "detail" && result.value.payload ? (
                <>
                  <p className="text-muted-foreground mb-3 text-xs">
                    时间类声明会自动换算成本地时间。
                  </p>
                  <ClaimsTable payload={result.value.payload} nowSeconds={nowSeconds} />
                </>
              ) : (
                <JsonBlock value={payloadJson} />
              )}
            </Panel>

            <Panel
              accent="sky"
              title="Signature"
              hint="Base64URL 原文。解码不校验签名，请在「校验」标签页里用密钥验证。"
              action={<CopyButton value={result.value.segments.signature} />}
            >
              <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all text-sky-600 dark:text-sky-400">
                {result.value.segments.signature || "（空签名）"}
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
