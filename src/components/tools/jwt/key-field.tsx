"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isSymmetric, SECRET_ENCODING_LABELS, type SecretEncoding } from "@/lib/jwt"

interface KeyFieldProps {
  id: string
  alg: string
  usage: "verify" | "sign"
  value: string
  onChange: (value: string) => void
  encoding: SecretEncoding
  onEncodingChange: (encoding: SecretEncoding) => void
  actions?: React.ReactNode
}

export function KeyField({
  id,
  alg,
  usage,
  value,
  onChange,
  encoding,
  onEncodingChange,
  actions,
}: KeyFieldProps) {
  const symmetric = isSymmetric(alg)
  const label = symmetric
    ? "共享密钥 Secret"
    : usage === "verify"
      ? "公钥 / 证书"
      : "私钥"

  const placeholder = symmetric
    ? "your-256-bit-secret"
    : usage === "verify"
      ? "-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----\n\n也可以直接粘贴 JWK 或 X.509 证书"
      : "-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n\n也可以直接粘贴 JWK（PKCS#8 格式）"

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-2">
          {symmetric ? (
            <Select
              value={encoding}
              onValueChange={(next) => onEncodingChange(next as SecretEncoding)}
            >
              <SelectTrigger size="sm" className="h-7 text-xs" aria-label="密钥编码">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SECRET_ENCODING_LABELS) as SecretEncoding[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SECRET_ENCODING_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {actions}
        </div>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={
          symmetric
            ? "max-h-40 min-h-16 font-mono text-[13px]"
            : "max-h-64 min-h-32 font-mono text-[13px]"
        }
      />
      <p className="text-muted-foreground text-xs">
        {symmetric
          ? "HMAC 使用同一把密钥签名与校验，请注意不要泄露。"
          : usage === "verify"
            ? "支持 SPKI 公钥（-----BEGIN PUBLIC KEY-----）、X.509 证书与 JWK。"
            : "支持 PKCS#8 私钥（-----BEGIN PRIVATE KEY-----）与 JWK。"}
      </p>
    </div>
  )
}
