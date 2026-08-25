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
  { label: "HMAC（共享密钥）", items: ["HS256", "HS384", "HS512"] },
  { label: "RSA（公私钥）", items: ["RS256", "RS384", "RS512"] },
  { label: "RSA-PSS（公私钥）", items: ["PS256", "PS384", "PS512"] },
  { label: "ECDSA（公私钥）", items: ["ES256", "ES384", "ES512"] },
  { label: "EdDSA（公私钥）", items: ["EdDSA"] },
] as const

export const ALGORITHMS = ALGORITHM_GROUPS.flatMap((group) => group.items)

export type KeyMaterial = JoseCryptoKey | Uint8Array

/** HMAC 系列用同一把共享密钥签名和校验，其余算法是公私钥非对称 */
export function isSymmetric(alg: string): boolean {
  return alg.startsWith("HS")
}

export type SecretEncoding = "utf8" | "base64url" | "hex"

export const SECRET_ENCODING_LABELS: Record<SecretEncoding, string> = {
  utf8: "UTF-8 文本",
  base64url: "Base64 / Base64URL",
  hex: "十六进制",
}

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
    throw new Error("不是合法的十六进制字符串")
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
  headerError?: string
  payloadError?: string
  /** header.alg，解析失败时为 undefined */
  alg?: string
}

export type DecodeResult = { ok: true; value: DecodedJwt } | { ok: false; error: string }

/**
 * 纯本地解码。即使某一段损坏也尽量把能解出来的部分返回，
 * 这样用户能看到问题出在 header 还是 payload。
 */
export function decodeToken(token: string): DecodeResult {
  const raw = token.trim()
  if (!raw) return { ok: false, error: "请输入一个 JWT。" }

  const parts = raw.split(".")
  if (parts.length === 5) {
    return {
      ok: false,
      error: "这是一个 JWE（加密令牌，5 段），本工具只处理 JWS 形式的 JWT（3 段）。",
    }
  }
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `JWT 应由 "." 分隔的 3 段组成，当前是 ${parts.length} 段。`,
    }
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
      throw new Error("header 不是 JSON 对象")
    }
    result.header = header as Record<string, unknown>
    const alg = result.header.alg
    if (typeof alg === "string") result.alg = alg
  } catch (error) {
    result.headerError = `Header 解析失败：${messageOf(error)}`
  }

  try {
    const payload = decodeSegment(payloadB64)
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      throw new Error("payload 不是 JSON 对象")
    }
    result.payload = payload as Record<string, unknown>
  } catch (error) {
    result.payloadError = `Payload 解析失败：${messageOf(error)}`
  }

  return { ok: true, value: result }
}

/* ------------------------------------------------------------------ */
/* 声明（claims）                                                      */
/* ------------------------------------------------------------------ */

export const REGISTERED_CLAIMS: Record<string, string> = {
  iss: "签发者 Issuer",
  sub: "主题 Subject",
  aud: "受众 Audience",
  exp: "过期时间 Expiration",
  nbf: "生效时间 Not Before",
  iat: "签发时间 Issued At",
  jti: "唯一标识 JWT ID",
}

export const REGISTERED_HEADERS: Record<string, string> = {
  alg: "签名算法",
  typ: "令牌类型",
  cty: "内容类型",
  kid: "密钥 ID",
  jku: "JWK Set URL",
  x5t: "证书指纹",
}

const TIME_CLAIMS = new Set(["exp", "nbf", "iat", "auth_time", "updated_at"])

export function isTimeClaim(key: string): boolean {
  return TIME_CLAIMS.has(key)
}

