"use client"

import type { SignatureState } from "@/components/tools/jwt/use-signature-check"
import { TONE, type Tone } from "@/components/tools/jwt/tones"
import { useDict } from "@/i18n/context"
import type { Dictionary } from "@/i18n/dictionaries"
import { format } from "@/i18n/format"
import { isSymmetric, type ClaimCheck } from "@/lib/jwt"
import { cn } from "@/lib/utils"

interface Verdict {
  tone: Tone
  title: string
  body: string
  badge?: string
  footer?: string
}

/**
 * 一句话结论。优先级从「不能信」到「能信」：
 * 无签名 > 签名不对 > 已过期 > 未生效 > 没法验 / 没验 / 验证中 > 有效。
 * 签名没验的时候照样报过期 —— 过期与否不需要密钥就能判断。
 */
function verdictOf(
  signature: SignatureState,
  checks: ClaimCheck[],
  alg: string | undefined,
  dict: Dictionary
): Verdict {
  const text = dict.jwtTool.verdict
  const verified = signature.kind === "valid"
  const badge =
    signature.kind === "valid"
      ? text.badgeValid
      : signature.kind === "pending"
        ? undefined
        : text.badgeUnverified

  if (signature.kind === "none") {
    return { tone: "bad", title: text.algNoneTitle, body: text.algNoneBody, badge: text.badgeNone }
  }

  if (signature.kind === "invalid") {
    const mismatch = signature.error.code === "signatureMismatch"
    return {
      tone: "warn",
      title: text.mismatchTitle,
      body: mismatch
        ? text.mismatchBody
        : format(dict.errors.jwt[signature.error.code], signature.error.params ?? {}),
      footer: mismatch && alg && isSymmetric(alg) ? `${alg} · ${text.mismatchHint}` : undefined,
    }
  }

  const failed = (kind: ClaimCheck["kind"]) =>
    checks.some((check) => check.kind === kind && check.status === "fail")

  if (failed("exp")) {
    return {
      tone: "bad",
      title: text.expiredTitle,
      body: verified ? text.expiredBody : text.expiredUnverifiedBody,
      badge,
    }
  }

  if (failed("nbf")) {
    return {
      tone: "warn",
      title: text.notYetTitle,
      body: verified ? text.notYetBody : text.notYetUnverifiedBody,
      badge,
    }
  }

  if (signature.kind === "unsupported") {
    return {
      tone: "neutral",
      title: text.unsupportedTitle,
      body: format(text.unsupportedBody, { alg: alg ?? "—" }),
    }
  }
  if (signature.kind === "skipped") {
    return { tone: "neutral", title: text.unverifiedTitle, body: text.unverifiedBody }
  }
  if (signature.kind === "pending") {
    return { tone: "neutral", title: text.pendingTitle, body: text.pendingBody }
  }

  return { tone: "good", title: text.validTitle, body: text.validBody, badge: text.badgeValid }
}

export function VerdictCard({
  signature,
  checks,
  alg,
}: {
  signature: SignatureState
  checks: ClaimCheck[]
  alg: string | undefined
}) {
  const dict = useDict()
  const verdict = verdictOf(signature, checks, alg, dict)
  const tone = TONE[verdict.tone]

  return (
    <div
      aria-live="polite"
      className={cn("flex flex-col gap-3 rounded-[16px] border p-4", tone.box)}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("size-[9px] shrink-0 rounded-full", tone.dot)} />
        <p className={cn("text-[15px] font-semibold", tone.ink)}>{verdict.title}</p>
        {verdict.badge ? (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-[5px] px-2 py-0.5 font-mono text-[11px]",
              tone.chip
            )}
          >
            {verdict.badge}
          </span>
        ) : null}
      </div>
      <p className="text-foreground/80 text-[12.5px] leading-[1.65] text-pretty">{verdict.body}</p>
      {verdict.footer ? (
        <p className={cn("font-mono text-[11.5px] opacity-80", tone.ink)}>{verdict.footer}</p>
      ) : null}
    </div>
  )
}
