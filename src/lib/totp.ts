/**
 * TOTP（RFC 6238）与 otpauth:// 链接的纯逻辑部分。
 * HMAC 走 Web Crypto，所以生成验证码是异步的；其余都是同步的字符串处理。
 */

export const TOTP_ALGORITHMS = ["SHA1", "SHA256", "SHA512"] as const
export type TotpAlgorithm = (typeof TOTP_ALGORITHMS)[number]

export const TOTP_DIGITS = [6, 7, 8] as const
export type TotpDigits = (typeof TOTP_DIGITS)[number]

export const TOTP_PERIOD_MIN = 5
export const TOTP_PERIOD_MAX = 300

export interface TotpOptions {
  algorithm: TotpAlgorithm
  digits: TotpDigits
  /** 步长（秒），几乎所有服务都是 30 */
  period: number
}

export const DEFAULT_TOTP_OPTIONS: TotpOptions = { algorithm: "SHA1", digits: 6, period: 30 }

/** otpauth 里写的是 SHA1，Web Crypto 要的是 SHA-1 */
const SUBTLE_HASH: Record<TotpAlgorithm, string> = {
  SHA1: "SHA-1",
  SHA256: "SHA-256",
  SHA512: "SHA-512",
}

/* ------------------------------------------------------------------ */
/* Base32（RFC 4648）                                                  */
/* ------------------------------------------------------------------ */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export type Base32Result = { ok: true; bytes: Uint8Array } | { ok: false; error: "badBase32" }

/**
 * 各家服务给出的密钥写法五花八门：小写、每 4 位一个空格、带 = 补齐或者不带。
 * 这些都按同一个密钥处理，只有真正不在字母表里的字符才报错。
 */
export function normalizeBase32(input: string): string {
  return input.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase()
}

export function base32Decode(input: string): Base32Result {
  const clean = normalizeBase32(input)
  if (!clean || /[^A-Z2-7]/.test(clean)) return { ok: false, error: "badBase32" }

  const bytes = new Uint8Array(Math.floor((clean.length * 5) / 8))
  let buffer = 0
  let bits = 0
  let index = 0
  for (const char of clean) {
    buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes[index] = (buffer >> bits) & 0xff
      index += 1
    }
  }
  if (bytes.length === 0) return { ok: false, error: "badBase32" }
  return { ok: true, bytes }
}

/** 不带 = 补齐：otpauth 链接和各家 App 都习惯这种写法 */
export function base32Encode(bytes: Uint8Array): string {
  let output = ""
  let buffer = 0
  let bits = 0
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      output += BASE32_ALPHABET[(buffer >> bits) & 31]
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31]
  return output
}

/** 160 bit 是 RFC 4226 推荐的密钥长度，也正好编码成 32 个 Base32 字符 */
export function generateSecret(byteLength = 20): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(byteLength)))
}

/** 每 4 个字符一组，照着抄进 App 时不容易看串行 */
export function groupSecret(secret: string): string {
  return normalizeBase32(secret).replace(/(.{4})(?=.)/g, "$1 ")
}

/* ------------------------------------------------------------------ */
/* HOTP / TOTP                                                         */
/* ------------------------------------------------------------------ */

export function totpCounter(unixSeconds: number, period: number): number {
  return Math.floor(unixSeconds / period)
}

/** RFC 4226 的 HOTP：HMAC 后做动态截断，取末尾 digits 位 */
export async function hotp(
  secret: Uint8Array,
  counter: number,
  algorithm: TotpAlgorithm,
  digits: number
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    secret as BufferSource,
    { name: "HMAC", hash: SUBTLE_HASH[algorithm] },
    false,
    ["sign"]
  )

  // 计数器是 8 字节大端整数。JS 的位运算只有 32 位，高低两半分开写
  const message = new DataView(new ArrayBuffer(8))
  message.setUint32(0, Math.floor(counter / 0x100000000))
  message.setUint32(4, counter >>> 0)

  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, message.buffer))
  const offset = mac[mac.length - 1] & 0x0f
  const binary =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3]

  return String(binary % 10 ** digits).padStart(digits, "0")
}

