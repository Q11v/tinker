export interface Rgb {
  r: number // 0-255
  g: number
  b: number
  a: number // 0-1
}

export interface Hsl {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
  a: number
}

export interface Oklch {
  l: number // 0-1
  c: number // ~0-0.4
  h: number // 0-360，灰色（c≈0）时无意义
  a: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/* ------------------------------------------------------------------ */
/* 解析                                                                 */
/* ------------------------------------------------------------------ */

export type ColorParseResult = { ok: true; rgb: Rgb } | { ok: false; error: string }

function parsePercentOrNumber(text: string, max: number): number | null {
  const trimmed = text.trim()
  if (trimmed.endsWith("%")) {
    const value = Number.parseFloat(trimmed.slice(0, -1))
    if (Number.isNaN(value)) return null
    return (value / 100) * max
  }
  const value = Number.parseFloat(trimmed)
  return Number.isNaN(value) ? null : value
}

function parseAlpha(text: string | undefined): number {
  if (!text) return 1
  const trimmed = text.trim()
  const value = trimmed.endsWith("%")
    ? Number.parseFloat(trimmed.slice(0, -1)) / 100
    : Number.parseFloat(trimmed)
  return Number.isNaN(value) ? 1 : clamp(value, 0, 1)
}

function parseHex(text: string): ColorParseResult | null {
  const match = text.match(/^#?([0-9a-f]{3,8})$/i)
  if (!match) return null
  let hex = match[1]
  if (hex.length === 3 || hex.length === 4) {
    hex = Array.from(hex, (ch) => ch + ch).join("")
  }
  if (hex.length !== 6 && hex.length !== 8) {
    return { ok: false, error: "HEX 长度不对，应该是 3/4/6/8 位" }
  }
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1
  return { ok: true, rgb: { r, g, b, a } }
}

function parseRgbFunc(text: string): ColorParseResult | null {
  const match = text.match(/^rgba?\(\s*([^)]+)\)$/i)
  if (!match) return null
  const parts = match[1].split(/[,\s/]+/).filter(Boolean)
  if (parts.length < 3) return { ok: false, error: "rgb() 至少需要 3 个分量" }
  const r = parsePercentOrNumber(parts[0], 255)
  const g = parsePercentOrNumber(parts[1], 255)
  const b = parsePercentOrNumber(parts[2], 255)
  if (r === null || g === null || b === null) {
    return { ok: false, error: "rgb() 的分量无法识别" }
  }
  return {
    ok: true,
    rgb: { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a: parseAlpha(parts[3]) },
  }
}

function hslToRgbValues(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const light = clamp(l, 0, 100) / 100

  if (sat === 0) {
    const v = light * 255
    return { r: v, g: v, b: v }
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat
  const p = 2 * light - q

  function hueToRgb(t: number): number {
    let temp = t
    if (temp < 0) temp += 1
    if (temp > 1) temp -= 1
    if (temp < 1 / 6) return p + (q - p) * 6 * temp
    if (temp < 1 / 2) return q
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6
    return p
  }

  return {
    r: hueToRgb(hue / 360 + 1 / 3) * 255,
    g: hueToRgb(hue / 360) * 255,
    b: hueToRgb(hue / 360 - 1 / 3) * 255,
  }
}

function parseHslFunc(text: string): ColorParseResult | null {
  const match = text.match(/^hsla?\(\s*([^)]+)\)$/i)
  if (!match) return null
  const parts = match[1].split(/[,\s/]+/).filter(Boolean)
  if (parts.length < 3) return { ok: false, error: "hsl() 至少需要 3 个分量" }
  const h = Number.parseFloat(parts[0])
  const s = Number.parseFloat(parts[1].replace("%", ""))
  const l = Number.parseFloat(parts[2].replace("%", ""))
  if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) {
    return { ok: false, error: "hsl() 的分量无法识别" }
  }
  const { r, g, b } = hslToRgbValues(h, s, l)
  return { ok: true, rgb: { r, g, b, a: parseAlpha(parts[3]) } }
}

