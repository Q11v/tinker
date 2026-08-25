import {
  compactVerify,
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importJWK,
  importPKCS8,
  importSPKI,
  importX509,
  SignJWT,
  type CryptoKey as JoseCryptoKey,
  type JWK,
} from "jose"

import { formatRelative as formatRelativeMs } from "@/lib/timestamp"

/** 支持的签名算法，按密钥类型分组展示 */
export const ALGORITHM_GROUPS = [
  { key: "hmac", items: ["HS256", "HS384", "HS512"] },
  { key: "rsa", items: ["RS256", "RS384", "RS512"] },
  { key: "rsaPss", items: ["PS256", "PS384", "PS512"] },
  { key: "ecdsa", items: ["ES256", "ES384", "ES512"] },
  { key: "eddsa", items: ["EdDSA"] },
] as const

export const ALGORITHMS = ALGORITHM_GROUPS.flatMap((group) => group.items)

export type KeyMaterial = JoseCryptoKey | Uint8Array

/** HMAC 系列用同一把共享密钥签名和校验，其余算法是公私钥非对称 */
export function isSymmetric(alg: string): boolean {
  return alg.startsWith("HS")
}

export type SecretEncoding = "utf8" | "base64url" | "hex"

export const SECRET_ENCODINGS: SecretEncoding[] = ["utf8", "base64url", "hex"]

/* ------------------------------------------------------------------ */
/* 编解码基础工具                                                       */
/* ------------------------------------------------------------------ */

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/[\s:]/g, "")
  if (clean.length === 0 || clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) {
    throw new JwtCodedError("badHex")
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function decodeSegment(segment: string): unknown {
  const text = new TextDecoder().decode(base64UrlToBytes(segment))
  return JSON.parse(text)
}

/* ------------------------------------------------------------------ */
/* 解码                                                                */
/* ------------------------------------------------------------------ */

export interface DecodedJwt {
  segments: { header: string; payload: string; signature: string }
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  headerError?: JwtError
  payloadError?: JwtError
  /** header.alg，解析失败时为 undefined */
  alg?: string
}

export type DecodeResult = { ok: true; value: DecodedJwt } | { ok: false; error: JwtError }

/**
 * 纯本地解码。即使某一段损坏也尽量把能解出来的部分返回，
 * 这样用户能看到问题出在 header 还是 payload。
 */
export function decodeToken(token: string): DecodeResult {
  const raw = token.trim()
  if (!raw) return { ok: false, error: { code: "empty" } }

  const parts = raw.split(".")
  if (parts.length === 5) return { ok: false, error: { code: "jwe" } }
  if (parts.length !== 3) {
    return { ok: false, error: { code: "segmentCount", params: { count: String(parts.length) } } }
  }

  const [headerB64, payloadB64, signatureB64] = parts
  const result: DecodedJwt = {
    segments: { header: headerB64, payload: payloadB64, signature: signatureB64 },
    header: null,
    payload: null,
  }

  try {
    const header = decodeSegment(headerB64)
    if (typeof header !== "object" || header === null || Array.isArray(header)) {
      throw new JwtCodedError("notObject")
    }
    result.header = header as Record<string, unknown>
    const alg = result.header.alg
    if (typeof alg === "string") result.alg = alg
  } catch (error) {
    result.headerError = errorOf(error)
  }

  try {
    const payload = decodeSegment(payloadB64)
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      throw new JwtCodedError("notObject")
    }
    result.payload = payload as Record<string, unknown>
  } catch (error) {
    result.payloadError = errorOf(error)
  }

  return { ok: true, value: result }
}

/* ------------------------------------------------------------------ */
/* 声明（claims）                                                      */
/* ------------------------------------------------------------------ */

/** 有标准含义的声明，说明文案在字典的 jwt.claims / jwt.headers 里 */
export const REGISTERED_CLAIMS = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"] as const

export const REGISTERED_HEADERS = ["alg", "typ", "cty", "kid", "jku", "x5t"] as const

export type RegisteredClaim = (typeof REGISTERED_CLAIMS)[number]
export type RegisteredHeader = (typeof REGISTERED_HEADERS)[number]

export function isRegisteredClaim(key: string): key is RegisteredClaim {
  return (REGISTERED_CLAIMS as readonly string[]).includes(key)
}

export function isRegisteredHeader(key: string): key is RegisteredHeader {
  return (REGISTERED_HEADERS as readonly string[]).includes(key)
}

