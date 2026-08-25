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
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import { decodeToken, isRegisteredHeader, SAMPLE_TOKEN } from "@/lib/jwt"

type PayloadView = "json" | "detail"

interface DecodePanelProps {
  token: string
  onTokenChange: (token: string) => void
  onGoVerify: () => void
}

export function DecodePanel({ token, onTokenChange, onGoVerify }: DecodePanelProps) {
  const dict = useDict()
  const text = dict.jwtTool.decode
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

  const payloadViews = [
    { value: "json" as const, label: text.viewJson },
    { value: "detail" as const, label: text.viewDetail },
  ]

  /** JwtError -> 当前语言的句子 */
  const messageOf = (error: {
    code: keyof typeof dict.errors.jwt
    params?: Record<string, string>
  }) => format(dict.errors.jwt[error.code], error.params ?? {})

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="jwt-token">JWT</Label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onTokenChange(SAMPLE_TOKEN)}>
              {text.sample}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onTokenChange("")} disabled={!token}>
              <Trash2 className="size-3.5" />
              {dict.common.clear}
            </Button>
            <CopyButton value={token} label={dict.common.copy} />
          </div>
        </div>
        <TokenInput
          id="jwt-token"
          value={token}
          onChange={onTokenChange}
          placeholder={text.placeholder}
          className="max-h-64 min-h-28"
        />
      </div>

      {!result.ok ? (
        token.trim() ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>{text.parseFailed}</AlertTitle>
            <AlertDescription>{messageOf(result.error)}</AlertDescription>
          </Alert>
        ) : null
      ) : (
        <>
          {result.value.alg === "none" ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>{text.algNoneTitle}</AlertTitle>
              <AlertDescription>{text.algNoneBody}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {text.resultTitle}
              </h2>
              <Button variant="outline" size="sm" onClick={onGoVerify}>
                <ShieldCheck className="size-3.5" />
                {text.goVerify}
              </Button>
            </div>

            <Panel
              accent="rose"
              title="Header"
              hint={text.headerHint}
              action={<CopyButton value={headerJson} />}
              footer={
                !isMinimalHeader && result.value.header ? (
                  <>
                    {headerEntries
                      .filter(([key]) => isRegisteredHeader(key))
                      .map(
                        ([key, value]) =>
                          `${key}: ${typeof value === "string" ? value : JSON.stringify(value)} · ${
                            dict.jwtTool.headers[key as keyof typeof dict.jwtTool.headers]
                          }`
                      )
                      .join("　") || text.noStandardFields}
                  </>
                ) : undefined
              }
            >
              {result.value.headerError ? (
                <p className="text-destructive text-sm">
                  {format(dict.errors.jwt.headerPrefix, {
                    message: messageOf(result.value.headerError),
                  })}
                </p>
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
                        {isRegisteredHeader(key) ? dict.jwtTool.headers[key] : null}
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
              hint={text.payloadHint}
              action={
                <div className="flex items-center gap-1">
                  {!result.value.payloadError && result.value.payload ? (
                    <SegmentedControl
                      value={payloadView}
                      onChange={setPayloadView}
                      options={payloadViews}
                    />
                  ) : null}
                  <CopyButton value={payloadJson} />
                </div>
              }
            >
              {result.value.payloadError ? (
                <p className="text-destructive text-sm">
                  {format(dict.errors.jwt.payloadPrefix, {
                    message: messageOf(result.value.payloadError),
                  })}
                </p>
              ) : payloadView === "detail" && result.value.payload ? (
                <>
                  <p className="text-muted-foreground mb-3 text-xs">{text.detailNote}</p>
                  <ClaimsTable payload={result.value.payload} nowSeconds={nowSeconds} />
                </>
              ) : (
                <JsonBlock value={payloadJson} />
              )}
            </Panel>

            <Panel
              accent="sky"
              title="Signature"
              hint={text.signatureHint}
              action={<CopyButton value={result.value.segments.signature} />}
            >
              <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all text-sky-600 dark:text-sky-400">
                {result.value.segments.signature || text.emptySignature}
              </p>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