/* ------------------------------------------------------------------ */
/* otpauth:// 链接                                                     */
/* ------------------------------------------------------------------ */

export interface OtpauthData extends TotpOptions {
  secret: string
  issuer: string
  account: string
}

export type OtpauthError = "uriInvalid" | "uriNotTotp" | "uriNoSecret" | "badBase32" | "uriParams"

export type OtpauthResult = { ok: true; data: OtpauthData } | { ok: false; error: OtpauthError }

export function isOtpauthUri(input: string): boolean {
  return /^otpauth:\/\//i.test(input.trim())
}

/**
 * 解析 Google Authenticator 格式的 otpauth://totp/Issuer:account?secret=…
 * 不用 new URL：非特殊协议的解析行为在旧版浏览器里各不相同，手写一个正则更可控。
 */
export function parseOtpauthUri(input: string): OtpauthResult {
  const match = /^otpauth:\/\/([^/?#]+)\/?([^?#]*)(?:\?([^#]*))?/i.exec(input.trim())
  if (!match) return { ok: false, error: "uriInvalid" }

  const [, type, rawLabel, query = ""] = match
  if (type.toLowerCase() !== "totp") return { ok: false, error: "uriNotTotp" }

  let label: string
  try {
    label = decodeURIComponent(rawLabel)
  } catch {
    return { ok: false, error: "uriInvalid" }
  }

  const params = new URLSearchParams(query)
  const secret = params.get("secret") ?? ""
  if (!secret) return { ok: false, error: "uriNoSecret" }
  if (!base32Decode(secret).ok) return { ok: false, error: "badBase32" }

  // label 形如 "Issuer:account"，issuer 参数优先于 label 里的前缀
  const colon = label.indexOf(":")
  const labelIssuer = colon >= 0 ? label.slice(0, colon).trim() : ""
  const account = (colon >= 0 ? label.slice(colon + 1) : label).trim()
  const issuer = params.get("issuer")?.trim() || labelIssuer

  const algorithm = (params.get("algorithm") ?? "SHA1").toUpperCase().replace("-", "")
  const digits = Number(params.get("digits") ?? 6)
  const period = Number(params.get("period") ?? 30)

  if (
    !(TOTP_ALGORITHMS as readonly string[]).includes(algorithm) ||
    !(TOTP_DIGITS as readonly number[]).includes(digits) ||
    !Number.isInteger(period) ||
    period < TOTP_PERIOD_MIN ||
    period > TOTP_PERIOD_MAX
  ) {
    return { ok: false, error: "uriParams" }
  }

  return {
    ok: true,
    data: {
      secret: normalizeBase32(secret),
      issuer,
      account,
      algorithm: algorithm as TotpAlgorithm,
      digits: digits as TotpDigits,
      period,
    },
  }
}

/**
 * 生成可以直接做成二维码的 otpauth 链接。
 * 默认值（SHA1 / 6 位 / 30 秒）不写进参数：有些 App 会忽略它们，有些甚至会因为看到 algorithm 而拒绝导入。
 */
export function buildOtpauthUri(data: OtpauthData): string {
  const issuer = data.issuer.trim()
  const account = data.account.trim()
  // label 里的冒号是分隔符，两边各自编码，冒号本身保持原样
  const label =
    issuer && account
      ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`
      : encodeURIComponent(account || issuer || "TOTP")

  const params = [`secret=${normalizeBase32(data.secret)}`]
  if (issuer) params.push(`issuer=${encodeURIComponent(issuer)}`)
  if (data.algorithm !== DEFAULT_TOTP_OPTIONS.algorithm) params.push(`algorithm=${data.algorithm}`)
  if (data.digits !== DEFAULT_TOTP_OPTIONS.digits) params.push(`digits=${data.digits}`)
  if (data.period !== DEFAULT_TOTP_OPTIONS.period) params.push(`period=${data.period}`)

  return `otpauth://totp/${label}?${params.join("&")}`
}