export function formatUnixSeconds(value: number): string {
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return "无效时间"
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

/** 相对当前时间的人类可读描述，例如「3 小时后」「2 天前」。算法在 lib/time.ts 里，这里只是秒转毫秒的薄封装 */
export function formatRelative(targetSeconds: number, nowSeconds: number): string {
  return formatRelativeMs(targetSeconds * 1000, nowSeconds * 1000)
}

export type CheckStatus = "pass" | "fail" | "skip"

export interface ClaimCheck {
  label: string
  status: CheckStatus
  detail: string
}

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
    const expired = nowSeconds > exp + tolerance
    checks.push({
      label: "过期时间 exp",
      status: expired ? "fail" : "pass",
      detail: `${formatUnixSeconds(exp)}（${formatRelative(exp, nowSeconds)}）${
        expired ? " · 令牌已过期" : ""
      }`,
    })
  } else {
    checks.push({ label: "过期时间 exp", status: "skip", detail: "未设置，令牌永不过期" })
  }

  const nbf = payload.nbf
  if (typeof nbf === "number") {
    const notYet = nowSeconds + tolerance < nbf
    checks.push({
      label: "生效时间 nbf",
      status: notYet ? "fail" : "pass",
      detail: `${formatUnixSeconds(nbf)}（${formatRelative(nbf, nowSeconds)}）${
        notYet ? " · 尚未生效" : ""
      }`,
    })
  }

  if (options.issuer) {
    const matched = payload.iss === options.issuer
    checks.push({
      label: "签发者 iss",
      status: matched ? "pass" : "fail",
      detail: matched
        ? `与期望值一致：${options.issuer}`
        : `期望 ${options.issuer}，实际 ${JSON.stringify(payload.iss ?? null)}`,
    })
  }

  if (options.audience) {
    const aud = payload.aud
    const list = Array.isArray(aud) ? aud : [aud]
    const matched = list.includes(options.audience)
    checks.push({
      label: "受众 aud",
      status: matched ? "pass" : "fail",
      detail: matched
        ? `包含期望值：${options.audience}`
        : `期望包含 ${options.audience}，实际 ${JSON.stringify(aud ?? null)}`,
    })
  }

  return checks
}

/* ------------------------------------------------------------------ */
/* 密钥                                                                */
/* ------------------------------------------------------------------ */

function secretToBytes(secret: string, encoding: SecretEncoding): Uint8Array {
  if (!secret) throw new Error("请输入密钥")
  if (encoding === "utf8") return new TextEncoder().encode(secret)
  if (encoding === "hex") return hexToBytes(secret)
  try {
    return base64UrlToBytes(secret.trim())
  } catch {
    throw new Error("不是合法的 Base64 / Base64URL 字符串")
  }
}

async function importAsymmetric(
  material: string,
  alg: string,
  usage: "verify" | "sign"
): Promise<JoseCryptoKey> {
  const text = material.trim()
  if (!text) throw new Error("请输入密钥")

  if (text.startsWith("{")) {
    let jwk: JWK
    try {
      jwk = JSON.parse(text) as JWK
    } catch {
      throw new Error("JWK 不是合法的 JSON")
    }
    const key = await importJWK(jwk, alg)
    if (key instanceof Uint8Array) {
      throw new Error("这是一把对称密钥（oct），请改用 HS 系列算法")
    }
    return key
  }

  if (text.includes("BEGIN CERTIFICATE")) return importX509(text, alg)
  if (text.includes("BEGIN PUBLIC KEY")) return importSPKI(text, alg)
  if (text.includes("BEGIN PRIVATE KEY")) return importPKCS8(text, alg)
  if (text.includes("BEGIN RSA PRIVATE KEY")) {
    throw new Error("PKCS#1 格式暂不支持，请转换为 PKCS#8（-----BEGIN PRIVATE KEY-----）")
  }

  throw new Error(
    usage === "verify"
      ? "无法识别密钥格式，请粘贴 SPKI 公钥（-----BEGIN PUBLIC KEY-----）、X.509 证书或 JWK"
      : "无法识别密钥格式，请粘贴 PKCS#8 私钥（-----BEGIN PRIVATE KEY-----）或 JWK"
  )
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

/** 把 jose 抛出的错误翻译成看得懂的中文提示 */
export function messageOf(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const code = (error as { code?: string }).code
  switch (code) {
    case "ERR_JWS_SIGNATURE_VERIFICATION_FAILED":
      return "签名校验失败：密钥与该 Token 不匹配。"
    case "ERR_JWS_INVALID":
      return "Token 结构不合法，无法作为 JWS 解析。"
    case "ERR_JOSE_ALG_NOT_ALLOWED":
      return "Token header 中的算法与所选算法不一致。"
    case "ERR_JOSE_NOT_SUPPORTED":
      return `当前浏览器或参数不支持该算法：${error.message}`
    case "ERR_JWK_INVALID":
      return `JWK 不合法：${error.message}`
    default:
      return error.message
  }
}

export const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsInJvbGVzIjpbImFkbWluIl0sImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ." +
  "GlWCTPQIvPm7PCP9h_23nMmGa7dmjGsP9P0sOqMcZcQ"

export const SAMPLE_SECRET = "a-string-secret-at-least-256-bits-long"
