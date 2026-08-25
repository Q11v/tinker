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
import {
  ALGORITHMS,
  checkClaims,
  decodeToken,
  messageOf,
  resolveKey,
  verifySignature,
  type CheckStatus,
  type SecretEncoding,
} from "@/lib/jwt"
import { cn } from "@/lib/utils"

type VerifyState =
  | { kind: "idle"; message: string }
  | { kind: "pending" }
  | { kind: "valid" }
  | { kind: "invalid"; message: string }

interface VerifyPanelProps {
  token: string
  onTokenChange: (token: string) => void
  secret: string
  onSecretChange: (secret: string) => void
}

export function VerifyPanel({ token, onTokenChange, secret, onSecretChange }: VerifyPanelProps) {
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
    if (!token.trim()) return { kind: "idle", message: "请输入要校验的 JWT。" }
    if (!decoded.ok) return { kind: "invalid", message: decoded.error }
    if (!secret.trim()) return { kind: "idle", message: "请输入密钥后自动校验。" }
    return null
  }, [token, decoded, secret])

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
        state = { kind: "invalid", message: messageOf(error) }
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
          placeholder="粘贴要校验的 JWT"
          className="max-h-52 min-h-24"
        />
      </div>

      <Panel
        accent="sky"
        title="校验密钥"
        hint="选择算法，并提供用于验证签名的密钥"
        footer={
          tokenAlg && tokenAlg !== alg ? (
            <span className="text-destructive">
              注意：Token header 声明的算法是 <code className="font-mono">{tokenAlg}</code>
              ，与当前选择的 <code className="font-mono">{alg}</code> 不一致，校验一定会失败。
            </span>
          ) : undefined
        }
      >
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AlgorithmSelect id="verify-alg" value={alg} onChange={setAlg} label="期望算法" />
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
          校验结果
        </h2>
        <StatusBanner state={state} claimsFailed={claimsFailed} />
      </div>

      <Panel
        accent="violet"
        title="声明校验（可选）"
        hint="签名之外的检查：有效期总是会检查，签发者与受众填写后才检查"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="verify-iss">期望签发者 iss</Label>
              <Input
                id="verify-iss"
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
                placeholder="https://auth.example.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-aud">期望受众 aud</Label>
              <Input
                id="verify-aud"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="my-api"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-tolerance">时钟容差（秒）</Label>
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
                <li key={check.label} className="flex items-start gap-3 px-4 py-3">
                  <CheckIcon status={check.status} />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-muted-foreground text-xs break-all">{check.detail}</p>
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

function StatusBanner({ state, claimsFailed }: { state: VerifyState; claimsFailed: boolean }) {
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
        正在校验…
      </div>
    )
  }

  if (state.kind === "invalid") {
    return (
      <Alert variant="destructive">
        <XCircle />
        <AlertTitle>签名校验未通过</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
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
        <p className="text-sm font-medium">签名有效</p>
        <p className="text-muted-foreground text-xs">
          {claimsFailed
            ? "密钥与签名匹配，但下面的声明检查没有全部通过，服务端仍会拒绝这个 Token。"
            : "密钥与签名匹配，声明检查也全部通过。"}
        </p>
      </div>
    </div>
  )
}
