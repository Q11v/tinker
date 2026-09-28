"use client"

import { RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { NumberInput } from "@/components/number-input"
import { SegmentedControl } from "@/components/segmented-control"
import { Panel } from "@/components/tool-panel"
import { QrPreview } from "@/components/tools/qrcode/qr-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNowSeconds } from "@/hooks/use-now-seconds"
import { useDict } from "@/i18n/context"
import { format } from "@/i18n/format"
import type { QrEcc } from "@/lib/qrcode"
import {
  base32Decode,
  buildOtpauthUri,
  DEFAULT_TOTP_OPTIONS,
  generateSecret,
  groupSecret,
  hotp,
  isOtpauthUri,
  parseOtpauthUri,
  TOTP_ALGORITHMS,
  TOTP_DIGITS,
  TOTP_PERIOD_MAX,
  TOTP_PERIOD_MIN,
  totpCounter,
  type OtpauthError,
  type TotpAlgorithm,
  type TotpDigits,
} from "@/lib/totp"
import { cn, monoField } from "@/lib/utils"

const ALGORITHM_OPTIONS = TOTP_ALGORITHMS.map((alg) => ({
  value: alg,
  label: alg.replace("SHA", "SHA-"),
}))

const DIGIT_OPTIONS = TOTP_DIGITS.map((digits) => ({
  value: String(digits),
  label: String(digits),
}))

/** 剩余秒数少于这个值时倒计时变色，提醒用户等下一个再输 */
const EXPIRING_SECONDS = 5

/** 前后各算一个时间窗：服务端通常也容忍 ±1 步的时钟偏差，校验时一起比 */
const WINDOWS = [-1, 0, 1] as const
type Window = (typeof WINDOWS)[number]

/** 123 456 / 1234 5678，和手机 App 的显示习惯一致 */
function splitCode(code: string): string {
  const half = Math.floor(code.length / 2)
  return `${code.slice(0, half)} ${code.slice(half)}`
}

export function TotpTool() {
  const dict = useDict()
  const text = dict.totpTool

  const [secretInput, setSecretInput] = useState("")
  const [uriError, setUriError] = useState<OtpauthError | null>(null)
  const [algorithm, setAlgorithm] = useState<TotpAlgorithm>(DEFAULT_TOTP_OPTIONS.algorithm)
  const [digits, setDigits] = useState<TotpDigits>(DEFAULT_TOTP_OPTIONS.digits)
  const [period, setPeriod] = useState(DEFAULT_TOTP_OPTIONS.period)
  const [issuer, setIssuer] = useState("")
  const [account, setAccount] = useState("")
  const [ecc, setEcc] = useState<QrEcc>("M")
  const [verify, setVerify] = useState("")
  /** 三个时间窗的验证码，连同算出它们时的计数器一起存，避免新旧结果混用 */
  const [codes, setCodes] = useState<{ counter: number; values: Record<Window, string> } | null>(
    null
  )

  const now = useNowSeconds()
  const counter = totpCounter(now, period)
  const remaining = period - (now % period)

  const decoded = useMemo(() => base32Decode(secretInput), [secretInput])
  const secretBytes = decoded.ok ? decoded.bytes : null

  const errorKey: OtpauthError | null = uriError
    ? uriError
    : secretInput.trim() && !decoded.ok
      ? decoded.error
      : null

  useEffect(() => {
    if (!secretBytes) return
    let cancelled = false

    Promise.all(WINDOWS.map((w) => hotp(secretBytes, counter + w, algorithm, digits))).then(
      ([previous, current, next]) => {
        if (!cancelled) setCodes({ counter, values: { [-1]: previous, 0: current, 1: next } })
      }
    )
    return () => {
      cancelled = true
    }
  }, [secretBytes, counter, algorithm, digits])

  // 密钥清空或变得不合法时，旧验证码不该还挂在屏幕上
  const values = secretBytes && codes?.counter === counter ? codes.values : null

  function handleSecretChange(value: string) {
    if (!isOtpauthUri(value)) {
      setSecretInput(value)
      setUriError(null)
      return
    }

    const parsed = parseOtpauthUri(value)
    if (!parsed.ok) {
      setSecretInput(value)
      setUriError(parsed.error)
      return
    }

    const { data } = parsed
    setSecretInput(data.secret)
    setUriError(null)
    setAlgorithm(data.algorithm)
    setDigits(data.digits)
    setPeriod(data.period)
    setIssuer(data.issuer)
    setAccount(data.account)
    toast.success(text.imported)
  }

  function randomize() {
    setSecretInput(generateSecret())
    setUriError(null)
  }

  const uri = secretBytes
    ? buildOtpauthUri({ secret: secretInput, issuer, account, algorithm, digits, period })
    : ""

  // 粘进来的验证码落在哪个时间窗里
  const verifyTarget = verify.replace(/\s/g, "")
  const verifyHit =
    values && verifyTarget ? (WINDOWS.find((w) => values[w] === verifyTarget) ?? null) : null
  const verifyFilled = verifyTarget.length > 0

  const verifyText: Record<Window, string> = {
    [-1]: text.verifyPrevious,
    0: text.verifyCurrent,
    1: text.verifyNext,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          accent="violet"
          title={text.secretTitle}
          hint={text.secretHint}
          action={
            <Button type="button" variant="ghost" size="sm" onClick={randomize}>
              <RefreshCw className="size-3.5" />
              {text.generate}
            </Button>
          }
          footer={text.secretFooter}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-secret" className="sr-only">
                {text.secretLabel}
              </Label>
              <Input
                id="totp-secret"
                value={secretInput}
                onChange={(event) => handleSecretChange(event.target.value)}
                placeholder={text.secretPlaceholder}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={errorKey ? true : undefined}
                className={cn(monoField, "h-9")}
              />
              {errorKey ? (
                <p className="text-destructive text-xs">{dict.errors.totp[errorKey]}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label id="totp-algorithm-label">{text.algorithmLabel}</Label>
                <div role="group" aria-labelledby="totp-algorithm-label">
                  <SegmentedControl
                    value={algorithm}
                    onChange={setAlgorithm}
                    options={ALGORITHM_OPTIONS}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label id="totp-digits-label">{text.digitsLabel}</Label>
                <div role="group" aria-labelledby="totp-digits-label">
                  <SegmentedControl
                    value={String(digits)}
                    onChange={(value) => setDigits(Number(value) as TotpDigits)}
                    options={DIGIT_OPTIONS}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totp-period">{text.periodLabel}</Label>
                <NumberInput
                  id="totp-period"
                  value={period}
                  onValueChange={setPeriod}
                  min={TOTP_PERIOD_MIN}
                  max={TOTP_PERIOD_MAX}
                  className={cn(monoField, "h-7 w-20")}
                />
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          accent="sky"
          title={text.codeTitle}
          hint={format(text.codeHint, { period })}
          action={values ? <CopyButton value={values[0]} label={dict.common.copy} /> : null}
          footer={text.clockNote}
        >
          {values ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <output
                  aria-label={text.codeLabel}
                  className="font-mono text-4xl font-semibold tracking-[0.12em] tabular-nums sm:text-5xl"
                >
                  {splitCode(values[0])}
                </output>
                <div className="flex w-full max-w-64 flex-col items-center gap-1.5">
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-1000 ease-linear",
                        remaining <= EXPIRING_SECONDS ? "bg-destructive" : "bg-sky-500"
                      )}
                      style={{ width: `${(remaining / period) * 100}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      remaining <= EXPIRING_SECONDS ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {format(text.remaining, { seconds: remaining })}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2 border-t pt-4">
                {(
                  [
                    [-1, text.previous],
                    [1, text.next],
                  ] as const
                ).map(([w, label]) => (
                  <div key={w} className="bg-muted/60 rounded-lg px-3 py-2">
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-foreground/80 font-mono text-sm tabular-nums">
                      {splitCode(values[w])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{text.emptyState}</p>
          )}
        </Panel>
      </div>

      <div className="bg-muted dark:bg-surface-raised flex items-center gap-3 rounded-[12px] px-4 py-[13px]">
        <span className="text-label-mono text-muted-foreground shrink-0">{text.verifyLabel}</span>
        <input
          value={verify}
          onChange={(event) => setVerify(event.target.value)}
          placeholder={text.verifyPlaceholder}
          aria-label={text.verifyLabel}
          inputMode="numeric"
          spellCheck={false}
          autoComplete="off"
          // 16px 起步，iOS Safari 聚焦小字号输入框会把整页放大且不缩回
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent font-mono text-base outline-none md:text-[12.5px]"
        />
        <span
          aria-live="polite"
          className={cn(
            "shrink-0 rounded-[8px] border px-[11px] py-[5px] text-xs",
            (!verifyFilled || !values) && "text-muted-foreground",
            verifyFilled &&
              values &&
              verifyHit !== null &&
              "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
            verifyFilled &&
              values &&
              verifyHit === null &&
              "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {!verifyFilled || !values
            ? text.verifyIdle
            : verifyHit !== null
              ? verifyText[verifyHit]
              : text.verifyMismatch}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel accent="rose" title={text.bindTitle} hint={text.bindHint}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totp-issuer">{text.issuerLabel}</Label>
                <Input
                  id="totp-issuer"
                  value={issuer}
                  onChange={(event) => setIssuer(event.target.value)}
                  placeholder={text.issuerPlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totp-account">{text.accountLabel}</Label>
                <Input
                  id="totp-account"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  placeholder={text.accountPlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>

            {uri ? (
              <>
                <div className="space-y-1.5 border-t pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{text.manualSecretLabel}</span>
                    <CopyButton
                      value={groupSecret(secretInput)}
                      size="icon"
                      ariaLabel={text.manualSecretLabel}
                    />
                  </div>
                  <p className="font-mono text-[13px] break-all">{groupSecret(secretInput)}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{text.uriLabel}</span>
                    <CopyButton value={uri} size="icon" ariaLabel={text.uriLabel} />
                  </div>
                  <p className="font-mono text-[13px] break-all">{uri}</p>
                </div>
              </>
            ) : null}
          </div>
        </Panel>

        <QrPreview
          value={uri}
          ecc={ecc}
          onEccChange={setEcc}
          emptyState={text.qrEmpty}
          filename="totp-qrcode"
        />
      </div>
    </div>
  )
}
