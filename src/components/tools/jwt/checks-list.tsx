"use client"

import { Check, Minus, X } from "lucide-react"

import type { SignatureState } from "@/components/tools/jwt/use-signature-check"
import { TONE } from "@/components/tools/jwt/tones"
import { LOCALE_HTML_LANG } from "@/i18n/config"
import { useI18n } from "@/i18n/context"
import { format } from "@/i18n/format"
import { formatRelative, isSupportedAlg, type CheckStatus, type ClaimCheck } from "@/lib/jwt"
import { cn } from "@/lib/utils"

const MARK = {
  pass: { icon: Check, className: TONE.good.chip },
  fail: { icon: X, className: TONE.bad.chip },
  skip: { icon: Minus, className: TONE.neutral.chip },
} as const

interface Row {
  key: string
  name: string
  status: CheckStatus
  detail: string
}

/** 逐项检查：签名 / exp / nbf / alg，每项一行，右端是翻成人话的细节 */
export function ChecksList({
  signature,
  checks,
  alg,
  nowSeconds,
}: {
  signature: SignatureState
  checks: ClaimCheck[]
  alg: string | undefined
  nowSeconds: number
}) {
  const { locale, dict } = useI18n()
  const text = dict.jwtTool.checks
  const details = text.details
  const bcp47 = LOCALE_HTML_LANG[locale]
  const relative = (seconds: number) => formatRelative(seconds, nowSeconds, bcp47)
  const algName = alg ?? "—"

  const signatureRow: Row = (() => {
    const base = { key: "signature", name: text.signature }
    switch (signature.kind) {
      case "valid":
        return { ...base, status: "pass", detail: format(details.sigMatch, { alg: algName }) }
      case "invalid":
        return {
          ...base,
          status: "fail",
          detail:
            signature.error.code === "signatureMismatch"
              ? format(details.sigMismatch, { alg: algName })
              : details.sigUnavailable,
        }
      case "skipped":
        return { ...base, status: "skip", detail: details.sigSkipped }
      case "pending":
        return { ...base, status: "skip", detail: details.sigPending }
      case "none":
        return { ...base, status: "fail", detail: details.sigUnavailable }
      case "unsupported":
        return { ...base, status: "skip", detail: details.sigUnavailable }
    }
  })()

  const exp = checks.find((check) => check.kind === "exp")
  const expRow: Row = {
    key: "exp",
    name: text.exp,
    status: exp?.status ?? "skip",
    detail:
      !exp || exp.kind !== "exp" || exp.seconds === null
        ? details.expNotSet
        : format(exp.status === "fail" ? details.expired : details.expiresIn, {
            relative: relative(exp.seconds),
          }),
  }

  const nbf = checks.find((check) => check.kind === "nbf")
  const nbfRow: Row =
    nbf && nbf.kind === "nbf"
      ? {
          key: "nbf",
          name: text.nbf,
          status: nbf.status,
          detail: format(nbf.status === "fail" ? details.nbfPending : details.nbfPassed, {
            relative: relative(nbf.seconds),
          }),
        }
      : { key: "nbf", name: text.nbf, status: "skip", detail: details.nbfNotSet }

  const algRow: Row = {
    key: "alg",
    name: text.alg,
    ...(alg === undefined
      ? { status: "fail", detail: details.algMissing }
      : alg === "none"
        ? { status: "fail", detail: details.algNone }
        : isSupportedAlg(alg)
          ? { status: "pass", detail: format(details.algOk, { alg }) }
          : { status: "fail", detail: format(details.algUnsupported, { alg }) }),
  }

  const rows = [signatureRow, expRow, nbfRow, algRow]

  return (
    <ul className="bg-surface flex flex-col gap-0.5 rounded-[16px] border px-2.5 py-2">
      {rows.map((row) => {
        const mark = MARK[row.status]
        const Icon = mark.icon
        return (
          <li key={row.key} className="flex items-center gap-3 rounded-[10px] px-2.5 py-[9px]">
            <span
              className={cn(
                "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                mark.className
              )}
            >
              <Icon className="size-3" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-[13px] font-medium">{row.name}</span>
            <span className="text-muted-foreground ml-auto text-right text-[11.5px]">
              {row.detail}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
