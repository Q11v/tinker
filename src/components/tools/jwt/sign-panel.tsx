"use client"

import { Loader2, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { JsonTokens } from "@/components/json-block"
import { SegmentedControl } from "@/components/segmented-control"
import { HighlightedTextarea } from "@/components/tools/jwt/highlighted-textarea"
import { cardAction, JwtCard } from "@/components/tools/jwt/jwt-card"
import { JwtToolbar } from "@/components/tools/jwt/jwt-toolbar"
import { SecretInput } from "@/components/tools/jwt/secret-input"
import { TokenPreview } from "@/components/tools/jwt/token-preview"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  COMMON_SIGN_ALGORITHMS,
  errorOf,
  generateKeyPairPem,
  isSymmetric,
  resolveKey,
  SAMPLE_SECRET,
  signToken,
  type JwtError,
  type SignAlgorithm,
} from "@/lib/jwt"
import { generateUuidV4 } from "@/lib/uuid"
import { cn, monoField } from "@/lib/utils"

const DEFAULT_PAYLOAD = JSON.stringify(
  { sub: "1234567890", name: "Tinker User", aud: "tinker.dev" },
  null,
  2
)

type Chip = "iatNow" | "exp1h" | "exp7d" | "jti"

/** 快捷插入：直接改写 Payload 里的对应字段，已有的键原地更新、不挪位置 */
function applyChip(chip: Chip, payload: Record<string, unknown>): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000)
  switch (chip) {
    case "iatNow":
      return { ...payload, iat: now }
    case "exp1h":
      return { ...payload, exp: now + 3600 }
    case "exp7d":
      return { ...payload, exp: now + 7 * 24 * 3600 }
    case "jti":
      return { ...payload, jti: generateUuidV4() }
  }
}

const CHIPS: Chip[] = ["iatNow", "exp1h", "exp7d", "jti"]

type SignState =
  | { kind: "idle"; message: string }
  | { kind: "pending" }
  | { kind: "done"; token: string }
  | { kind: "failed"; error: JwtError }

/**
 * 签发：左边改 Payload，右边实时出 Token。
 * 设计稿在密钥卡片底部画了一枚「签发 Token」按钮，但同一张稿的工具条写着「右侧实时生成」——
 * 既然输入即签，那枚按钮就没有要做的事了，这里不画它。
 */
