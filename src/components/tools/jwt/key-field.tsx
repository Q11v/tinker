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
import { useDict } from "@/i18n/context"
import { isSymmetric, SECRET_ENCODINGS, type SecretEncoding } from "@/lib/jwt"

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
  const dict = useDict()
  const text = dict.jwtTool.key
  const symmetric = isSymmetric(alg)

  const label = symmetric
    ? text.secretLabel
    : usage === "verify"
      ? text.publicLabel
      : text.privateLabel

  const placeholder = symmetric
    ? text.secretPlaceholder
    : usage === "verify"
      ? text.publicPlaceholder
      : text.privatePlaceholder

  const note = symmetric ? text.secretNote : usage === "verify" ? text.publicNote : text.privateNote

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
              <SelectTrigger size="sm" className="h-7 text-xs" aria-label={text.encodingLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECRET_ENCODINGS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {dict.jwtTool.secretEncodings[key]}
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
      <p className="text-muted-foreground text-xs">{note}</p>
    </div>
  )
}
