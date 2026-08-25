"use client"

import { AlertTriangle, KeyRound, Loader2, PenLine, Sparkles } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { JsonBlock } from "@/components/json-block"
import { Panel } from "@/components/tool-panel"
import { AlgorithmSelect } from "@/components/tools/jwt/algorithm-select"
import { KeyField } from "@/components/tools/jwt/key-field"
import { TokenPreview } from "@/components/tools/jwt/token-preview"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import {
  decodeToken,
  errorOf,
  generateKeyPairPem,
  isSymmetric,
  randomSecret,
  resolveKey,
  SAMPLE_SECRET,
  signToken,
  type JwtError,
  type SecretEncoding,
} from "@/lib/jwt"

const DEFAULT_PAYLOAD = JSON.stringify(
  { sub: "1234567890", name: "Ada Lovelace", roles: ["admin"] },
  null,
  2
)

export function SignPanel({ onUseToken }: { onUseToken: (token: string) => void }) {
  const dict = useDict()
  const text = dict.jwtTool.sign
  const [alg, setAlg] = useState("HS256")
  const [key, setKey] = useState(SAMPLE_SECRET)
  const [encoding, setEncoding] = useState<SecretEncoding>("utf8")
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)
  const [kid, setKid] = useState("")
  const [withIssuedAt, setWithIssuedAt] = useState(true)
  const [expiresIn, setExpiresIn] = useState("2h")
  const [publicKey, setPublicKey] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState<JwtError | null>(null)
  const [busy, setBusy] = useState(false)

  const symmetric = isSymmetric(alg)

  // 展示签名后真正写进 Token 的 payload（含自动补的 iat / exp）
  const signedPayload = useMemo(() => {
    if (!token) return ""
    const result = decodeToken(token)
    return result.ok && result.value.payload ? JSON.stringify(result.value.payload, null, 2) : ""
  }, [token])

  /** JwtError -> 当前语言的句子 */
  const messageOf = useCallback(
    (value: unknown) => {
      const err = errorOf(value)
      return format(dict.errors.jwt[err.code], err.params ?? {})
    },
    [dict]
  )

  const parsedPayload = useMemo(() => {
    try {
      const value: unknown = JSON.parse(payloadText)
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { ok: false as const, error: text.payloadNotObject }
      }
      return { ok: true as const, value: value as Record<string, unknown> }
    } catch (parseError) {
      return {
        ok: false as const,
        error: format(text.jsonSyntaxError, { message: messageOf(parseError) }),
      }
    }
  }, [payloadText, text, messageOf])

  async function handleGenerateKey() {
    setPublicKey("")
    if (symmetric) {
      setKey(randomSecret(32))
      toast.success(text.secretGenerated)
      return
    }
    setBusy(true)
    try {
      const pair = await generateKeyPairPem(alg)
      setKey(pair.privateKey)
      setPublicKey(pair.publicKey)
      toast.success(format(text.keyPairGenerated, { alg }))
    } catch (generateError) {
      toast.error(messageOf(generateError))
    } finally {
      setBusy(false)
    }
  }

  async function handleSign() {
    if (!parsedPayload.ok) return
    setBusy(true)
    setError(null)
    try {
      const resolved = await resolveKey(alg, key, "sign", encoding)
      const signed = await signToken({
        alg,
        payload: parsedPayload.value,
        key: resolved,
        header: kid.trim() ? { kid: kid.trim() } : undefined,
        setIssuedAt: withIssuedAt,
        expiresIn: expiresIn.trim() || undefined,
      })
      setToken(signed)
      toast.success(text.tokenGenerated)
    } catch (signError) {
      setToken("")
      setError(errorOf(signError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Panel accent="sky" title={text.keyTitle} hint={text.keyHint}>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AlgorithmSelect id="sign-alg" value={alg} onChange={setAlg} />
          <KeyField
            id="sign-key"
            alg={alg}
            usage="sign"
            value={key}
            onChange={setKey}
            encoding={encoding}
            onEncodingChange={setEncoding}
            actions={
              <Button variant="outline" size="sm" onClick={handleGenerateKey} disabled={busy}>
                <Sparkles className="size-3.5" />
                {symmetric ? text.randomSecret : text.generateKeyPair}
              </Button>
            }
          />
        </div>
      </Panel>

      {publicKey ? (
        <Alert>
          <KeyRound />
          <AlertTitle className="flex items-center justify-between gap-2">
            {text.publicKeyLabel}
            <CopyButton value={publicKey} />
          </AlertTitle>
          <AlertDescription>
            <pre className="mt-1 max-h-40 w-full overflow-auto font-mono text-[12px] whitespace-pre">
              {publicKey}
            </pre>
          </AlertDescription>
        </Alert>
      ) : null}

      <Panel
        accent="violet"
        title="Payload"
        hint={text.payloadHint}
        action={
          <Button variant="ghost" size="sm" onClick={() => setPayloadText(DEFAULT_PAYLOAD)}>
            {text.reset}
          </Button>
        }
      >
        <div className="space-y-2">
          <Textarea
            id="sign-payload"
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={!parsedPayload.ok}
            className="max-h-80 min-h-40 font-mono text-[13px]"
          />
          {parsedPayload.ok ? (
            <p className="text-muted-foreground text-xs">{text.autoClaimsNote}</p>
          ) : (
            <p className="text-destructive text-xs">{parsedPayload.error}</p>
          )}
        </div>

        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sign-kid">{text.kidLabel}</Label>
            <Input
              id="sign-kid"
              value={kid}
              onChange={(event) => setKid(event.target.value)}
              placeholder={text.kidPlaceholder}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-exp">{text.expLabel}</Label>
            <Input
              id="sign-exp"
              value={expiresIn}
              onChange={(event) => setExpiresIn(event.target.value)}
              placeholder={text.expPlaceholder}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-iat">{text.iatLabel}</Label>
            <div className="flex h-8 items-center gap-2">
              <Switch id="sign-iat" checked={withIssuedAt} onCheckedChange={setWithIssuedAt} />
              <span className="text-muted-foreground text-sm">{text.iatNote}</span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSign} disabled={busy || !parsedPayload.ok || !key.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <PenLine className="size-3.5" />}
          {text.generate}
        </Button>
        <p className="text-muted-foreground text-xs">{text.cryptoNote}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{text.failedTitle}</AlertTitle>
          <AlertDescription>
            {format(dict.errors.jwt[error.code], error.params ?? {})}
          </AlertDescription>
        </Alert>
      ) : null}

      {token ? (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {text.resultTitle}
          </h2>
          <Panel
            accent="sky"
            title="Token"
            hint={text.resultHint}
            action={
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onUseToken(token)}>
                  {text.openInDecode}
                </Button>
                <CopyButton value={token} />
              </div>
            }
          >
            <TokenPreview token={token} />
            {signedPayload ? (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs">{text.finalPayload}</p>
                <JsonBlock value={signedPayload} />
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}
    </div>
  )
}
