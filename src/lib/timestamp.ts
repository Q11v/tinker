export type TimeParseResult =
  | { ok: true; ms: number }
  | { ok: false; error: string }

/**
 * 纯数字按时间戳处理，按位数自动判断单位（秒 / 毫秒 / 微秒 / 纳秒）；
 * 其余交给 Date 按日期字符串解析（ISO 8601、RFC 2822 等原生格式）。
 */
export function parseTimeInput(text: string): TimeParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: "请输入时间戳或日期" }

  if (/^[+-]?\d+$/.test(trimmed)) {
    const digits = trimmed.replace(/^[+-]/, "").length
    let ms: number
    if (digits <= 10) ms = Number(trimmed) * 1000 // 秒
    else if (digits <= 13) ms = Number(trimmed) // 毫秒
    else if (digits <= 16) ms = Number(trimmed) / 1000 // 微秒
    else ms = Number(trimmed) / 1_000_000 // 纳秒
    if (!Number.isFinite(ms)) return { ok: false, error: "数字超出可表示范围" }
    return { ok: true, ms }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return { ok: false, error: "无法识别的时间格式" }
  return { ok: true, ms: date.getTime() }
}

export function formatIso(ms: number): string {
  return new Date(ms).toISOString()
}

export function formatRfc2822(ms: number): string {
  return new Date(ms).toUTCString()
}

/** 相对当前时间的人类可读描述，例如「3 小时后」「2 天前」 */
export function formatRelative(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs
  const abs = Math.abs(diff)
  if (abs < 1000) return "刚刚"

  let text: string
  if (abs < 60_000) text = `${Math.floor(abs / 1000)} 秒`
  else if (abs < 3_600_000) text = `${Math.floor(abs / 60_000)} 分钟`
  else if (abs < 86_400_000) text = `${Math.floor(abs / 3_600_000)} 小时`
  else if (abs < 2_592_000_000) text = `${Math.floor(abs / 86_400_000)} 天`
  else if (abs < 31_536_000_000) text = `${Math.floor(abs / 2_592_000_000)} 个月`
  else text = `${Math.floor(abs / 31_536_000_000)} 年`
  return diff >= 0 ? `${text}后` : `${text}前`
}

export interface TimezoneRow {
  id: string
  label: string
}

export const COMMON_TIMEZONES: TimezoneRow[] = [
  { id: "UTC", label: "UTC" },
  { id: "America/Los_Angeles", label: "洛杉矶" },
  { id: "America/New_York", label: "纽约" },
  { id: "Europe/London", label: "伦敦" },
  { id: "Europe/Paris", label: "巴黎" },
  { id: "Asia/Dubai", label: "迪拜" },
  { id: "Asia/Kolkata", label: "新德里" },
  { id: "Asia/Shanghai", label: "北京 / 上海" },
  { id: "Asia/Tokyo", label: "东京" },
  { id: "Australia/Sydney", label: "悉尼" },
]

export function formatInTimeZone(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
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
