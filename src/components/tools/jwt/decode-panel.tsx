"use client"

import { KeyRound } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { CopyButton } from "@/components/copy-button"
import { JsonBlock } from "@/components/json-block"
import { SegmentedControl } from "@/components/segmented-control"
import { ChecksList } from "@/components/tools/jwt/checks-list"
import { ClaimsTable } from "@/components/tools/jwt/claims-table"
import { HighlightedTextarea } from "@/components/tools/jwt/highlighted-textarea"
import { cardAction, JwtCard } from "@/components/tools/jwt/jwt-card"
import { JwtToolbar, toolbarButton } from "@/components/tools/jwt/jwt-toolbar"
import { SEGMENT_COLOR, SEGMENTS } from "@/components/tools/jwt/segment-colors"
import { SignatureCard } from "@/components/tools/jwt/signature-card"
import { TokenSegments } from "@/components/tools/jwt/token-preview"
import { TONE } from "@/components/tools/jwt/tones"
import { useSignatureCheck } from "@/components/tools/jwt/use-signature-check"
import { VerdictCard } from "@/components/tools/jwt/verdict-card"
import { useModifierKey } from "@/hooks/use-modifier-key"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { checkClaims, decodeToken, type JwtError } from "@/lib/jwt"
import { cn } from "@/lib/utils"

type PayloadView = "claims" | "json"

/** 焦点在别的输入框里时，粘贴归那个输入框，不抢 */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.closest("input, textarea, select") !== null
}

interface DecodePanelProps {
  /** 两种模式共用一个工具条开关，由外层传进来放在工具条最左边 */
  modeSwitch: React.ReactNode
  /** 只有当前可见的面板才接管页面级粘贴 */
  active: boolean
  token: string
  onTokenChange: (token: string) => void
  onSample: () => void
  secret: string
  onSecretChange: (secret: string) => void
  base64Secret: boolean
  onBase64SecretChange: (value: boolean) => void
}

