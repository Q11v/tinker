/** 错误用码表示，具体文案由 UI 层按当前语言从字典里取 */
export type TimeErrorCode = "empty" | "outOfRange" | "unrecognized"

export type TimeParseResult = { ok: true; ms: number } | { ok: false; error: TimeErrorCode }

/**
 * 纯数字按时间戳处理，按位数自动判断单位（秒 / 毫秒 / 微秒 / 纳秒）；
 * 其余交给 Date 按日期字符串解析（ISO 8601、RFC 2822 等原生格式）。
 */
export function parseTimeInput(text: string): TimeParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: "empty" }

  if (/^[+-]?\d+$/.test(trimmed)) {
    const digits = trimmed.replace(/^[+-]/, "").length
    let ms: number
    if (digits <= 10)
      ms = Number(trimmed) * 1000 // 秒
    else if (digits <= 13)
      ms = Number(trimmed) // 毫秒
    else if (digits <= 16)
      ms = Number(trimmed) / 1000 // 微秒
    else ms = Number(trimmed) / 1_000_000 // 纳秒
    if (!Number.isFinite(ms)) return { ok: false, error: "outOfRange" }
    return { ok: true, ms }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return { ok: false, error: "unrecognized" }
  return { ok: true, ms: date.getTime() }
}

export function formatIso(ms: number): string {
  return new Date(ms).toISOString()
}

export function formatRfc2822(ms: number): string {
  return new Date(ms).toUTCString()
}

/**
 * 相对当前时间的描述，例如「3 小时后」「2 天前」。
 * 交给 Intl.RelativeTimeFormat 而不是自己拼字符串 —— 各语言的复数规则、
 * 词序和「昨天/明天」这类特例都由运行时负责，不需要写进字典。
 */
const RELATIVE_UNITS: { limit: number; ms: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60_000, ms: 1000, unit: "second" },
  { limit: 3_600_000, ms: 60_000, unit: "minute" },
  { limit: 86_400_000, ms: 3_600_000, unit: "hour" },
  { limit: 2_592_000_000, ms: 86_400_000, unit: "day" },
  { limit: 31_536_000_000, ms: 2_592_000_000, unit: "month" },
  { limit: Infinity, ms: 31_536_000_000, unit: "year" },
]

export function formatRelative(targetMs: number, nowMs: number, bcp47: string): string {
  const diff = targetMs - nowMs
  const abs = Math.abs(diff)
  const rtf = new Intl.RelativeTimeFormat(bcp47, { numeric: "auto" })

  if (abs < 1000) return rtf.format(0, "second")

  const scale = RELATIVE_UNITS.find((entry) => abs < entry.limit) ?? RELATIVE_UNITS.at(-1)!
  return rtf.format(Math.trunc(diff / scale.ms), scale.unit)
}

/**
 * 时区只存 IANA id，城市名放在字典的 timestamp.timezones 里。
 * Intl 给不出稳定的城市名（timeZoneName 返回的是「中国标准时间」这类时区名），
 * 所以这一份确实需要人工翻译。
 */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const

export type TimezoneId = (typeof COMMON_TIMEZONES)[number]

export function formatInTimeZone(ms: number, timeZone: string, bcp47: string): string {
  return new Intl.DateTimeFormat(bcp47, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  }).format(new Date(ms))
}

export function getTimeZoneOffset(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(ms))
  return parts.find((part) => part.type === "timeZoneName")?.value ?? ""
}
