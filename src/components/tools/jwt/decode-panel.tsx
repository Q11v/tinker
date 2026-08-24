"use client"

import { AlertTriangle, ShieldCheck, Trash2 } from "lucide-react"
import { useMemo } from "react"

import { CopyButton } from "@/components/copy-button"
import { ClaimsTable } from "@/components/tools/jwt/claims-table"
import { JsonBlock } from "@/components/tools/jwt/json-block"
import { TokenPreview } from "@/components/tools/jwt/token-preview"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { decodeToken, REGISTERED_HEADERS, SAMPLE_TOKEN } from "@/lib/jwt"

interface DecodePanelProps {
  token: string
  onTokenChange: (token: string) => void
  onGoVerify: () => void
}

export function DecodePanel({ token, onTokenChange, onGoVerify }: DecodePanelProps) {
  const result = useMemo(() => decodeToken(token), [token])
  const nowSeconds = useNowSeconds()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="jwt-token">JWT</Label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => onTokenChange(SAMPLE_TOKEN)}>
              示例
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTokenChange("")}
              disabled={!token}
            >
              <Trash2 className="size-3.5" />
              清空
            </Button>
            <CopyButton value={token} label="复制" />
          </div>
        </div>
        <Textarea
          id="jwt-token"
          value={token}
          onChange={(event) => onTokenChange(event.target.value)}
          placeholder="粘贴 eyJhbGciOi… 形式的 JWT"
          spellCheck={false}
          autoComplete="off"
          className="max-h-64 min-h-28 font-mono text-[13px]"
        />
        <TokenPreview token={token} />
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
          <div className="flex flex-wrap items-center gap-2">
            {result.value.alg ? (
              <Badge variant="secondary" className="font-mono">
                alg: {result.value.alg}
              </Badge>
            ) : null}
            {typeof result.value.header?.typ === "string" ? (
              <Badge variant="outline" className="font-mono">
                typ: {String(result.value.header.typ)}
              </Badge>
            ) : null}
            {typeof result.value.header?.kid === "string" ? (
              <Badge variant="outline" className="font-mono">
                kid: {String(result.value.header.kid)}
              </Badge>
            ) : null}
            <Button variant="outline" size="sm" className="ml-auto" onClick={onGoVerify}>
              <ShieldCheck className="size-3.5" />
              去校验签名
            </Button>
          </div>

          {result.value.alg === "none" ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>alg 为 none</AlertTitle>
              <AlertDescription>
                这个 Token 没有签名保护，任何人都能伪造，生产环境务必拒绝这类算法。
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Section
              title="Header"
              hint="描述签名算法与密钥信息"
              content={result.value.header}
              error={result.value.headerError}
              labels={REGISTERED_HEADERS}
            />
            <Section
              title="Payload"
              hint="携带的声明（claims）"
              content={result.value.payload}
              error={result.value.payloadError}
            />
          </div>

          {result.value.payload ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">声明明细</h3>
                <p className="text-muted-foreground text-xs">
                  时间类声明会自动换算成本地时间。
                </p>
              </div>
              <ClaimsTable payload={result.value.payload} nowSeconds={nowSeconds} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <h3 className="text-sm font-medium">Signature</h3>
                <p className="text-muted-foreground text-xs">
                  Base64URL 原文。解码不校验签名，请在「校验」标签页里用密钥验证。
                </p>
              </div>
              <CopyButton value={result.value.segments.signature} />
            </div>
            <p className="bg-muted/50 rounded-lg border p-3 font-mono text-[13px] break-all text-sky-600 dark:text-sky-400">
              {result.value.segments.signature || "（空签名）"}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

function Section({
  title,
  hint,
  content,
  error,
  labels,
}: {
  title: string
  hint: string
  content: Record<string, unknown> | null
  error?: string
  labels?: Record<string, string>
}) {
  const json = content ? JSON.stringify(content, null, 2) : ""

  return (
    <div className="bg-card flex flex-col rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
        <CopyButton value={json} />
      </div>
      <div className="p-4">
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : (
          <JsonBlock value={json} />
        )}
      </div>
      {labels && content ? (
        <div className="text-muted-foreground mt-auto border-t px-4 py-2 text-xs">
          {Object.keys(content)
            .filter((key) => labels[key])
            .map((key) => `${key} · ${labels[key]}`)
            .join("　") || "无标准字段"}
        </div>
      ) : null}
    </div>
  )
}
