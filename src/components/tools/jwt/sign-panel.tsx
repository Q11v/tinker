"use client"

import { AlertTriangle, KeyRound, Loader2, PenLine, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
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
import {
  decodeToken,
  generateKeyPairPem,
  isSymmetric,
  messageOf,
  randomSecret,
  resolveKey,
  signToken,
  type SecretEncoding,
} from "@/lib/jwt"

const DEFAULT_PAYLOAD = JSON.stringify(
  { sub: "1234567890", name: "Ada Lovelace", roles: ["admin"] },
  null,
  2
)

export function SignPanel({ onUseToken }: { onUseToken: (token: string) => void }) {
  const [alg, setAlg] = useState("HS256")
  const [key, setKey] = useState("a-string-secret-at-least-256-bits-long")
  const [encoding, setEncoding] = useState<SecretEncoding>("utf8")
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD)
  const [kid, setKid] = useState("")
  const [withIssuedAt, setWithIssuedAt] = useState(true)
  const [expiresIn, setExpiresIn] = useState("2h")
  const [publicKey, setPublicKey] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const symmetric = isSymmetric(alg)

  // 展示签名后真正写进 Token 的 payload（含自动补的 iat / exp）
  const signedPayload = useMemo(() => {
    if (!token) return ""
    const result = decodeToken(token)
    return result.ok && result.value.payload
      ? JSON.stringify(result.value.payload, null, 2)
      : ""
  }, [token])

  const parsedPayload = useMemo(() => {
    try {
      const value: unknown = JSON.parse(payloadText)
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { ok: false as const, error: "Payload 必须是一个 JSON 对象" }
      }
      return { ok: true as const, value: value as Record<string, unknown> }
    } catch (parseError) {
      return { ok: false as const, error: `JSON 语法错误：${messageOf(parseError)}` }
    }
  }, [payloadText])

  async function handleGenerateKey() {
    setPublicKey("")
    if (symmetric) {
      setKey(randomSecret(32))
      toast.success("已生成 256 位随机密钥")
      return
    }
    setBusy(true)
    try {
      const pair = await generateKeyPairPem(alg)
      setKey(pair.privateKey)
      setPublicKey(pair.publicKey)
      toast.success(`已生成 ${alg} 密钥对`)
    } catch (generateError) {
      toast.error(messageOf(generateError))
    } finally {
      setBusy(false)
    }
  }

  async function handleSign() {
    if (!parsedPayload.ok) return
    setBusy(true)
    setError("")
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
      toast.success("Token 已生成")
    } catch (signError) {
      setToken("")
      setError(messageOf(signError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Panel accent="sky" title="签名密钥" hint="选择算法，生成或粘贴用于签名的密钥">
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
                {symmetric ? "随机密钥" : "生成密钥对"}
              </Button>
            }
          />
        </div>
      </Panel>

      {publicKey ? (
        <Alert>
          <KeyRound />
          <AlertTitle className="flex items-center justify-between gap-2">
            配套公钥（校验时使用）
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
        hint="写入 Token 的声明（claims）"
        action={
          <Button variant="ghost" size="sm" onClick={() => setPayloadText(DEFAULT_PAYLOAD)}>
            重置
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
            <p className="text-muted-foreground text-xs">
              iat 与 exp 由下面的开关自动写入，无需在这里手写。
            </p>
          ) : (
            <p className="text-destructive text-xs">{parsedPayload.error}</p>
          )}
        </div>

        <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="sign-kid">密钥 ID kid（可选）</Label>
            <Input
              id="sign-kid"
              value={kid}
              onChange={(event) => setKid(event.target.value)}
              placeholder="写入 header 的 kid"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-exp">有效期</Label>
            <Input
              id="sign-exp"
              value={expiresIn}
              onChange={(event) => setExpiresIn(event.target.value)}
              placeholder="2h / 7d / 30m，留空则不设 exp"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-iat">签发时间 iat</Label>
            <div className="flex h-8 items-center gap-2">
              <Switch id="sign-iat" checked={withIssuedAt} onCheckedChange={setWithIssuedAt} />
              <span className="text-muted-foreground text-sm">自动写入当前时间</span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleSign} disabled={busy || !parsedPayload.ok || !key.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <PenLine className="size-3.5" />}
          生成 Token
        </Button>
        <p className="text-muted-foreground text-xs">
          签名使用浏览器内置的 Web Crypto，密钥不会离开本机。
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>签名失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {token ? (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            生成结果
          </h2>
          <Panel
            accent="sky"
            title="Token"
            hint="签名后的完整 Token，可以直接继续在解码 / 校验里打开"
            action={
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onUseToken(token)}>
                  在解码中打开
                </Button>
                <CopyButton value={token} />
              </div>
            }
          >
            <TokenPreview token={token} />
            {signedPayload ? (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs">最终写入的 Payload</p>
                <JsonBlock value={signedPayload} />
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}
    </div>
  )
}
