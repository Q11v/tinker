"use client"

import { useEffect, useMemo, useState } from "react"

import {
  errorOf,
  isSupportedAlg,
  resolveKey,
  verifySignature,
  type JwtError,
  type SecretEncoding,
} from "@/lib/jwt"

export type SignatureState =
  /** header.alg 是 none：没有签名可验 */
  | { kind: "none" }
  /** header 里没有 alg，或者是本工具不支持的算法 */
  | { kind: "unsupported" }
  /** 没填密钥 */
  | { kind: "skipped" }
  | { kind: "pending" }
  | { kind: "valid" }
  | { kind: "invalid"; error: JwtError }

/**
 * 算法直接取 header.alg，不再让用户另选：选错了只会得到一个必然失败的结论。
 * 输入变化后防抖 250ms 再验，结果与当前输入对不上时报 pending，避免展示过期结论。
 */
export function useSignatureCheck(
  token: string,
  alg: string | undefined,
  key: string,
  encoding: SecretEncoding
): SignatureState {
  const gate = useMemo<SignatureState | null>(() => {
    if (alg === "none") return { kind: "none" }
    if (!isSupportedAlg(alg)) return { kind: "unsupported" }
    if (!key.trim()) return { kind: "skipped" }
    return null
  }, [alg, key])

  const input = JSON.stringify([token.trim(), alg, key, encoding])
  const [result, setResult] = useState<{ input: string; state: SignatureState } | null>(null)

  useEffect(() => {
    if (gate || !alg) return
    let cancelled = false
    const timer = setTimeout(async () => {
      let state: SignatureState
      try {
        const material = await resolveKey(alg, key, "verify", encoding)
        await verifySignature(token, material, alg)
        state = { kind: "valid" }
      } catch (error) {
        state = { kind: "invalid", error: errorOf(error) }
      }
      if (!cancelled)
        setResult({ input: JSON.stringify([token.trim(), alg, key, encoding]), state })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [gate, token, alg, key, encoding])

  return gate ?? (result?.input === input ? result.state : { kind: "pending" })
}
