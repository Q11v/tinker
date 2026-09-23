"use client"

import { JwtCard } from "@/components/tools/jwt/jwt-card"
import { SecretInput } from "@/components/tools/jwt/secret-input"
import { TONE } from "@/components/tools/jwt/tones"
import type { SignatureState } from "@/components/tools/jwt/use-signature-check"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useDict } from "@/i18n/context"
import { isSupportedAlg, isSymmetric } from "@/lib/jwt"
import { cn, monoField } from "@/lib/utils"

/** 密钥框下方右端的一行结论，和上面的结论卡片说的是同一件事，只是贴着输入框、不用抬眼 */
function KeyStatus({ signature }: { signature: SignatureState }) {
  const text = useDict().jwtTool.signature
  if (signature.kind === "valid") {
    return <span className={TONE.good.ink}>✓ {text.matched}</span>
  }
  if (signature.kind === "invalid") {
    return <span className={TONE.bad.ink}>✕ {text.mismatched}</span>
  }
  if (signature.kind === "pending") {
    return <span className="text-muted-foreground">{text.verifying}</span>
  }
  return null
}

export function SignatureCard({
  alg,
  secret,
  onSecretChange,
  base64Secret,
  onBase64SecretChange,
  signature,
}: {
  alg: string | undefined
  secret: string
  onSecretChange: (value: string) => void
  base64Secret: boolean
  onBase64SecretChange: (value: boolean) => void
  signature: SignatureState
}) {
  const dict = useDict()
  const text = dict.jwtTool.signature
  // none 与不认识的算法没有密钥可填，只留算法那一行说明情况
  const keyed = isSupportedAlg(alg)
  const symmetric = keyed && isSymmetric(alg)

  return (
    <JwtCard segment="signature" label={text.title}>
      <div className="flex flex-col gap-3 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">{text.algorithm}</span>
          <span className="bg-muted dark:bg-surface-hover rounded-[7px] px-2.5 py-1 font-mono text-[11.5px]">
            {alg ?? "—"}
          </span>
          <span className="text-muted-foreground text-[11.5px]">{text.fromHeader}</span>
        </div>

        {keyed ? (
          <div className="flex flex-col gap-[7px]">
            <Label htmlFor="jwt-verify-key" className="text-muted-foreground text-xs font-normal">
              {symmetric ? text.secretLabel : text.publicLabel}
            </Label>
            {symmetric ? (
              <SecretInput
                id="jwt-verify-key"
                value={secret}
                onChange={onSecretChange}
                placeholder={text.secretPlaceholder}
              />
            ) : (
              <Textarea
                id="jwt-verify-key"
                value={secret}
                onChange={(event) => onSecretChange(event.target.value)}
                placeholder={text.publicPlaceholder}
                spellCheck={false}
                autoComplete="off"
                className={cn(monoField, "max-h-56 min-h-28 md:text-[12px]")}
              />
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px]">
              {symmetric ? (
                <Label
                  htmlFor="jwt-verify-base64"
                  className="text-muted-foreground gap-[7px] text-[11.5px] font-normal"
                >
                  <Switch
                    id="jwt-verify-base64"
                    size="sm"
                    checked={base64Secret}
                    onCheckedChange={onBase64SecretChange}
                  />
                  {text.base64Secret}
                </Label>
              ) : (
                <span className="text-muted-foreground">{text.publicNote}</span>
              )}
              <span className="ml-auto" aria-hidden>
                <KeyStatus signature={signature} />
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </JwtCard>
  )
}