const TIME_CLAIMS = new Set(["exp", "nbf", "iat", "auth_time", "updated_at"])

export function isTimeClaim(key: string): boolean {
  return TIME_CLAIMS.has(key)
}

/** 无效时间返回 null，让调用方用当前语言的文案兜底 */
export function formatUnixSeconds(value: number, bcp47: string): string | null {
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(bcp47, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

/** 相对当前时间的人类可读描述，例如「3 小时后」「2 天前」。算法在 lib/time.ts 里，这里只是秒转毫秒的薄封装 */
export function formatRelative(targetSeconds: number, nowSeconds: number, bcp47: string): string {
  return formatRelativeMs(targetSeconds * 1000, nowSeconds * 1000, bcp47)
}

export type CheckStatus = "pass" | "fail" | "skip"

/**
 * 检查项只返回结构化数据，不拼文案。
 * 「2026-01-01 12:00:00（3 天前） · 令牌已过期」这种句子的语序各语言不同，
 * 必须由 UI 层用字典模板组装。
 */
export type ClaimCheck =
  | { kind: "exp"; status: CheckStatus; seconds: number | null }
  | { kind: "nbf"; status: CheckStatus; seconds: number }
  | { kind: "iss"; status: CheckStatus; expected: string; actual: string }
  | { kind: "aud"; status: CheckStatus; expected: string; actual: string }

export interface ClaimCheckOptions {
  issuer?: string
  audience?: string
  clockToleranceSeconds?: number
}

/**
 * 独立于签名校验的时间与身份检查，方便区分
 * 「签名不对」和「签名没问题但令牌过期了」。
 */
export function checkClaims(
  payload: Record<string, unknown> | null,
  options: ClaimCheckOptions = {},
  nowSeconds: number = Math.floor(Date.now() / 1000)
): ClaimCheck[] {
  const checks: ClaimCheck[] = []
  const tolerance = options.clockToleranceSeconds ?? 0
  if (!payload) return checks

  const exp = payload.exp
  if (typeof exp === "number") {
    checks.push({
      kind: "exp",
      status: nowSeconds > exp + tolerance ? "fail" : "pass",
      seconds: exp,
    })
  } else {
    checks.push({ kind: "exp", status: "skip", seconds: null })
  }

  const nbf = payload.nbf
  if (typeof nbf === "number") {
    checks.push({
      kind: "nbf",
      status: nowSeconds + tolerance < nbf ? "fail" : "pass",
      seconds: nbf,
    })
  }

  if (options.issuer) {
    checks.push({
      kind: "iss",
      status: payload.iss === options.issuer ? "pass" : "fail",
      expected: options.issuer,
      actual: JSON.stringify(payload.iss ?? null),
    })
  }

  if (options.audience) {
    const aud = payload.aud
    const list = Array.isArray(aud) ? aud : [aud]
    checks.push({
      kind: "aud",
      status: list.includes(options.audience) ? "pass" : "fail",
      expected: options.audience,
      actual: JSON.stringify(aud ?? null),
    })
  }

  return checks
}

/* ------------------------------------------------------------------ */
/* 错误                                                                */
/* ------------------------------------------------------------------ */

/**
 * 所有对用户可见的错误都用码表示，文案在字典的 jwt.errors 里。
 * native 用来兜底 jose / 浏览器抛出的、我们没有专门处理的错误，
 * 只能把引擎给的英文原文透传出去。
 */
export type JwtErrorCode =
  | "empty"
  | "jwe"
  | "segmentCount"
  | "notObject"
  | "secretRequired"
  | "badBase64Secret"
  | "badHex"
  | "jwkNotJson"
  | "jwkSymmetric"
  | "pkcs1Unsupported"
  | "unknownKeyFormatVerify"
  | "unknownKeyFormatSign"
  | "signatureMismatch"
  | "jwsInvalid"
  | "algMismatch"
  | "algUnsupported"
  | "jwkInvalid"
  | "native"

export interface JwtError {
  code: JwtErrorCode
  params?: Record<string, string>
}

/** 带错误码的异常，跨越 async 边界后仍能还原成结构化错误 */
export class JwtCodedError extends Error {
  constructor(
    readonly code: JwtErrorCode,
    readonly params?: Record<string, string>
  ) {
    super(code)
  }
}

/* ------------------------------------------------------------------ */
/* 密钥                                                                */
/* ------------------------------------------------------------------ */

function secretToBytes(secret: string, encoding: SecretEncoding): Uint8Array {
  if (!secret) throw new JwtCodedError("secretRequired")
  if (encoding === "utf8") return new TextEncoder().encode(secret)
  if (encoding === "hex") return hexToBytes(secret)
  try {
    return base64UrlToBytes(secret.trim())
  } catch {
    throw new JwtCodedError("badBase64Secret")
  }
}

async function importAsymmetric(
  material: string,
  alg: string,
  usage: "verify" | "sign"
): Promise<JoseCryptoKey> {
  const text = material.trim()
  if (!text) throw new JwtCodedError("secretRequired")

  if (text.startsWith("{")) {
    let jwk: JWK
    try {
      jwk = JSON.parse(text) as JWK
    } catch {
      throw new JwtCodedError("jwkNotJson")
    }
    const key = await importJWK(jwk, alg)
    if (key instanceof Uint8Array) {
      throw new JwtCodedError("jwkSymmetric")
    }
    return key
  }

  if (text.includes("BEGIN CERTIFICATE")) return importX509(text, alg)
  if (text.includes("BEGIN PUBLIC KEY")) return importSPKI(text, alg)
  if (text.includes("BEGIN PRIVATE KEY")) return importPKCS8(text, alg)
  if (text.includes("BEGIN RSA PRIVATE KEY")) {
    throw new JwtCodedError("pkcs1Unsupported")
  }

  throw new JwtCodedError(usage === "verify" ? "unknownKeyFormatVerify" : "unknownKeyFormatSign")
}

export async function resolveKey(
  alg: string,
  material: string,
  usage: "verify" | "sign",
  encoding: SecretEncoding = "utf8"
): Promise<KeyMaterial> {
  if (isSymmetric(alg)) return secretToBytes(material, encoding)
  return importAsymmetric(material, alg, usage)
}

export function randomSecret(bytes = 32): string {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return bytesToBase64Url(buffer)
}

export async function generateKeyPairPem(
  alg: string
): Promise<{ privateKey: string; publicKey: string }> {
  const { privateKey, publicKey } = await generateKeyPair(alg, { extractable: true })
  return {
    privateKey: await exportPKCS8(privateKey),
    publicKey: await exportSPKI(publicKey),
  }
}

/* ------------------------------------------------------------------ */
/* 校验与签名                                                          */
/* ------------------------------------------------------------------ */

/** 只校验签名本身，claims 交给 checkClaims 单独判断 */
export async function verifySignature(token: string, key: KeyMaterial, alg: string): Promise<void> {
  await compactVerify(token.trim(), key, { algorithms: [alg] })
}

export interface SignParams {
  alg: string
  payload: Record<string, unknown>
  key: KeyMaterial
  /** 额外的 header 字段，例如 kid */
  header?: Record<string, unknown>
  setIssuedAt?: boolean
  /** jose 支持的时间表达式，例如 "2h"、"7d" */
  expiresIn?: string
}

export async function signToken({
  alg,
  payload,
  key,
  header,
  setIssuedAt,
  expiresIn,
}: SignParams): Promise<string> {
  const signer = new SignJWT(payload).setProtectedHeader({
    ...header,
    alg,
    typ: "JWT",
  })
  if (setIssuedAt) signer.setIssuedAt()
  if (expiresIn?.trim()) signer.setExpirationTime(expiresIn.trim())
  return signer.sign(key)
}

/** 把自己抛的 JwtCodedError 和 jose 抛的错误统一成结构化错误码 */
export function errorOf(error: unknown): JwtError {
  if (error instanceof JwtCodedError) return { code: error.code, params: error.params }
  if (!(error instanceof Error)) return { code: "native", params: { message: String(error) } }

  switch ((error as { code?: string }).code) {
    case "ERR_JWS_SIGNATURE_VERIFICATION_FAILED":
      return { code: "signatureMismatch" }
    case "ERR_JWS_INVALID":
      return { code: "jwsInvalid" }
    case "ERR_JOSE_ALG_NOT_ALLOWED":
      return { code: "algMismatch" }
    case "ERR_JOSE_NOT_SUPPORTED":
      return { code: "algUnsupported", params: { message: error.message } }
    case "ERR_JWK_INVALID":
      return { code: "jwkInvalid", params: { message: error.message } }
    default:
      return { code: "native", params: { message: error.message } }
  }
}

export const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ." +
  "GlWCTPQIvPm7PCP9h_23nMmGa7dmjGsP9P0sOqMcZcQ"

export const SAMPLE_SECRET = "a-string-secret-at-least-256-bits-long"
