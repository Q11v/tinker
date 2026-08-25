"use client"

import { CheckCircle2, CircleDashed, Loader2, MinusCircle, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Panel } from "@/components/tool-panel"
import { AlgorithmSelect } from "@/components/tools/jwt/algorithm-select"
import { KeyField } from "@/components/tools/jwt/key-field"
import { TokenInput } from "@/components/tools/jwt/token-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { LOCALE_HTML_LANG } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import type { Dictionary } from "@/i18n/dictionaries"
import { format } from "@/i18n/format"
import {
  ALGORITHMS,
  checkClaims,
  decodeToken,
  errorOf,
  formatRelative,
  formatUnixSeconds,
  resolveKey,
  verifySignature,
  type CheckStatus,
  type ClaimCheck,
  type JwtError,
  type SecretEncoding,
} from "@/lib/jwt"
import { cn } from "@/lib/utils"

type VerifyState =
  | { kind: "idle"; message: string }
  | { kind: "pending" }
  | { kind: "valid" }
  | { kind: "invalid"; error: JwtError }

/**
 * 检查项的说明句子在这里组装。
 * lib 只给出结构化数据（时间戳、期望值、实际值），
 * 因为「时间（相对时间） · 已过期」这种语序各语言并不一致。
 */
function describeCheck(check: ClaimCheck, dict: Dictionary, nowSeconds: number, bcp47: string) {
  const text = dict.jwtTool.verify.details

  if (check.kind === "exp" || check.kind === "nbf") {
    if (check.seconds === null) return text.expNotSet
    const values = {
      time: formatUnixSeconds(check.seconds, bcp47) ?? dict.jwtTool.decode.invalidTime,
      relative: formatRelative(check.seconds, nowSeconds, bcp47),
    }
    if (check.status !== "fail") return format(text.time, values)
    return format(check.kind === "exp" ? text.expired : text.notYet, values)
  }

  const values = { expected: check.expected, actual: check.actual }
  if (check.kind === "iss") {
    return format(check.status === "pass" ? text.issMatch : text.issMismatch, values)
  }
  return format(check.status === "pass" ? text.audMatch : text.audMismatch, values)
}

interface VerifyPanelProps {
  token: string
  onTokenChange: (token: string) => void
  secret: string
  onSecretChange: (secret: string) => void
}