function parseOklchFunc(text: string): ColorParseResult | null {
  const match = text.match(/^oklch\(\s*([^)]+)\)$/i)
  if (!match) return null
  const parts = match[1].split(/[,\s/]+/).filter(Boolean)
  if (parts.length < 3) return { ok: false, error: "oklch() 至少需要 3 个分量" }
  const l = parsePercentOrNumber(parts[0], 1)
  const c = Number.parseFloat(parts[1])
  const h = Number.parseFloat(parts[2].replace("deg", ""))
  if (l === null || Number.isNaN(c) || Number.isNaN(h)) {
    return { ok: false, error: "oklch() 的分量无法识别" }
  }
  const rgb = oklchToRgb({ l, c, h, a: parseAlpha(parts[3]) })
  return { ok: true, rgb }
}

export function parseColor(input: string): ColorParseResult {
  const text = input.trim()
  if (!text) return { ok: false, error: "请输入颜色" }
  const lower = text.toLowerCase()

  const result =
    parseHex(lower) ?? parseRgbFunc(lower) ?? parseHslFunc(lower) ?? parseOklchFunc(lower)
  if (result) return result

  return { ok: false, error: "无法识别的颜色格式，支持 HEX / RGB / HSL / OKLCH" }
}

/* ------------------------------------------------------------------ */
/* 格式化                                                               */
/* ------------------------------------------------------------------ */

function toHexByte(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")
}

export function formatHex(rgb: Rgb): string {
  const base = `#${toHexByte(rgb.r)}${toHexByte(rgb.g)}${toHexByte(rgb.b)}`
  return rgb.a < 1 ? `${base}${toHexByte(rgb.a * 255)}` : base
}

export function formatRgb(rgb: Rgb): string {
  const r = Math.round(rgb.r)
  const g = Math.round(rgb.g)
  const b = Math.round(rgb.b)
  return rgb.a < 1 ? `rgba(${r}, ${g}, ${b}, ${round(rgb.a, 2)})` : `rgb(${r}, ${g}, ${b})`
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const delta = max - min

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s: s * 100, l: l * 100, a: rgb.a }
}

export function formatHsl(hsl: Hsl): string {
  const h = round(hsl.h, 1)
  const s = round(hsl.s, 1)
  const l = round(hsl.l, 1)
  return hsl.a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${round(hsl.a, 2)})` : `hsl(${h}, ${s}%, ${l}%)`
}

export function formatOklch(oklch: Oklch): string {
  const l = round(oklch.l, 3)
  const c = round(oklch.c, 3)
  const h = round(oklch.h, 1)
  return oklch.a < 1 ? `oklch(${l} ${c} ${h} / ${round(oklch.a, 2)})` : `oklch(${l} ${c} ${h})`
}

/* ------------------------------------------------------------------ */
/* OKLCH <-> sRGB                                                      */
/* 参照 Björn Ottosson 的 OKLab 参考实现（CSS Color 4 / 现代浏览器同款算法）  */
/* ------------------------------------------------------------------ */

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return v * 255
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const r = srgbToLinear(rgb.r)
  const g = srgbToLinear(rgb.g)
  const b = srgbToLinear(rgb.b)

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

  const c = Math.sqrt(a * a + bb * bb)
  let h = (Math.atan2(bb, a) * 180) / Math.PI
  if (h < 0) h += 360

  return { l: L, c, h: c < 0.0001 ? 0 : h, a: rgb.a }
}

export function oklchToRgb(oklch: Oklch): Rgb {
  const hueRad = (oklch.h * Math.PI) / 180
  const a = Math.cos(hueRad) * oklch.c
  const bb = Math.sin(hueRad) * oklch.c

  const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * bb
  const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * bb
  const s_ = oklch.l - 0.0894841775 * a - 1.291485548 * bb

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return {
    r: clamp(linearToSrgb(r), 0, 255),
    g: clamp(linearToSrgb(g), 0, 255),
    b: clamp(linearToSrgb(b), 0, 255),
    a: oklch.a,
  }
}

/* ------------------------------------------------------------------ */
/* WCAG 对比度                                                         */
/* ------------------------------------------------------------------ */

function relativeLuminance(rgb: Rgb): number {
  const r = srgbToLinear(rgb.r)
  const g = srgbToLinear(rgb.g)
  const b = srgbToLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2 对比度公式，(L1+0.05)/(L2+0.05)，取值范围 1~21 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}