export function SignPanel({
  modeSwitch,
  onOpenInDecode,
}: {
  modeSwitch: React.ReactNode
  /** 非对称算法交出去的是配套公钥：解码页要验签，拿私钥没用 */
  onOpenInDecode: (token: string, key: string) => void
}) {
  const dict = useDict()
  const text = dict.jwtTool.sign
  const [alg, setAlg] = useState<SignAlgorithm>("HS256")
  // 共享密钥与私钥分开存：来回切算法时，PEM 不会把密钥框挤掉，反之亦然
  const [secret, setSecret] = useState(SAMPLE_SECRET)
  const [privateKey, setPrivateKey] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [generating, setGenerating] = useState(false)
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)

  const symmetric = isSymmetric(alg)
  const key = symmetric ? secret : privateKey

  async function handleGenerateKeyPair() {
    setGenerating(true)
    try {
      const pair = await generateKeyPairPem(alg)
      setPrivateKey(pair.privateKey)
      setPublicKey(pair.publicKey)
      toast.success(format(text.keyPairGenerated, { alg }))
    } catch (generateError) {
      const err = errorOf(generateError)
      toast.error(format(dict.errors.jwt[err.code], err.params ?? {}))
    } finally {
      setGenerating(false)
    }
  }

  const parsed = useMemo(() => {
    try {
      const value: unknown = JSON.parse(payloadText)
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { ok: false as const, error: text.payloadNotObject }
      }
      return { ok: true as const, value: value as Record<string, unknown> }
    } catch (parseError) {
      const err = errorOf(parseError)
      return {
        ok: false as const,
        error: format(text.jsonSyntaxError, {
          message: format(dict.errors.jwt[err.code], err.params ?? {}),
        }),
      }
    }
  }, [payloadText, text, dict])

  // 与校验一样：输入不完整时直接在渲染期给结论，完整了才走异步签名
  const gate: SignState | null = !parsed.ok
    ? { kind: "idle", message: text.needPayload }
    : !key.trim()
      ? { kind: "idle", message: symmetric ? text.needSecret : text.needPrivateKey }
      : null

  // 用规范化后的 JSON 做键：只改了缩进不必重签
  const input = parsed.ok ? JSON.stringify([parsed.value, alg, key]) : ""
  const [result, setResult] = useState<{ input: string; state: SignState } | null>(null)

  useEffect(() => {
    if (!parsed.ok || !key.trim()) return
    let cancelled = false
    const payload = parsed.value
    const timer = setTimeout(async () => {
      let state: SignState
      try {
        const material = await resolveKey(alg, key, "sign")
        state = { kind: "done", token: await signToken({ alg, payload, key: material }) }
      } catch (signError) {
        state = { kind: "failed", error: errorOf(signError) }
      }
      if (!cancelled) setResult({ input: JSON.stringify([payload, alg, key]), state })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [parsed, alg, key])

  const state: SignState = gate ?? (result?.input === input ? result.state : { kind: "pending" })
  const token = state.kind === "done" ? state.token : ""

  return (
    <div className="flex flex-col gap-[18px]">
      <JwtToolbar>
        {modeSwitch}
        <span className="text-muted-foreground text-[12.5px] max-lg:hidden">{text.hint}</span>
        <span className="text-muted-foreground ml-auto font-mono text-[11.5px]">{alg}</span>
      </JwtToolbar>

      <div className="grid items-start gap-3.5 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3.5">
          <JwtCard
            segment="payload"
            label={text.payloadLabel}
            action={
              <Button
                variant="ghost"
                size="sm"
                className={cardAction}
                disabled={!parsed.ok}
                onClick={() => parsed.ok && setPayloadText(JSON.stringify(parsed.value, null, 2))}
              >
                {text.format}
              </Button>
            }
          >
            <HighlightedTextarea
              id="jwt-sign-payload"
              label={text.payloadLabel}
              value={payloadText}
              onChange={setPayloadText}
              invalid={!parsed.ok}
              highlight={<JsonTokens value={payloadText} />}
              className="min-h-[168px] px-4 py-3.5 text-base leading-[1.8] md:text-[12.5px]"
            />
            {!parsed.ok ? (
              <p className="text-destructive border-t px-4 py-2.5 text-xs">{parsed.error}</p>
            ) : null}
          </JwtCard>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">{text.quickInsert}</span>
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={!parsed.ok}
                onClick={() =>
                  parsed.ok &&
                  setPayloadText(JSON.stringify(applyChip(chip, parsed.value), null, 2))
                }
                className="hover:border-border-hover hover:bg-surface-hover rounded-full border px-[11px] py-[5px] font-mono text-[11.5px] transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {text.chips[chip]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="bg-surface dark:bg-surface-sunken flex flex-col gap-3 rounded-[16px] border px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
              <span className="text-muted-foreground text-xs">{text.algorithm}</span>
              <SegmentedControl
                label={text.algorithm}
                value={alg}
                onChange={setAlg}
                options={COMMON_SIGN_ALGORITHMS.map((value) => ({ value, label: value }))}
                className="flex-wrap"
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Label htmlFor="jwt-sign-key" className="text-muted-foreground text-xs font-normal">
                  {symmetric ? text.secretLabel : text.privateLabel}
                </Label>
                {/* 手上没有现成 PEM 的时候，本机生成一对是最快的试法 */}
                {!symmetric ? (
                  <button
                    type="button"
                    onClick={handleGenerateKeyPair}
                    disabled={generating}
                    className="text-accent-cool hover:bg-surface-hover ml-auto flex items-center gap-1.5 rounded-[6px] px-1.5 py-0.5 text-xs transition-colors disabled:opacity-60"
                  >
                    {generating ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Sparkles className="size-3" />
                    )}
                    {generating ? text.generating : text.generateKeyPair}
                  </button>
                ) : null}
              </div>

              {symmetric ? (
                <SecretInput
                  id="jwt-sign-key"
                  value={secret}
                  onChange={setSecret}
                  placeholder={text.secretPlaceholder}
                  defaultVisible
                />
              ) : (
                <>
                  <Textarea
                    id="jwt-sign-key"
                    value={privateKey}
                    onChange={(event) => setPrivateKey(event.target.value)}
                    placeholder={text.privatePlaceholder}
                    spellCheck={false}
                    autoComplete="off"
                    className={cn(monoField, "max-h-56 min-h-28 md:text-[12px]")}
                  />
                  <p className="text-muted-foreground text-[11.5px]">{text.privateNote}</p>
                </>
              )}
            </div>

            {/* 自己生成的密钥对，公钥得能拿走：不然签出来的 Token 没人能验 */}
            {!symmetric && publicKey ? (
              <div className="flex flex-col gap-1.5 border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{text.publicKeyLabel}</span>
                  <CopyButton value={publicKey} className={cn(cardAction, "ml-auto")} />
                </div>
                <pre className="bg-surface-sunken text-foreground/80 max-h-28 overflow-auto rounded-[10px] p-2.5 font-mono text-[11px] leading-[1.5]">
                  {publicKey}
                </pre>
              </div>
            ) : null}
          </div>

          <JwtCard
            label={text.resultLabel}
            action={
              <>
                <CopyButton value={token} className={cardAction} />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cardAction}
                  disabled={!token}
                  onClick={() => onOpenInDecode(token, symmetric ? secret : publicKey)}
                >
                  {text.openInDecode}
                </Button>
              </>
            }
          >
            <div aria-live="polite" className="px-4 py-3.5">
              {state.kind === "done" ? (
                <TokenPreview token={state.token} />
              ) : state.kind === "failed" ? (
                <p className="text-destructive text-[13px]">
                  {format(text.failed, {
                    message: format(dict.errors.jwt[state.error.code], state.error.params ?? {}),
                  })}
                </p>
              ) : (
                <p className="text-muted-foreground text-[13px]">
                  {state.kind === "idle" ? state.message : text.signing}
                </p>
              )}
            </div>
          </JwtCard>
        </div>
      </div>
    </div>
  )
}