export function VerifyPanel({ token, onTokenChange, secret, onSecretChange }: VerifyPanelProps) {
  const { locale, dict } = useI18n()
  const text = dict.jwtTool.verify
  const bcp47 = LOCALE_HTML_LANG[locale]
  const decoded = useMemo(() => decodeToken(token), [token])
  const tokenAlg = decoded.ok ? decoded.value.alg : undefined

  const [alg, setAlg] = useState("HS256")
  const [encoding, setEncoding] = useState<SecretEncoding>("utf8")
  const [issuer, setIssuer] = useState("")
  const [audience, setAudience] = useState("")
  const [tolerance, setTolerance] = useState("0")
  const [result, setResult] = useState<{ input: string; state: VerifyState } | null>(null)

  // 算法默认跟随 Token header，用户仍可手动改成期望的算法
  const [seenTokenAlg, setSeenTokenAlg] = useState(tokenAlg)
  if (tokenAlg !== seenTokenAlg) {
    setSeenTokenAlg(tokenAlg)
    if (tokenAlg && (ALGORITHMS as readonly string[]).includes(tokenAlg)) setAlg(tokenAlg)
  }

  // 输入不完整时的状态直接在渲染期算出来，不用等异步校验
  const gate: VerifyState | null = useMemo(() => {
    if (!token.trim()) return { kind: "idle", message: text.needToken }
    if (!decoded.ok) return { kind: "invalid", error: decoded.error }
    if (!secret.trim()) return { kind: "idle", message: text.needSecret }
    return null
  }, [token, decoded, secret, text])

  const input = JSON.stringify([token, secret, alg, encoding])

  useEffect(() => {
    if (gate) return
    let cancelled = false
    const timer = setTimeout(async () => {
      let state: VerifyState
      try {
        const key = await resolveKey(alg, secret, "verify", encoding)
        await verifySignature(token, key, alg)
        state = { kind: "valid" }
      } catch (error) {
        state = { kind: "invalid", error: errorOf(error) }
      }
      if (!cancelled) {
        setResult({ input: JSON.stringify([token, secret, alg, encoding]), state })
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [gate, token, secret, alg, encoding])

  // 结果与当前输入不匹配（正在防抖或校验中）时显示 pending，避免展示过期结论
  const state: VerifyState = gate ?? (result?.input === input ? result.state : { kind: "pending" })

  const nowSeconds = useNowSeconds()
  const checks = useMemo(
    () =>
      checkClaims(
        decoded.ok ? decoded.value.payload : null,
        {
          issuer: issuer.trim() || undefined,
          audience: audience.trim() || undefined,
          clockToleranceSeconds: Number.parseInt(tolerance, 10) || 0,
        },
        nowSeconds
      ),
    [decoded, issuer, audience, tolerance, nowSeconds]
  )

  const claimsFailed = checks.some((check) => check.status === "fail")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="verify-token">JWT</Label>
        <TokenInput
          id="verify-token"
          value={token}
          onChange={onTokenChange}
          placeholder={text.placeholder}
          className="max-h-52 min-h-24"
        />
      </div>

      <Panel
        accent="sky"
        title={text.keyTitle}
        hint={text.keyHint}
        footer={
          tokenAlg && tokenAlg !== alg ? (
            <span className="text-destructive">
              {format(text.algMismatchNotice, { tokenAlg, alg })}
            </span>
          ) : undefined
        }
      >
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AlgorithmSelect id="verify-alg" value={alg} onChange={setAlg} label={text.expectedAlg} />
          <KeyField
            id="verify-key"
            alg={alg}
            usage="verify"
            value={secret}
            onChange={onSecretChange}
            encoding={encoding}
            onEncodingChange={setEncoding}
          />
        </div>
      </Panel>

      <div className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {text.resultTitle}
        </h2>
        <StatusBanner state={state} claimsFailed={claimsFailed} dict={dict} />
      </div>

      <Panel accent="violet" title={text.claimsTitle} hint={text.claimsHint}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="verify-iss">{text.expectedIss}</Label>
              <Input
                id="verify-iss"
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
                placeholder="https://auth.example.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-aud">{text.expectedAud}</Label>
              <Input
                id="verify-aud"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="my-api"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-tolerance">{text.tolerance}</Label>
              <Input
                id="verify-tolerance"
                value={tolerance}
                onChange={(event) => setTolerance(event.target.value)}
                inputMode="numeric"
                placeholder="0"
                autoComplete="off"
              />
            </div>
          </div>

          {checks.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {checks.map((check) => (
                <li key={check.kind} className="flex items-start gap-3 px-4 py-3">
                  <CheckIcon status={check.status} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">{text.checks[check.kind]}</p>
                    <p className="text-muted-foreground text-xs break-all">
                      {describeCheck(check, dict, nowSeconds, bcp47)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Panel>
    </div>
  )
}

function CheckIcon({ status }: { status: CheckStatus }) {
  if (status === "pass")
    return (
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
    )
  if (status === "fail") return <XCircle className="text-destructive mt-0.5 size-4 shrink-0" />
  return <MinusCircle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
}

function StatusBanner({
  state,
  claimsFailed,
  dict,
}: {
  state: VerifyState
  claimsFailed: boolean
  dict: Dictionary
}) {
  const text = dict.jwtTool.verify

  if (state.kind === "idle") {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm">
        <CircleDashed className="size-4" />
        {state.message}
      </div>
    )
  }

  if (state.kind === "pending") {
    return (
      <div className="text-muted-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {text.verifying}
      </div>
    )
  }

  if (state.kind === "invalid") {
    return (
      <Alert variant="destructive">
        <XCircle />
        <AlertTitle>{text.failedTitle}</AlertTitle>
        <AlertDescription>
          {format(dict.errors.jwt[state.error.code], state.error.params ?? {})}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        claimsFailed
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-emerald-500/40 bg-emerald-500/5"
      )}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{text.validTitle}</p>
        <p className="text-muted-foreground text-xs">
          {claimsFailed ? text.validButClaims : text.validAll}
        </p>
      </div>
    </div>
  )
}