export function DecodePanel({
  modeSwitch,
  active,
  token,
  onTokenChange,
  onSample,
  secret,
  onSecretChange,
  base64Secret,
  onBase64SecretChange,
}: DecodePanelProps) {
  const { dict, href } = useI18n()
  const text = dict.jwtTool.decode
  const modifier = useModifierKey()
  const nowSeconds = useNowSeconds()
  const [payloadView, setPayloadView] = useState<PayloadView>("claims")

  const result = useMemo(() => decodeToken(token), [token])
  const decoded = result.ok ? result.value : null
  const alg = decoded?.alg
  const signature = useSignatureCheck(
    token,
    decoded ? alg : undefined,
    secret,
    base64Secret ? "base64url" : "utf8"
  )
  const checks = useMemo(
    () => checkClaims(decoded?.payload ?? null, {}, nowSeconds),
    [decoded, nowSeconds]
  )

  // 空状态里写着「⌘V 直接读剪贴板」：焦点不在任何输入框时，在页面上粘贴也直接当作 Token
  useEffect(() => {
    if (!active) return
    function onPaste(event: ClipboardEvent) {
      if (isEditable(event.target)) return
      const pasted = event.clipboardData?.getData("text").trim()
      if (!pasted) return
      event.preventDefault()
      onTokenChange(pasted)
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [active, onTokenChange])

  /** JwtError -> 当前语言的句子 */
  const messageOf = (error: JwtError) => format(dict.errors.jwt[error.code], error.params ?? {})

  const trimmed = token.trim()
  const headerJson = decoded?.header ? JSON.stringify(decoded.header, null, 2) : ""
  const payloadJson = decoded?.payload ? JSON.stringify(decoded.payload, null, 2) : ""

  return (
    <div className="flex flex-col gap-[18px]">
      <JwtToolbar>
        {modeSwitch}
        <span className="text-muted-foreground text-[12.5px] max-lg:hidden">{text.hint}</span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onSample} className={toolbarButton}>
            {text.sample}
          </button>
          <button
            type="button"
            onClick={() => onTokenChange("")}
            disabled={!token}
            className={toolbarButton}
          >
            {dict.common.clear}
          </button>
        </div>
      </JwtToolbar>

      <JwtCard
        label={text.tokenLabel}
        meta={
          <div className="flex items-center gap-3 max-sm:hidden" aria-hidden>
            {SEGMENTS.map((segment) => (
              <span
                key={segment}
                className="text-muted-foreground flex items-center gap-1.5 text-[11.5px]"
              >
                <span className={cn("size-[7px] rounded-[2px]", SEGMENT_COLOR[segment].dot)} />
                {segment}
              </span>
            ))}
          </div>
        }
        action={
          trimmed ? (
            <span className="text-muted-foreground font-mono text-[11px]">
              {format(text.tokenMeta, {
                chars: trimmed.length,
                segments: trimmed.split(".").length,
              })}
            </span>
          ) : null
        }
      >
        <HighlightedTextarea
          id="jwt-token"
          label={text.tokenLabel}
          value={token}
          onChange={onTokenChange}
          placeholder={text.placeholder}
          invalid={Boolean(trimmed) && !result.ok}
          highlight={<TokenSegments value={token} />}
          className="min-h-24 p-4 text-base leading-[1.85] md:text-[13px]"
        />
      </JwtCard>

      {!trimmed ? (
        <div className="flex flex-col items-center gap-2.5 rounded-[12px] border border-dashed px-4 py-[22px] text-center">
          <span className="bg-muted text-muted-foreground flex size-[38px] items-center justify-center rounded-[12px]">
            <KeyRound className="size-[18px]" strokeWidth={1.75} />
          </span>
          <p className="text-[13.5px] font-medium">{text.emptyTitle}</p>
          <p className="text-muted-foreground text-xs text-pretty">
            {format(text.emptyBody, { shortcut: `${modifier}V` })}
          </p>
        </div>
      ) : !result.ok ? (
        <div className={cn("flex flex-col gap-[9px] rounded-[12px] border p-3.5", TONE.bad.box)}>
          <div className="flex items-center gap-[9px]">
            <span className={cn("size-[9px] rounded-full", TONE.bad.dot)} />
            <p className={cn("text-[13.5px] font-semibold", TONE.bad.ink)}>{text.invalidTitle}</p>
          </div>
          <p className="text-foreground/80 text-xs leading-[1.6]">{messageOf(result.error)}</p>
          {/* JWE 本来就不是 Base64 能解开的东西，只有段数不对时才值得去 Base64 工具看看 */}
          {result.error.code === "segmentCount" ? (
            <Link href={href("/tools/base64")} className={cn(toolbarButton, "self-start")}>
              {text.tryBase64}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid items-start gap-3.5 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex min-w-0 flex-col gap-3.5">
            <JwtCard
              segment="header"
              label="Header"
              action={<CopyButton value={headerJson} className={cardAction} />}
            >
              {decoded?.headerError ? (
                <p className="text-destructive px-4 py-3.5 text-[13px]">
                  {format(dict.errors.jwt.headerPrefix, {
                    message: messageOf(decoded.headerError),
                  })}
                </p>
              ) : (
                <JsonBlock
                  value={headerJson}
                  className="px-4 py-3.5 text-[12.5px] leading-[1.75]"
                />
              )}
            </JwtCard>

            <JwtCard
              segment="payload"
              label="Payload"
              action={
                decoded?.payload ? (
                  <>
                    <SegmentedControl
                      label={text.viewLabel}
                      value={payloadView}
                      onChange={setPayloadView}
                      options={[
                        { value: "claims" as const, label: text.viewClaims },
                        { value: "json" as const, label: text.viewJson },
                      ]}
                    />
                    {payloadView === "json" ? (
                      <CopyButton value={payloadJson} className={cardAction} />
                    ) : null}
                  </>
                ) : null
              }
            >
              {decoded?.payloadError ? (
                <p className="text-destructive px-4 py-3.5 text-[13px]">
                  {format(dict.errors.jwt.payloadPrefix, {
                    message: messageOf(decoded.payloadError),
                  })}
                </p>
              ) : payloadView === "claims" && decoded?.payload ? (
                <ClaimsTable payload={decoded.payload} nowSeconds={nowSeconds} />
              ) : (
                <JsonBlock
                  value={payloadJson}
                  className="px-4 py-3.5 text-[12.5px] leading-[1.75]"
                />
              )}
            </JwtCard>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <VerdictCard signature={signature} checks={checks} alg={alg} />
            <SignatureCard
              alg={alg}
              secret={secret}
              onSecretChange={onSecretChange}
              base64Secret={base64Secret}
              onBase64SecretChange={onBase64SecretChange}
              signature={signature}
            />
            <ChecksList signature={signature} checks={checks} alg={alg} nowSeconds={nowSeconds} />
          </div>
        </div>
      )}
    </div>
  )
}
